import { useEffect, useState } from "react";

/**
 * For fading/transition
 * @param {number} delay in ms
 * @returns {[fade: boolean, doFade: function]}
 */
export function useFade(delay) {
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (fade) {
        setFade(false);
      }
    }, delay);

    return () => clearTimeout(timeout);
  });

  return [!fade, () => setFade(true)];
}
