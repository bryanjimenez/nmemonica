import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAtom, faFont, faYinYang } from "@fortawesome/free-solid-svg-icons";
import { VerbsMeta } from "../Pages/Verbs";
import { PhrasesMeta } from "../Pages/Phrases";
import { OppositesMeta } from "../Pages/Opposites";
import { HiraganaGameMeta } from "../Pages/HiraganaGame";
import { ParticlesGameMeta } from "../Pages/ParticlesGame";
import "./Navigation.css";

class Navigation extends Component {
  render() {
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
                  <div className="shortcut-item">
                    <Link to={VerbsMeta.location}>
                      <div>
                        <FontAwesomeIcon icon={faFont} size="2x" />
                        <div className="nav-caption">{VerbsMeta.label}</div>
                      </div>
                    </Link>
                  </div>
                  <div className="shortcut-item">
                    <Link to={PhrasesMeta.location}>
                      <div>
                        <FontAwesomeIcon icon={faFont} size="2x" />
                        <div className="nav-caption">{PhrasesMeta.label}</div>
                      </div>
                    </Link>
                  </div>
                  <div className="shortcut-item">
                    <Link to={OppositesMeta.location}>
                      <div>
                        <FontAwesomeIcon icon={faYinYang} size="2x" />
                        <div className="nav-caption">{OppositesMeta.label}</div>
                      </div>
                    </Link>
                  </div>
                  <div className="shortcut-item">
                    <Link to={HiraganaGameMeta.location}>
                      <div>
                        <div className="not-a-real-icon">あ</div>
                        <div className="nav-caption">
                          {HiraganaGameMeta.label}
                        </div>
                      </div>
                    </Link>
                  </div>
                  <div className="shortcut-item">
                    <Link to={ParticlesGameMeta.location}>
                      <div>
                        <FontAwesomeIcon icon={faAtom} size="2x" />
                        <div className="nav-caption">
                          {ParticlesGameMeta.label}
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* <div className="dropdown-divider" /> */}
              </li>

              <li className="nav-item d-none d-lg-block">
                <Link className="nav-link" to={VerbsMeta.location}>
                  {VerbsMeta.label}
                </Link>
              </li>
              <li className="nav-item  d-none d-lg-block">
                <Link className="nav-link" to={PhrasesMeta.location}>
                  {PhrasesMeta.label}
                </Link>
              </li>
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
