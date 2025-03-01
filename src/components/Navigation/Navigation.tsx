import {
  faAtom,
  faFont,
  faWrench,
  faYinYang,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TableIcon } from "@primer/octicons-react";
import classNames from "classnames";
import { MouseEventHandler, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { buildAction, setStateFunction } from "../../helper/eventHandlerHelper";
import { labelOptions, toggleOptions } from "../../helper/gameHelper";
import type { RootState } from "../../slices";
import { toggleKana } from "../../slices/kanaSlice";
import { KanjiGameMeta } from "../Games/KanjiGame";
import { OppositesGameMeta } from "../Games/OppositesGame";
import { ParticlesGameMeta } from "../Games/ParticlesGame";
import { KanaGameMeta } from "../Pages/KanaGame";
import { KanjiMeta } from "../Pages/Kanji";
import { PhrasesMeta } from "../Pages/Phrases";
import { SettingsMeta } from "../Pages/Settings";
import { SheetMeta } from "../Pages/Sheet";
import { VocabularyMeta } from "../Pages/Vocabulary";
import "../../css/Navigation.css";

export default function Navigation() {
  const dispatch = useDispatch();

  const charSet = useSelector((state: RootState) => state.kana.setting.charSet);

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

  const clickBehavior: MouseEventHandler<HTMLDivElement> = useCallback(
    /**
     * Clicking on icons should collapse menu (force-collapse).
     * Clicking on captions should not (prevent-collapse).
     * Anywhere else should.
     */
    (event) => {
      if (event.target) {
        const tEl = event.target as Element;
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
        wrap: (child: string) => (
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
        wrap: (child: string) => (
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
        wrap: (child: string) => (
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
      {
        meta: { location: SheetMeta.location, label: "Edit" },
        icon: <TableIcon size="medium" />,
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
            {shortcuts.map((l) => (
              <li key={`${l.meta.location}`} className="w-25 text-center m-3">
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
            {shortcuts.map((s) => (
              <li key={`${s.meta.location}`}>
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
