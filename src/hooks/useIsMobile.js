import { useEffect, useState } from "react";

export function useIsMobile(breakpointPx = 520) {
  const [isMobile, setIsMobile] = useState(() => {
    try { return window.matchMedia(`(max-width:${breakpointPx}px)`).matches; } catch { return false; }
  });

  useEffect(() => {
    let mql;
    try { mql = window.matchMedia(`(max-width:${breakpointPx}px)`); } catch { return; }
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [breakpointPx]);

  return isMobile;
}
