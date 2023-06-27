import { useEffect, useState } from "react";

/**
 * For fading/transition
 * @param delay in ms to toggle from false to true
 * @return a tuple [state?:boolean, trigger:function] state and a trigger
 */
export function useFade(delay: number): [boolean | undefined, () => void] {
  const [fade, setFade] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined = undefined;
    if (delay > 0) {
      timeout = setTimeout(() => {
        if (fade) {
          setFade(false);
        }
      }, delay);
    }

    return () => {
      if (delay > 0) clearTimeout(timeout);
    };
  });

  if (delay > 0) {
    return [!fade, () => setFade(true)];
  } else {
    return [
      undefined,
      () => {
        /** Not needed, delay:0 */
      },
    ];
  }
}

/**
 * Force a rerender
 */
export function useForceRender() {
  const [toggle, forceRender] = useState(true);

  return () => forceRender(!toggle);
}
