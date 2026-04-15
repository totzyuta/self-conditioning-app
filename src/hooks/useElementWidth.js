import { useEffect, useState } from "react";

export function useElementWidth(ref) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setW(el.getBoundingClientRect().width || 0);
    update();

    if (!("ResizeObserver" in window)) {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return w;
}
