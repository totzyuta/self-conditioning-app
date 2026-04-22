import { Capacitor } from "@capacitor/core";
import { HealthKitBridge } from "../plugins/healthKitBridge.js";
import { putRemoteDayV2 } from "./apiV2.js";

function hasManualWeight(day) {
  if (!day) return false;
  const w = day.weight;
  return w != null && w !== "" && Number.isFinite(Number(w));
}

function hasManualSteps(day) {
  if (!day) return false;
  const s = day.steps;
  if (s == null || s === "" || !Number.isFinite(Number(s))) return false;
  return Math.trunc(Number(s)) !== 0;
}

/**
 * Merge HealthKit samples into v2 state. Manual entries win for primary `weight` / `steps`
 * (steps count `0` is treated as no manual value so HK can fill `steps`);
 * HK-only values go into `hkWeight` / `hkSteps` when manual exists.
 * Returns next state and remote PUT rows for days where primary fields were updated from HK.
 */
export function mergeHealthKitIntoV2(prevV2, { weights = [], stepsByDate = [] }, nowIso) {
  const putRows = [];
  const next = {
    ...prevV2,
    weightByDate: { ...(prevV2.weightByDate || {}) },
    stepsByDate: { ...(prevV2.stepsByDate || {}) },
  };

  for (const row of weights) {
    const date = row.date;
    const kg = Number(row.kg);
    if (!date || !Number.isFinite(kg)) continue;
    const cur = next.weightByDate[date] || { weight: null, note: "", updatedAt: null };
    const prevUpdated = cur.updatedAt || null;
    if (hasManualWeight(cur)) {
      next.weightByDate[date] = {
        ...cur,
        hkWeight: kg,
        hkSyncedAt: nowIso,
      };
      continue;
    }
    const same = cur.weight != null && Math.abs(Number(cur.weight) - kg) < 1e-6;
    if (same) continue;
    next.weightByDate[date] = {
      ...cur,
      weight: kg,
      note: cur.note || "",
      updatedAt: nowIso,
    };
    putRows.push({
      kind: "weight",
      date,
      clientLast: { weightsUpdatedAt: prevUpdated },
      weight: kg,
      weightNote: cur.note || "",
    });
  }

  for (const row of stepsByDate) {
    const date = row.date;
    const st = row.steps;
    if (!date || typeof st !== "number" || !Number.isFinite(st)) continue;
    const cur = next.stepsByDate[date] || { steps: null, note: "", updatedAt: null };
    const prevUpdated = cur.updatedAt || null;
    if (hasManualSteps(cur)) {
      next.stepsByDate[date] = {
        ...cur,
        hkSteps: Math.trunc(st),
        hkSyncedAt: nowIso,
      };
      continue;
    }
    const stepsInt = Math.trunc(st);
    const same = cur.steps != null && Number(cur.steps) === stepsInt;
    if (same) continue;
    next.stepsByDate[date] = {
      ...cur,
      steps: stepsInt,
      note: cur.note || "",
      updatedAt: nowIso,
    };
    putRows.push({
      kind: "steps",
      date,
      clientLast: { stepsUpdatedAt: prevUpdated },
      steps: stepsInt,
      stepsNote: cur.note || "",
    });
  }

  return { nextV2: next, putRows };
}

/**
 * On native iOS: request HK auth, pull weight/steps, merge into app state, sync primary updates to API.
 */
export async function runHealthKitImport({
  baseV2,
  getV2,
  setV2,
  syncUserId,
  syncPassword,
  setSyncErr,
  refetchRemoteV2,
}) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;
  if (!syncUserId || !syncPassword) return;

  try {
    await HealthKitBridge.requestAuthorization();
  } catch (e) {
    console.warn("HealthKitBridge.requestAuthorization", e);
    return;
  }

  let res;
  try {
    res = await HealthKitBridge.syncLatest({ days: 30 });
  } catch (e) {
    console.warn("HealthKitBridge.syncLatest", e);
    return;
  }

  const nowIso = new Date().toISOString();
  const prev =
    baseV2 != null
      ? baseV2
      : typeof getV2 === "function"
        ? getV2()
        : null;
  if (!prev) return;
  const { nextV2, putRows } = mergeHealthKitIntoV2(prev, res, nowIso);
  setV2(nextV2);

  for (const row of putRows) {
    try {
      if (row.kind === "weight") {
        await putRemoteDayV2({
          userId: syncUserId,
          password: syncPassword,
          date: row.date,
          weight: row.weight,
          weightNote: row.weightNote,
          clientLast: row.clientLast,
        });
      } else if (row.kind === "steps") {
        await putRemoteDayV2({
          userId: syncUserId,
          password: syncPassword,
          date: row.date,
          steps: row.steps,
          stepsNote: row.stepsNote,
          clientLast: row.clientLast,
        });
      }
    } catch (e) {
      const msg = e?.code === 409 ? "サーバー側が先に更新されています。再同期しました。" : (e?.message || "sync failed");
      setSyncErr?.(msg);
      try {
        await refetchRemoteV2?.();
      } catch (_) {}
      break;
    }
  }
}
