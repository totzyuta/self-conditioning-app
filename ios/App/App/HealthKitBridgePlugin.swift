import Foundation
import Capacitor
import HealthKit

@objc(HealthKitBridgePlugin)
public class HealthKitBridgePlugin: CAPPlugin {

    private let store = HKHealthStore()

    private var bodyMassType: HKQuantityType? {
        HKObjectType.quantityType(forIdentifier: .bodyMass)
    }

    private var stepCountType: HKQuantityType? {
        HKObjectType.quantityType(forIdentifier: .stepCount)
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Health data not available on this device")
            return
        }
        guard let mass = bodyMassType, let steps = stepCountType else {
            call.reject("Failed to resolve HealthKit types")
            return
        }
        let read: Set<HKObjectType> = [mass, steps]
        store.requestAuthorization(toShare: [], read: read) { ok, error in
            if let error = error {
                call.reject(error.localizedDescription)
                return
            }
            call.resolve(["granted": ok])
        }
    }

    /// Reads recent body mass samples and daily step totals for the last `days` calendar days (local timezone).
    @objc func syncLatest(_ call: CAPPluginCall) {
        let days = call.getInt("days") ?? 21
        guard days > 0, days <= 366 else {
            call.reject("Invalid days")
            return
        }
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["weights": [], "stepsByDate": []])
            return
        }
        guard let massType = bodyMassType, let stepType = stepCountType else {
            call.reject("Types unavailable")
            return
        }

        let calendar = Calendar.current
        let end = Date()
        guard let start = calendar.date(byAdding: .day, value: -days, to: calendar.startOfDay(for: end)) else {
            call.reject("Date range error")
            return
        }

        let group = DispatchGroup()
        var weightPayload: [[String: Any]] = []
        var stepsPayload: [[String: Any]] = []
        var weightErr: String?

        group.enter()
        let massPredicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        let massQuery = HKSampleQuery(
            sampleType: massType,
            predicate: massPredicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { _, samples, error in
            if let error = error {
                DispatchQueue.main.async {
                    weightErr = error.localizedDescription
                    group.leave()
                }
                return
            }
            guard let samples = samples as? [HKQuantitySample] else {
                DispatchQueue.main.async { group.leave() }
                return
            }

            var byDay: [String: HKQuantitySample] = [:]
            for s in samples {
                let day = self.ymd(s.endDate, calendar: calendar)
                if byDay[day] == nil { byDay[day] = s }
            }
            let mapped = byDay.map { day, sample in
                let kg = sample.quantity.doubleValue(for: HKUnit.gramUnit(with: .kilo))
                let iso = ISO8601DateFormatter().string(from: sample.endDate)
                return ["date": day, "kg": kg, "endDateIso": iso]
            }.sorted { ($0["date"] as? String ?? "") < ($1["date"] as? String ?? "") }
            DispatchQueue.main.async {
                weightPayload = mapped
                group.leave()
            }
        }
        store.execute(massQuery)

        group.enter()
        DispatchQueue.global(qos: .utility).async {
            var out: [[String: Any]] = []
            for offset in 0..<days {
                guard let dayStart = calendar.date(byAdding: .day, value: -offset, to: calendar.startOfDay(for: end)) else { continue }
                let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart)!
                let pred = HKQuery.predicateForSamples(withStart: dayStart, end: dayEnd, options: .strictStartDate)
                let sem = DispatchSemaphore(value: 0)
                var daySteps: Double = 0
                let q = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, _ in
                    if let sum = stats?.sumQuantity() {
                        daySteps = sum.doubleValue(for: HKUnit.count())
                    }
                    sem.signal()
                }
                self.store.execute(q)
                sem.wait()
                let ymd = self.ymd(dayStart, calendar: calendar)
                if daySteps > 0 {
                    out.append(["date": ymd, "steps": Int(daySteps.rounded())])
                }
            }
            let sorted = out.sorted { ($0["date"] as? String ?? "") > ($1["date"] as? String ?? "") }
            DispatchQueue.main.async {
                stepsPayload = sorted
                group.leave()
            }
        }

        group.notify(queue: .main) {
            if let weightErr = weightErr {
                call.reject(weightErr)
                return
            }
            call.resolve([
                "weights": weightPayload,
                "stepsByDate": stepsPayload
            ])
        }
    }

    private func ymd(_ date: Date, calendar: Calendar) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        let y = c.year ?? 0
        let m = c.month ?? 0
        let d = c.day ?? 0
        return String(format: "%04d-%02d-%02d", y, m, d)
    }
}
