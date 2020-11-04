import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone,
  faMapMarkerAlt,
  faMap,
} from "@fortawesome/free-solid-svg-icons";

import { AboutMeta } from "../Pages/About";
// import { NewsMeta } from "../News/News";
import { VerbsMeta } from "../Pages/Verbs";
import "./Navigation.css";

class Navigation extends Component {
  render() {
    return (
      <div className="navigation">
        <nav className="navbar navbar-expand-lg navbar-dark">
          <Link className="navbar-brand" to="/">
            <span>Nmemonica</span>
            <span>Language Flash Cards</span>
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
                    <a href={"tel: " + this.props.phone}>
                      <div>
                        <FontAwesomeIcon icon={faPhone} size="2x" />
                        <div className="nav-caption">Phone</div>
                      </div>
                    </a>
                  </div>
                  <div className="shortcut-item">
                    <a
                      href={this.props.gmaps}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div>
                        <FontAwesomeIcon icon={faMapMarkerAlt} size="2x" />
                        <div className="nav-caption">Directions</div>
                      </div>
                    </a>
                  </div>
                  <div className="shortcut-item">
                    <Link to="/menu/">
                      <div>
                        <FontAwesomeIcon icon={faMap} size="2x" />
                        <div className="nav-caption">Menu</div>
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
                <Link className="nav-link" to="/menu/">
                  Menu
                </Link>
              </li>
              <li className="nav-item">
                {/* <Link className="nav-link" to={AboutMeta.location}> */}
                <Link className="nav-link" to="/menu/">
                  menu
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/menu/">
                  Menu
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
