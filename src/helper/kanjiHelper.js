import classNames from "classnames";
import React from "react";

/**
 * @typedef {import("../typings/raw").FuriganaParseObject} FuriganaParseObject
 */

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

/**
 * Calculates lengths of strings in each chunk
 * @param {FuriganaParseObject} furiganaParseObject
 */
export function getParseObjectLengths(furiganaParseObject) {
  let { kanjis, furiganas, okuriganas } = furiganaParseObject;

  if (furiganas.length > okuriganas.length) {
    okuriganas = [...okuriganas, ""];
  } else if (furiganas.length < okuriganas.length) {
    kanjis = [...kanjis, ""];
    furiganas = [...furiganas, ""];
  }

  return furiganas.map((el, i) => ({
    k: kanjis[i].length,
    f: furiganas[i].length,
    o: okuriganas[i].length,
  }));
}

/**
 * Calculates lengths of kanjis and okuriganas from a parse object after a splice
 * @param {FuriganaParseObject} furiganaParseObject
 * @param {number} start starting index of splice
 * @param {number} [end] non inclusive ending index, if not specified will be one after start
 */
export function getParseObjectAfterSplice(
  { kanjis, furiganas, okuriganas, startsWKana },
  start,
  end = start + 1
) {
  let blankLength = end - start;

  if (furiganas.length > okuriganas.length) {
    okuriganas = [...okuriganas, ""];
  } else if (furiganas.length < okuriganas.length) {
    kanjis = [...kanjis, ""];
    furiganas = [...furiganas, ""];
  }

  const lengths = getParseObjectLengths({
    kanjis,
    furiganas,
    okuriganas,
    startsWKana,
  });

  let prevLen = [0];
  return lengths.map((el, i) => {
    let { k, f, o } = el;
    let nk = k;
    let no = o;
    prevLen = [...prevLen, prevLen[i] + k + o];

    if (startsWKana) {
      if (prevLen[i] + o > start) {
        if (o < blankLength) {
          no = 0;
          blankLength -= o;
        } else {
          no -= blankLength;
          blankLength = 0;
        }
      }

      if (prevLen[i] + o + k > start) {
        if (o + k < blankLength + o) {
          nk = 0;
          blankLength -= k;
        } else {
          nk -= blankLength;
          blankLength = 0;
        }
      }
    } else {
      // !startsWKana

      if (prevLen[i] + k > start) {
        if (k < blankLength) {
          nk = 0;
          blankLength -= k;
        } else {
          nk -= blankLength;
          blankLength = 0;
        }
      }

      if (prevLen[i] + o + k > start) {
        if (o + k < blankLength + k) {
          no = 0;
          blankLength -= o;
        } else {
          no -= blankLength;
          blankLength = 0;
        }
      }
    }

    return { k: nk, f, o: no };
  });
}

/**
 * Decorates a section of kanji or okurigana with css (hidden)
 * @param {FuriganaParseObject} furiganaParseObj
 * @param {{hidden:string, shown?:string}} css
 * @param {number} start
 * @param {number} [end]
 */
export function kanjiOkuriganaSpliceApplyCss(
  { kanjis, furiganas, okuriganas, startsWKana },
  css,
  start,
  end = start + 1
) {
  const { shown, hidden } = css;

  const calc = getParseObjectAfterSplice(
    { kanjis, furiganas, okuriganas, startsWKana },
    start,
    end
  );

  if (furiganas.length > okuriganas.length) {
    okuriganas = [...okuriganas, ""];
  } else if (furiganas.length < okuriganas.length) {
    kanjis = [...kanjis, ""];
    furiganas = [...furiganas, ""];
  }

  /**
   * @param {string|undefined} css
   * @param {string} content
   * @param {number} [key]
   */
  const wrap = (css, content, key) =>
    !content ? undefined : (
      <span key={key} className={css}>
        {content}
      </span>
    );

  /**
   * Makes the split within a chunk determining what to hide and show
   * @param {string} chunk current
   * @param {number} k the calculated length of current chunk after splice
   * @param {number} remaining the length of the splice left
   * @param {number} prevChunksLen total length of chunks upto current
   */
  const wrapChunks = (chunk, k, remaining, prevChunksLen) => {
    let hideEl, showEl;
    const chunkLen = chunk.length;

    if (chunkLen > 0) {
      if (k === 0) {
        // hide everything
        hideEl = wrap(hidden, chunk);
        remaining -= chunkLen;
      } else if (k === chunkLen) {
        // show everything
        showEl = wrap(shown, chunk);
      } else if (k < chunkLen) {
        // there is a cut

        if (remaining < chunkLen - k) {
          // cut at beginning
          showEl = wrap(shown, chunk.slice(k - chunkLen));
          hideEl = wrap(hidden, chunk.slice(0, chunkLen - k));
          remaining = 0;
        } else if (remaining === chunkLen - k) {
          const p = prevChunksLen;

          const cs = start - p; // this chunks start point
          const ce = cs + remaining; // this chunks end point

          const so1 = wrap(shown, chunk.slice(0, cs), p + 1);
          const hid = wrap(hidden, chunk.slice(cs, ce), p + 2);
          const so2 = wrap(shown, chunk.slice(ce, chunkLen), p + 3);

          showEl = [so1, hid, so2];
          remaining = 0;
        } else if (remaining > chunkLen - k) {
          // part here part next
          // slice toward the end
          showEl = wrap(shown, chunk.slice(0, chunkLen - k));
          hideEl = wrap(hidden, chunk.slice(k - chunkLen));

          remaining -= chunkLen - k;
        }
      }
    }
    return { s: showEl, h: hideEl, spliceLen: remaining };
  };

  let spliceLen = end - start;
  let previousLens = [0];

  const decorated = calc.map((el, i) => {
    const kLen = kanjis[i].length;
    const oLen = okuriganas[i].length;

    previousLens = [...previousLens, previousLens[i] + oLen + kLen];

    let sk, hk;
    ({
      s: sk,
      h: hk,
      spliceLen,
    } = wrapChunks(
      kanjis[i],
      el.k,
      spliceLen,
      previousLens[i] + (startsWKana ? oLen : 0)
    ));

    const sf = wrap(shown, furiganas[i]);
    const hf = undefined;

    let so, ho;
    ({
      s: so,
      h: ho,
      spliceLen,
    } = wrapChunks(
      okuriganas[i],
      el.o,
      spliceLen,
      previousLens[i] + (!startsWKana ? kLen : 0)
    ));

    const kanjiWFurigana = (sk || hk) && (sf || hf) && (
      <ruby>
        {sk}
        {hk}
        <rt>
          {sf}
          {hf}
        </rt>
      </ruby>
    );

    const okurigana = (so || ho) && (
      <span>
        {so}
        {ho}
      </span>
    );

    const goesFirst = startsWKana ? okurigana : kanjiWFurigana;
    const goesNext = startsWKana ? kanjiWFurigana : okurigana;

    const lhFurigana = classNames({ "lh-furigana": furiganas[i].length > 0 });
    return (
      (goesFirst || goesNext) && (
        <span key={i} className={lhFurigana}>
          {goesFirst}
          {goesNext}
        </span>
      )
    );
  });

  return <span className="decorated">{decorated}</span>;
}
