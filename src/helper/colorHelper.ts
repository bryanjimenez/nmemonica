import { lerp } from "./arrayHelper";

/**
 * CSS rgb Heatmap color out of a value
 * @param t value to heatmap [0,1]
 * @param a alpha
 */
export function heatMap(t: number, a =.25) {

  const [rB, gB, bB] = [13, 110, 256]; // nice blue

  const RY = [255, lerp(0, 255, t), 0]; // [255,0,0],   [255,255,0]
  const YG = [lerp(255, 0, t), 255, 0]; // [255,255,0], [0,255,0]
  const GB = [rB, lerp(255, gB, t), lerp(0, bB, t)]; // [0,255,0],   [0,0,255]

  const RY_YG = [
    lerp(RY[0], YG[0], t),
    lerp(RY[1], YG[1], t),
    lerp(RY[2], YG[2], t),
  ];
  const YG_GB = [
    lerp(YG[0], GB[0], t),
    lerp(YG[1], GB[1], t),
    lerp(YG[2], GB[2], t),
  ];
  const colorVals = [
    lerp(RY_YG[0], YG_GB[0], t),
    lerp(RY_YG[1], YG_GB[1], t),
    lerp(RY_YG[2], YG_GB[2], t),
  ];

  const [r, g, b] = colorVals.map((v) => Math.floor(v));
  // console.log( r, g, b)
  const difficultyColor = `rgb(${r},${g},${b},${a})`;

  return difficultyColor;
}
