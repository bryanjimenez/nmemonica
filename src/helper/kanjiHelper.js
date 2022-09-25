import React from "react";

/**
 * Calculates length of string in each chunk to display for hint
 * @param {number} hintMora
 * @param {string[]} kanjis
 * @param {string[]} furiganas
 * @param {string[]} okuriganas
 * @param {boolean} startsWKana
 */
export function calcHintElements(
  hintMora,
  kanjis,
  furiganas,
  okuriganas,
  startsWKana
) {
  let hintRem = hintMora;
  let startEl, trailEl;

  /**
   * @type {{ k: number, f:number, o: number }[]}
   */
  let init = [];

  if (furiganas.length > okuriganas.length) {
    okuriganas = [...okuriganas, ""];
  } else if (furiganas.length < okuriganas.length) {
    kanjis = [...kanjis, ""];
    furiganas = [...furiganas, ""];
  }

  return furiganas.reduce((acc, el, i) => {
    const fpk = Math.trunc(furiganas[i].length / kanjis[i].length);

    if (hintRem > 0) {
      if (!startsWKana) {
        startEl = furiganas[i];
        trailEl = okuriganas[i];
        // starts with kanji
        if (startEl.length <= hintRem) {
          hintRem -= startEl.length;
          let o;
          if (trailEl.length < hintRem) {
            hintRem -= trailEl.length;
            o = trailEl.length;
          } else {
            o = hintRem;
            hintRem = 0;
          }

          acc = [...acc, { k: kanjis[i].length, f: startEl.length, o }];
        } else {
          const k = Math.ceil(hintRem / fpk);
          acc = [...acc, { k, f: hintRem, o: 0 }];
          hintRem = 0;
        }
      } else {
        startEl = okuriganas[i];
        trailEl = furiganas[i];
        // starts with kana
        if (startEl.length <= hintRem) {
          hintRem -= startEl.length;
          let k;
          let f = hintRem;
          if (trailEl.length <= hintRem) {
            hintRem -= trailEl.length;
            k = kanjis[i].length;
            f = trailEl.length;
          } else {
            k = Math.ceil(hintRem / fpk);

            hintRem = 0;
          }

          acc = [...acc, { k, f, o: startEl.length }];
        } else {
          acc = [...acc, { k: 0, f: 0, o: hintRem }];
          hintRem = 0;
        }
      }
    } else {
      acc = [...acc, { k: 0, f: 0, o: 0 }];
    }

    return acc;
  }, init);
}

/**
 * @param {{hidden:string, shown:string}} css
 * @param {string[]} kanjis
 * @param {string[]} furiganas
 * @param {string[]} okuriganas
 * @param {boolean} startsWKana
 * @param {number} [hintMora]
 */
export function furiganaHintBuilder(
  css,
  kanjis,
  furiganas,
  okuriganas,
  startsWKana,
  hintMora = 1
) {
  const calc = calcHintElements(
    hintMora,
    kanjis,
    furiganas,
    okuriganas,
    startsWKana
  );

  if (furiganas.length > okuriganas.length) {
    okuriganas = [...okuriganas, ""];
  } else if (furiganas.length < okuriganas.length) {
    kanjis = [...kanjis, ""];
    furiganas = [...furiganas, ""];
  }

  const hint = calc.map((el, i) => {
    const sk =
      el.k > 0 ? (
        <span className={css.shown}>{kanjis[i].slice(0, el.k)}</span>
      ) : undefined;
    const hk =
      el.k < kanjis[i].length ? (
        <span className={css.hidden}>{kanjis[i].slice(el.k)}</span>
      ) : undefined;

    const sf =
      el.f > 0 ? (
        <span className={css.shown}>{furiganas[i].slice(0, el.f)}</span>
      ) : undefined;
    const hf =
      el.f < furiganas[i].length ? (
        <span className={css.hidden}>{furiganas[i].slice(el.f)}</span>
      ) : undefined;

    const so =
      el.o > 0 ? (
        <span className={css.shown}>{okuriganas[i].slice(0, el.o)}</span>
      ) : undefined;
    const ho =
      el.o < okuriganas[i].length ? (
        <span className={css.hidden}>{okuriganas[i].slice(el.o)}</span>
      ) : undefined;

    const kanjiWFurigana = (
      <ruby>
        {sk}
        {hk}
        <rt>
          {sf}
          {hf}
        </rt>
      </ruby>
    );

    const okurigana = (
      <span>
        {so}
        {ho}
      </span>
    );

    const goesFirst = startsWKana ? okurigana : kanjiWFurigana;
    const goesNext = startsWKana ? kanjiWFurigana : okurigana;

    return (
      <span key={i}>
        {goesFirst}
        {goesNext}
      </span>
    );
  });

  return <span className="hint">{hint}</span>;
}
