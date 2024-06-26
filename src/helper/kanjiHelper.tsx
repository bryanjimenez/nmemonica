import classNames from "classnames";
import type { FuriganaParseObject, FuriganaParseObjectMask } from "nmemonica";
import React from "react";

/**
 * From a splice of 0 to nMora, creates a FuriganaParseObject mask
 * @param furiganaParseObject
 * @param nMora
 */
export function getParseObjectHintMask(
  { kanjis, furiganas, okuriganas, startsWKana }: FuriganaParseObject,
  nMora: number
) {
  let hintRem = nMora;
  let startEl, trailEl;

  if (furiganas.length > okuriganas.length) {
    okuriganas = [...okuriganas, ""];
  } else if (furiganas.length < okuriganas.length) {
    kanjis = [...kanjis, ""];
    furiganas = [...furiganas, ""];
  }

  return furiganas.reduce<FuriganaParseObjectMask>((acc, el, i) => {
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
  }, []);
}

/**
 * @param css
 * @param kanjis
 * @param furiganas
 * @param okuriganas
 * @param startsWKana
 * @param hintMora
 */
export function furiganaHintBuilder(
  css: { hidden: string; shown: string },
  kanjis: string[],
  furiganas: string[],
  okuriganas: string[],
  startsWKana: boolean,
  hintMora = 1
) {
  const mask = getParseObjectHintMask(
    { kanjis, furiganas, okuriganas, startsWKana },
    hintMora
  );

  if (furiganas.length > okuriganas.length) {
    okuriganas = [...okuriganas, ""];
  } else if (furiganas.length < okuriganas.length) {
    kanjis = [...kanjis, ""];
    furiganas = [...furiganas, ""];
  }

  /**
   * @param css
   * @param content
   * @param key
   */
  const wrap = (css: string | undefined, content: string, key = 1) =>
    !content
      ? []
      : [
          <span key={key} className={css}>
            {content}
          </span>,
        ];

  const hint = mask.map((el, i) => {
    const sk = el.k > 0 ? wrap(css.shown, kanjis[i].slice(0, el.k)) : [];
    const hk =
      el.k < kanjis[i].length ? wrap(css.hidden, kanjis[i].slice(el.k)) : [];

    const sf = el.f > 0 ? wrap(css.shown, furiganas[i].slice(0, el.f)) : [];
    const hf =
      el.f < furiganas[i].length
        ? wrap(css.hidden, furiganas[i].slice(el.f))
        : [];

    const so = el.o > 0 ? wrap(css.shown, okuriganas[i].slice(0, el.o)) : [];
    const ho =
      el.o < okuriganas[i].length
        ? wrap(css.hidden, okuriganas[i].slice(el.o))
        : [];

    return buildRubyElement(i, { sk, hk }, { sf, hf }, { so, ho }, startsWKana);
  });

  return <span className="hint">{hint}</span>;
}

/**
 * Creates a FuriganaParseObject mask (lengths)
 */
