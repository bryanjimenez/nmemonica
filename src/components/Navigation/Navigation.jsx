import {
  faAtom,
  faFont,
  faWrench,
  faYinYang,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import React, { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { labelOptions, toggleOptions } from "../../helper/gameHelper";
import { buildAction, setStateFunction } from "../../hooks/helperHK";
import { toggleKana } from "../../slices/kanaSlice";
import { KanjiGameMeta } from "../Games/KanjiGame";
import { OppositesGameMeta } from "../Games/OppositesGame";
import { ParticlesGameMeta } from "../Games/ParticlesGame";
import { KanaGameMeta } from "../Pages/KanaGame";
import { KanjiMeta } from "../Pages/Kanji";
import { PhrasesMeta } from "../Pages/Phrases";
import { SettingsMeta } from "../Pages/Settings";
import { VocabularyMeta } from "../Pages/Vocabulary";
import "./Navigation.css";

/**
 * @template T
 * @typedef {import("react").MouseEvent<T>} MouseEvent
 */

export default function Navigation() {
  const dispatch = useDispatch();

  const { charSet } = useSelector(
    (/** @type {RootState}*/ { kana }) => kana.setting
  );

  const [collapsed, setCollapsed] = useState(true);
  const [vocabType, setVocabType] = useState(0);
  const [kanjiType, setKanjiType] = useState(0);

  const menuToggle = useCallback(() => {
    if (collapsed) {
      setCollapsed(false);
      document.body.classList.add("no-scroll");
      window.scrollTo(0, 0);
    } else {
      setCollapsed(true);
      document.body.classList.remove("no-scroll");
    }
  }, [collapsed]);

  const clickBehavior = useCallback(
    /**
     * Clicking on icons should collapse menu (force-collapse).
     * Clicking on captions should not (prevent-collapse).
     * Anywhere else should.
     * @template HTMLDivElement
     * @param {MouseEvent<HTMLDivElement>} event
     */
    (event) => {
      if (event.target) {
        const tEl = /** @type {Element} */ (event.target);
        if (
          Array.from(
            document.getElementsByClassName("force-collapse")
          ).includes(tEl)
        ) {
          // force a collapse, Link el is preventing?
          menuToggle();
        } else if (
          !Array.from(
            document.getElementsByClassName("prevent-collapse")
          ).includes(tEl)
        ) {
          // any child elem without classname^ toggles
          menuToggle();
          return false;
        }
      }
    },
    [menuToggle]
  );

  let shortcuts = useMemo(
    () => [
      {
        meta: {
          ...KanaGameMeta,
          label: labelOptions(charSet, KanaGameMeta.label),
        },
        icon: (
          <div className="not-a-real-icon">
            {labelOptions(charSet, ["あ", "ア", "*"])}
          </div>
        ),
        wrap: (/** @type {string} */ child) => (
          <div
            className="clickable prevent-collapse"
            onClick={buildAction(dispatch, toggleKana)}
          >
            {child}
          </div>
        ),
      },
      {
        meta: OppositesGameMeta,
        icon: <FontAwesomeIcon icon={faYinYang} size="2x" />,
      },
      {
        meta: [VocabularyMeta, PhrasesMeta][vocabType],
        icon: <FontAwesomeIcon icon={faFont} size="2x" />,
        wrap: (/** @type {string} */ child) => (
          <div
            className="clickable prevent-collapse"
            onClick={setStateFunction(setVocabType, (t) =>
              toggleOptions(t, ["Vocab", "Phrases"])
            )}
          >
            {child}
          </div>
        ),
      },
      {
        meta: ParticlesGameMeta,
        icon: <FontAwesomeIcon icon={faAtom} size="2x" />,
      },
      // {
      //   meta: this.props.user ? LogoutMeta : OAuthLoginMeta,
      //   icon: (
      //     <FontAwesomeIcon
      //       icon={this.props.user ? faSignOutAlt : faSignInAlt}
      //       size="2x"
      //     />
      //   ),
      // },
      {
        meta: [KanjiMeta, KanjiGameMeta][kanjiType],
        icon: (
          <div className="not-a-real-icon">
            {labelOptions(kanjiType, ["漢", "G"])}
          </div>
        ),
        wrap: (/** @type {string} */ child) => (
          <div
            className="clickable prevent-collapse"
            onClick={setStateFunction(setKanjiType, (t) =>
              toggleOptions(t, ["Kanji", "KanjiGame"])
            )}
          >
            {child}
          </div>
        ),
      },
      {
        meta: SettingsMeta,
        icon: <FontAwesomeIcon icon={faWrench} size="2x" />,
      },
    ],
    [dispatch, charSet, kanjiType, vocabType]
  );

  return (
    <div className="navigation">
      <nav className="my-navbar">
        <Link /*className="navbar-brand"*/ aria-label="Home" to="/">
          {/* <span>Nmemonica</span> */}
          {/* <span>Language Flash Cards</span> */}
        </Link>
        <div className="button d-lg-none mt-2 me-2" onClick={menuToggle}>
          <button
            className={classNames({
              "nav-menu-btn": true,
              collapsed: collapsed,
            })}
            type="button"
            aria-controls="nav-menu-mobile"
            aria-expanded="false"
            aria-label="Toggle mobile navigation"
          >
            <span className="nav-btn-line" />
            <span className="nav-btn-line" />
            <span className="nav-btn-line" />
          </button>
        </div>
        {/* Mobile navigation icons */}
        <div
          className={classNames({
            "mobile d-lg-none": true,
            collapse: collapsed,
          })}
          id="nav-menu-mobile"
          onClick={clickBehavior}
        >
          <ul className="w-100 d-flex justify-content-evenly flex-wrap p-4">
            {shortcuts.map((l, i) => (
              <li key={i} className="w-25 text-center m-3">
                <Link to={l.meta.location}>
                  <div className="icon force-collapse mb-2">{l.icon}</div>
                </Link>
                <div className="caption">
                  {l.wrap ? l.wrap(l.meta.label) : l.meta.label}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop navigation links */}
        <div className="desktop d-none d-lg-block pt-2 pe-2">
          <ul className="d-flex">
            {shortcuts.map((s, i) => (
              <li key={i}>
                <Link className="desktop-link" to={s.meta.location}>
                  {s.wrap ? s.wrap(s.meta.label) : s.meta.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
