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
import { OppositesMeta } from "../Pages/Opposites";
import { KanaGameMeta } from "../Pages/KanaGame";
import { ParticlesGameMeta } from "../Pages/ParticlesGame";
import { SettingsMeta } from "../Pages/Settings";
// import { OAuthLoginMeta } from "../Pages/OAuthLogin";
// import { LogoutMeta } from "../Pages/Logout";
import classNames from "classnames";

import "./Navigation.css";
import { KanjiMeta } from "../Pages/Kanji";

class Navigation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: true,
    };

    this.menuToggle = this.menuToggle.bind(this);
  }

  menuToggle() {
    this.setState((state) => {
      if (state.collapsed) {
        document.body.style.overflow = "hidden";
        window.scrollTo(0, 0);
      } else {
        document.body.style.overflow = "";
      }

      return {
        collapsed: !state.collapsed,
      };
    });
  }

  render() {
    let shortcuts = [
      {
        meta: KanaGameMeta,
        icon: (
          <div className="not-a-real-icon">
            {this.props.charSet === 0
              ? "あ"
              : this.props.charSet === 1
              ? "ア"
              : "*"}
          </div>
        ),
      },
      { meta: PhrasesMeta, icon: <FontAwesomeIcon icon={faFont} size="2x" /> },
      {
        meta: VocabularyMeta,
        icon: <FontAwesomeIcon icon={faFont} size="2x" />,
      },
      {
        meta: OppositesMeta,
        icon: <FontAwesomeIcon icon={faYinYang} size="2x" />,
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
      { meta: KanjiMeta, icon: <div className="not-a-real-icon">{"漢"}</div> },
      {
        meta: SettingsMeta,
        icon: <FontAwesomeIcon icon={faWrench} size="2x" />,
      },
    ];

    return (
      <div className="navigation">
        <nav className="navbar navbar-expand-lg">
          <Link className="navbar-brand" aria-label="Home" to="/">
            {/* <span>Nmemonica</span> */}
            {/* <span>Language Flash Cards</span> */}
          </Link>
          <div onClick={this.menuToggle}>
            <button
              className={classNames({
                "navbar-toggler": true,
                collapsed: this.state.collapsed,
              })}
              type="button"
              data-toggle="collapse"
              data-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              {/* <span className="navbar-toggler-icon"></span> */}
              <span className="nav-toggle-btn__line" />
              <span className="nav-toggle-btn__line" />
              <span className="nav-toggle-btn__line" />
            </button>
          </div>

          <div
            className={classNames({
              "navItems navbar-collapse": true,
              collapse: this.state.collapsed,
            })}
            id="navbarSupportedContent"
            onClick={this.menuToggle}
          >
            <ul
              className="navbar-nav"
              data-toggle="collapse"
              data-target=".navbar-collapse.show"
            >
              <li className="nav-item d-lg-none">
                <div className="shortcuts w-100 d-flex flex-wrap p-4">
                  {shortcuts.map((l, i) => (
                    <div
                      key={i}
                      className="shortcut-item text-center m-3"
                      style={{ width: "25%" }}
                    >
                      <Link to={l.meta.location}>
                        <div>
                          {l.icon}
                          <div className="nav-caption">{l.meta.label}</div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
                {/* <div className="dropdown-divider" /> */}
              </li>

              {shortcuts.map((s, i) => (
                <li key={i} className="nav-item d-none d-lg-block">
                  <Link className="nav-link" to={s.meta.location}>
                    {s.meta.label}
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
};

const mapStateToProps = (state) => {
  return { user: state.login.user, charSet: state.settings.kana.charSet };
};

export default connect(mapStateToProps, {})(Navigation);
