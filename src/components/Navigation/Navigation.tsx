import {
  faAtom,
  faFont,
  faWrench,
  faYinYang,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClickAwayListener } from "@mui/material";
import { TableIcon } from "@primer/octicons-react";
import classNames from "classnames";
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { buildAction, setStateFunction } from "../../helper/eventHandlerHelper";
import { labelOptions, toggleOptions } from "../../helper/gameHelper";
import { useWindowSize } from "../../hooks/useWindowSize";
import type { RootState } from "../../slices";
import { toggleKana } from "../../slices/kanaSlice";
import { KanjiGameNav } from "../Games/KanjiGame";
import { OppositesGameNav } from "../Games/OppositesGame";
import { ParticlesGameNav } from "../Games/ParticlesGame";
import { KanaGameNav } from "../Pages/KanaGame";
import { KanjiNav } from "../Pages/Kanji";
import { PhraseNav } from "../Pages/Phrases";
import { SettingsNav } from "../Pages/Settings";
import { SheetNav } from "../Pages/Sheet";
import { VocabularyNav } from "../Pages/Vocabulary";
import "../../css/Navigation.css";

export default function Navigation() {
  const dispatch = useDispatch();

  const { darkMode } = useSelector(({ global }: RootState) => global);
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

  const clickBehavior = useCallback(
    /**
     * Clicking on icons should collapse menu (force-collapse).
     * Clicking on captions should not (prevent-collapse).
     * Anywhere else should.
     */
    <T extends { target: EventTarget | null }>(event: T) => {
      if (event.target === null) {
        return undefined;
      }
      const tEl = event.target as Element;
      if (
        Array.from(document.getElementsByClassName("force-collapse")).includes(
          tEl
        )
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
    },
    [menuToggle]
  );

  let shortcuts = useMemo(
    () => [
      {
        meta: {
          ...KanaGameNav,
          label: labelOptions(charSet, KanaGameNav.label),
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
        meta: OppositesGameNav,
        icon: <FontAwesomeIcon icon={faYinYang} size="2x" />,
      },
      {
        meta: [VocabularyNav, PhraseNav][vocabType],
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
        meta: ParticlesGameNav,
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
        meta: [KanjiNav, KanjiGameNav][kanjiType],
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
        meta: SettingsNav,
        icon: <FontAwesomeIcon icon={faWrench} size="2x" />,
      },
      {
        meta: { location: SheetNav.location, label: "Edit" },
        icon: <TableIcon size="medium" />,
      },
    ],
    [dispatch, charSet, kanjiType, vocabType]
  );

  // const home = (
  //   <Link /*className="navbar-brand"*/ aria-label="Home" to="/">
  //     {/* <span>Nmemonica</span> */}
  //     {/* <span>Language Flash Cards</span> */}
  //   </Link>
  // );

  const navButton = (
    <div
      className="button m-2"
      onClick={menuToggle}
    >
      <button
        className={classNames({
          "nav-menu-btn": true,
          collapsed: collapsed,
          darkmode: darkMode || undefined,
        })}
        type="button"
        aria-controls="nav-menu"
        aria-expanded="false"
        aria-label="Toggle Navigation Menu"
      >
        <span className="nav-btn-line" />
        <span className="nav-btn-line" />
        <span className="nav-btn-line" />
      </button>
    </div>
  );

  const navMenuMobile = (
    <div
      className={classNames({
        "gray-menu mobile d-lg-none": true,
        collapse: collapsed,
      })}
      id="nav-menu"
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
  );

  const w = useWindowSize();
  const desktopWidth = w.width !== undefined && w.width >= 992;

  const navMenuDesktop = (
    <div
      className={classNames({
        "gray-menu desktop": true,
        collapse: collapsed,
      })}
      id="nav-menu"
      onClick={clickBehavior}
    >
      <ClickAwayListener
        onClickAway={clickBehavior}
        mouseEvent={!collapsed && desktopWidth ? "onMouseUp" : false}
        touchEvent={!collapsed && desktopWidth ? "onTouchEnd" : false}
      >
        <ul className="d-flex flex-column justify-content-center text-center align-items-center p-4">
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
      </ClickAwayListener>
    </div>
  );
  return (
    <div className="navigation">
      <nav className="my-navbar">
        {navButton}
        {/* Desktop navigation icons */}
        {navMenuDesktop}

        {/* Mobile navigation icons */}
        {navMenuMobile}
      </nav>
    </div>
  );
}
