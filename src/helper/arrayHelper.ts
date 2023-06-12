/**
 * NOTE: This function modifies the array parameter order
 */
export function shuffleArray<T>(array:T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * @param a
 * @param b
 * @param t
 * @param {{clamped?:boolean}} options
 */
export function lerp(a:number, b:number, t:number, { clamped = true } = {}) {
  const max = Math.min(...[1, t]);
  const t_c = clamped ? Math.max(...[max, 0]) : t;

  const v = (1 - t_c) * a + t_c * b;

  return v;
}

/**
 * @param a
 * @param b
 * @param v
 */
export function invLerp(a:number, b:number, v:number) {
  const t = (v - a) / (a + b);
  return t;
}
