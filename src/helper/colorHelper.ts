import { lerp } from "./arrayHelper";

/**
 * CSS rgb Heatmap color out of a value
 * @param t value to heatmap [0,1]
 * @param a alpha
 */
export function heatMap(t: number, a =.25) {

  const [rB, gB, bB] = [13, 110, 256]; // nice blue

  const BG = [rB, lerp(gB, 255, t), lerp(bB, 0, t)]; // [0,0,255] -> [0,255,0]
  const GY = [lerp(0,255,t), 255, 0]; // [0,255,0] -> [255,255,0]
  const YR = [255, lerp(255,0, t), 0]; // [255,255,0] -> [255,0,0]


  const BG_GY = [
    lerp(BG[0], GY[0], t),
    lerp(BG[1], GY[1], t),
    lerp(BG[2], GY[2], t),
  ];
  const GY_YR = [
    lerp(GY[0], YR[0], t),
    lerp(GY[1], YR[1], t),
    lerp(GY[2], YR[2], t),
  ];

  const colorVals = [
    lerp(BG_GY[0], GY_YR[0], t),
    lerp(BG_GY[1], GY_YR[1], t),
    lerp(BG_GY[2], GY_YR[2], t),
  ];

  const [r, g, b] = colorVals.map((v) => Math.floor(v));
  // console.log( r, g, b)
  const difficultyColor = `rgb(${r},${g},${b},${a})`;

  return difficultyColor;
}
