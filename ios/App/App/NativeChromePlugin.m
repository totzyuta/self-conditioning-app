#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeChromePlugin, "NativeChrome",
           CAP_PLUGIN_METHOD(setChrome, CAPPluginReturnPromise);
)
