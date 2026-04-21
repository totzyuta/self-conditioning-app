import Foundation
import Capacitor

@objc(NativeChromePlugin)
public class NativeChromePlugin: CAPPlugin {

    @objc func setChrome(_ call: CAPPluginCall) {
        let visible: Bool = {
            if let n = call.options["visible"] as? NSNumber { return n.boolValue }
            if let b = call.options["visible"] as? Bool { return b }
            return true
        }()
        let tab = call.options["tab"] as? String
        let userId = call.options["userId"] as? String

        DispatchQueue.main.async {
            NativeChromeBridge.shell?.applyChrome(tab: tab, userId: userId, visible: visible)
        }
        call.resolve()
    }
}
