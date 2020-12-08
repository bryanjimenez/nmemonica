import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAtom,
  faFont,
  faWrench,
  faYinYang,
} from "@fortawesome/free-solid-svg-icons";
import { VerbsMeta } from "../Pages/Verbs";
import { PhrasesMeta } from "../Pages/Phrases";
import { OppositesMeta } from "../Pages/Opposites";
import { HiraganaGameMeta } from "../Pages/HiraganaGame";
import { ParticlesGameMeta } from "../Pages/ParticlesGame";
import { SettingsMeta } from "../Pages/Settings";

import "./Navigation.css";

class Navigation extends Component {
  render() {
    const shortcuts = [
      { meta: VerbsMeta, icon: <FontAwesomeIcon icon={faFont} size="2x" /> },
      { meta: PhrasesMeta, icon: <FontAwesomeIcon icon={faFont} size="2x" /> },
      {
        meta: OppositesMeta,
        icon: <FontAwesomeIcon icon={faYinYang} size="2x" />,
      },
      {
        meta: HiraganaGameMeta,
        icon: <div className="not-a-real-icon">あ</div>,
      },
      {
        meta: ParticlesGameMeta,
        icon: <FontAwesomeIcon icon={faAtom} size="2x" />,
      },
      {
        meta: SettingsMeta,
        icon: <FontAwesomeIcon icon={faWrench} size="2x" />,
      },
    ];

    return (
      <div className="navigation">
        <nav className="navbar navbar-expand-lg">
          <Link className="navbar-brand" to="/">
            {/* <span>Nmemonica</span> */}
            {/* <span>Language Flash Cards</span> */}
          </Link>
          <div>
            <button
              className="navbar-toggler collapsed"
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
            className="navItems collapse navbar-collapse"
            id="navbarSupportedContent"
          >
            <ul
              className="navbar-nav"
              data-toggle="collapse"
              data-target=".navbar-collapse.show"
            >
              <li className="nav-item d-lg-none">
                {/* <div className="dropdown-divider" /> */}

                <div className="shortcuts mt-2">
                  {shortcuts.map((l) => (
                    <div className="shortcut-item">
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

              {shortcuts.map((s) => (
                <li className="nav-item d-none d-lg-block">
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
  phone: PropTypes.string,
  gmaps: PropTypes.string,
};

const mapStateToProps = (state) => {
  // let { phone, gmaps } = state.contact;

  return { phone: "", gmaps: "" };
};

export default connect(mapStateToProps, {})(Navigation);
