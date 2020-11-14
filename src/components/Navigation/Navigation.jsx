import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFont, faYinYang } from "@fortawesome/free-solid-svg-icons";

import { AboutMeta } from "../Pages/About";
// import { NewsMeta } from "../News/News";
import { VerbsMeta } from "../Pages/Verbs";
import { PhrasesMeta } from "../Pages/Phrases";
import { OppositesMeta } from "../Pages/Opposites";
import "./Navigation.css";

class Navigation extends Component {
  render() {
    return (
      <div className="navigation">
        <nav className="navbar navbar-expand-lg navbar-dark">
          <Link className="navbar-brand" to="/">
            <span>Nmemonica</span>
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

                <div className="shortcuts">
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
                </div>

                <div className="dropdown-divider" />
              </li>

              <li className="nav-item">
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
