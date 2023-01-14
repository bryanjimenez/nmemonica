import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAtom,
  faFont,
  // faSignInAlt,
  // faSignOutAlt,
  faWrench,
  faYinYang,
} from "@fortawesome/free-solid-svg-icons";
import { PhrasesMeta } from "../Pages/Phrases";
import { VocabularyMeta } from "../Pages/Vocabulary";
import { OppositesGameMeta } from "../Games/OppositesGame";
import { KanaGameMeta } from "../Pages/KanaGame";
import { ParticlesGameMeta } from "../Games/ParticlesGame";
import { SettingsMeta } from "../Pages/Settings";
// import { OAuthLoginMeta } from "../Pages/OAuthLogin";
// import { LogoutMeta } from "../Pages/Logout";
import classNames from "classnames";

import "./Navigation.css";
import { KanjiMeta } from "../Pages/Kanji";
import { toggleKana } from "../../actions/settingsAct";
import { labelOptions, toggleOptions } from "../../helper/gameHelper";
import { KanjiGameMeta } from "../Games/KanjiGame";

/**
 * @template T
 * @typedef {import("react").MouseEvent<T>} MouseEvent
 */

/**
 * @typedef {Object} NavigationState
 * @property {boolean} collapsed
 * @property {number} vocabType
 * @property {number} kanjiType
 */

class Navigation extends Component {
  // @ts-ignore constructor
  constructor(props) {
    super(props);

    /** @type {NavigationState} */
    this.state = {
      collapsed: true,
      vocabType: 0,
      kanjiType: 0,
    };

    /** @type {import("../../typings/raw").SetState<NavigationState>} */
    this.setState;

    this.menuToggle = this.menuToggle.bind(this);
    this.clickBehavior = this.clickBehavior.bind(this);
  }

  menuToggle() {
    this.setState((state) => {
      if (state.collapsed) {
        document.body.classList.add("no-scroll");
        window.scrollTo(0, 0);
      } else {
        document.body.classList.remove("no-scroll");
      }

      return {
        collapsed: !state.collapsed,
      };
    });
  }

  /**
   * Clicking on icons should collapse menu (force-collapse).
   * Clicking on captions should not (prevent-collapse).
   * Anywhere else should.
   * @template HTMLDivElement
   * @param {MouseEvent<HTMLDivElement>} event
   */
  clickBehavior(event) {
    if (event.target) {
      const tEl = /** @type {Element} */ (event.target);
      if (
        Array.from(document.getElementsByClassName("force-collapse")).includes(
          tEl
        )
      ) {
        // force a collapse, Link el is preventing?
        this.menuToggle();
      } else if (
        !Array.from(
          document.getElementsByClassName("prevent-collapse")
        ).includes(tEl)
      ) {
        // any child elem without classname^ toggles
        this.menuToggle();
        return false;
      }
    }
  }

  render() {
    let shortcuts = [
      {
        meta: {
          ...KanaGameMeta,
          label: labelOptions(this.props.charSet, KanaGameMeta.label),
        },
        icon: (
          <div className="not-a-real-icon">
            {labelOptions(this.props.charSet, ["あ", "ア", "*"])}
          </div>
        ),
        wrap: (/** @type {string} */ child) => (
          <div
            className="clickable prevent-collapse"
            onClick={() => {
              this.props.toggleKana();
            }}
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
        meta: [VocabularyMeta, PhrasesMeta][this.state.vocabType],
        icon: <FontAwesomeIcon icon={faFont} size="2x" />,
        wrap: (/** @type {string} */ child) => (
          <div
            className="clickable prevent-collapse"
            onClick={() => {
              this.setState((s) => ({
                vocabType: toggleOptions(s.vocabType, ["Vocab", "Phrases"]),
              }));
            }}
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
        meta: [KanjiMeta, KanjiGameMeta][this.state.kanjiType],
        icon: (
          <div className="not-a-real-icon">
            {labelOptions(this.state.kanjiType, ["漢", "G"])}
          </div>
        ),
        wrap: (/** @type {string} */ child) => (
          <div
            className="clickable prevent-collapse"
            onClick={() => {
              this.setState((s) => ({
                kanjiType: toggleOptions(s.kanjiType, ["Kanji", "KanjiGame"]),
              }));
            }}
          >
            {child}
          </div>
        ),
      },
      {
        meta: SettingsMeta,
        icon: <FontAwesomeIcon icon={faWrench} size="2x" />,
      },
    ];

    return (
      <div className="navigation">
        <nav className="my-navbar">
          <Link /*className="navbar-brand"*/ aria-label="Home" to="/">
            {/* <span>Nmemonica</span> */}
            {/* <span>Language Flash Cards</span> */}
          </Link>
          <div className="button d-lg-none mt-2 me-2" onClick={this.menuToggle}>
            <button
              className={classNames({
                "nav-menu-btn": true,
                collapsed: this.state.collapsed,
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
              collapse: this.state.collapsed,
            })}
            id="nav-menu-mobile"
            onClick={this.clickBehavior}
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
}

Navigation.propTypes = {
  user: PropTypes.object,
  charSet: PropTypes.number,
  toggleKana: PropTypes.func,
};
// @ts-ignore mapStateToProps
const mapStateToProps = (state) => {
  return { user: state.login.user, charSet: state.settings.kana.charSet };
};

export default connect(mapStateToProps, { toggleKana })(Navigation);