export function getParseObjectMask(furiganaParseObject: FuriganaParseObject) {
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
 * From a kanji and okurigana splice, creates a FuriganaParseObject mask
 * @param furiganaParseObject
 * @param start starting index of splice
 * @param end non inclusive ending index, if not specified will be one after start
 */
export function getParseObjectSpliceMask(
  { kanjis, furiganas, okuriganas, startsWKana }: FuriganaParseObject,
  start: number,
  end = start + 1
) {
  let blankLength = end - start;

  if (furiganas.length > okuriganas.length) {
    okuriganas = [...okuriganas, ""];
  } else if (furiganas.length < okuriganas.length) {
    kanjis = [...kanjis, ""];
    furiganas = [...furiganas, ""];
  }

  const lengths = getParseObjectMask({
    kanjis,
    furiganas,
    okuriganas,
    startsWKana,
  });

  let prevLen = [0];
  return lengths.map((el, i) => {
    let { k, o } = el;
    let nk = 0;
    let no = 0;
    prevLen = [...prevLen, prevLen[i] + k + o];
    if (startsWKana) {
      if (prevLen[i] + o > start) {
        if (prevLen[i] + o < end) {
          const inNeg = start - (prevLen[i] + o);

          no = Math.min(...[o, Math.abs(inNeg)]);
          blankLength -= no;
        } else {
          no = blankLength;
          blankLength = 0;
        }
      }

      if (prevLen[i] + o + k > start) {
        if (prevLen[i] + o + k < end) {
          const inNeg = start - (prevLen[i] + o + k);

          nk = Math.min(...[k, Math.abs(inNeg)]);
          blankLength -= nk;
        } else {
          nk = blankLength;
          blankLength = 0;
        }
      }
    } else {
      // !startsWKana

      if (prevLen[i] + k > start) {
        if (prevLen[i] + k < end) {
          const inNeg = start - (prevLen[i] + k);

          nk = Math.min(...[k, Math.abs(inNeg)]);
          blankLength -= nk;
        } else {
          nk = blankLength;
          blankLength = 0;
        }
      }

      if (prevLen[i] + k + o > start) {
        if (prevLen[i] + k + o < end) {
          const inNeg = start - (prevLen[i] + k + o);

          no = Math.min(...[o, Math.abs(inNeg)]);
          blankLength -= no;
        } else {
          no = blankLength;
          blankLength = 0;
        }
      }
    }

    return { k: nk, f: 0, o: no };
  });
}

/**
 * Decorates a section of kanji or okurigana with css (hidden)
 * @param furiganaParseObject
 * @param css
 * @param start
 * @param end
 */
export function kanjiOkuriganaSpliceApplyCss(
  { kanjis, furiganas, okuriganas, startsWKana }: FuriganaParseObject,
  css: { hidden: string; shown?: string },
  start: number,
  end = start + 1
) {
  const { shown, hidden } = css;

  const calc = getParseObjectSpliceMask(
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
   * @param css
   * @param content
   * @param key
   */
  const wrap = (css: string | undefined, content: string, key = 1) =>
    !content
      ? []
      : [
          <span key={key} className={css}>
            {content}
          </span>,
        ];

  /**
   * Makes the split within a chunk determining what to hide and show
   * @param chunk current
   * @param c the calculated length of current chunk after splice
   * @param remaining the length of the splice left
   * @param prevChunksLen total length of chunks upto current
   */
  const wrapChunks = (
    chunk: string,
    c: number,
    remaining: number,
    prevChunksLen: number
  ) => {
    let selectEl: React.JSX.Element[] = [];
    let ignoreEl: React.JSX.Element[] = [];
    const chunkLen = chunk.length;

    if (chunkLen > 0) {
      if (c === 0) {
        // ignore everything
        ignoreEl = wrap(shown, chunk);
      } else if (c === chunkLen) {
        // select everything
        selectEl = wrap(hidden, chunk);
        remaining -= chunkLen;
      } else if (c < chunkLen) {
        // there is a cut

        if (remaining < c) {
          // select at beginning
          selectEl = wrap(hidden, chunk.slice(0, c));
          ignoreEl = wrap(shown, chunk.slice(c - chunkLen));
          remaining = 0;
        } else if (remaining === c) {
          const p = prevChunksLen;

          const cs = start - p; // this chunks start point
          const ce = cs + remaining; // this chunks end point

          const so1 = wrap(shown, chunk.slice(0, cs), p + 1);
          const hid = wrap(hidden, chunk.slice(cs, ce), p + 2);
          const so2 = wrap(shown, chunk.slice(ce, chunkLen), p + 3);

          ignoreEl = [...so1, ...hid, ...so2];
          remaining = 0;
        } else if (remaining > c) {
          // part here part next
          // select toward the end
          ignoreEl = wrap(shown, chunk.slice(0, c));
          selectEl = wrap(hidden, chunk.slice(c - chunkLen));

          remaining -= c;
        }
      }
    }
    return { s: ignoreEl, h: selectEl, spliceLen: remaining };
  };

  let spliceLen = end - start;
  let prevLen = [0];

  const decorated = calc.map((el, i) => {
    const kLen = kanjis[i].length;
    const oLen = okuriganas[i].length;

    prevLen = [...prevLen, prevLen[i] + oLen + kLen];

    let sk, hk;
    ({
      s: sk,
      h: hk,
      spliceLen,
    } = wrapChunks(
      kanjis[i],
      el.k,
      spliceLen,
      prevLen[i] + (startsWKana ? oLen : 0)
    ));

    const sf = wrap(shown, furiganas[i]);
    const hf: React.JSX.Element[] = [];

    let so, ho;
    ({
      s: so,
      h: ho,
      spliceLen,
    } = wrapChunks(
      okuriganas[i],
      el.o,
      spliceLen,
      prevLen[i] + (!startsWKana ? kLen : 0)
    ));

    return buildRubyElement(i, { sk, hk }, { sf, hf }, { so, ho }, startsWKana);
  });

  return <span className="decorated">{decorated}</span>;
}

/**
 * @param content
 * @param css
 * @param key
 */
export function wrap(content?: string, css?: string, key = 1) {
  return !content
    ? []
    : [
        <span key={key} className={css}>
          {content}
        </span>,
      ];
}

/**
 * Builds a ruby html element
 * @param key
 * @param kanji
 * @param furigana
 * @param okurigana
 * @param startsWKana
 */
export function buildRubyElement(
  key: number,
  { sk, hk }: { sk: React.JSX.Element[]; hk: React.JSX.Element[] },
  { sf, hf }: { sf: React.JSX.Element[]; hf: React.JSX.Element[] },
  { so, ho }: { so: React.JSX.Element[]; ho: React.JSX.Element[] },
  startsWKana: boolean
) {
  const hasKanji = sk.length > 0 || hk.length > 0;
  const hasFurigana = sf.length > 0 || hf.length > 0;
  const hasOkurigana = so.length > 0 || ho.length > 0;

  const kanjiWFurigana =
    (hasKanji && hasFurigana && (
      <ruby>
        {sk}
        {hk}
        <rt>
          {sf}
          {hf}
        </rt>
      </ruby>
    )) ||
    undefined;

  const okurigana =
    (hasOkurigana && (
      <span>
        {so}
        {ho}
      </span>
    )) ||
    undefined;

  const goesFirst = startsWKana ? okurigana : kanjiWFurigana;
  const goesNext = startsWKana ? kanjiWFurigana : okurigana;

  const lhFurigana =
    classNames({ "lh-furigana": hasKanji && hasFurigana }) || undefined;
  return (
    ((goesFirst || goesNext) && (
      <span key={key} className={lhFurigana}>
        {goesFirst}
        {goesNext}
      </span>
    )) ||
    undefined
  );
}
