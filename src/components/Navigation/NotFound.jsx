import React, { Component } from "react";
import "./NotFound.css";

import background from "../../../image/notfound/background.jpeg";
import error from "../../../image/notfound/error.png";
import octocat from "../../../image/notfound/octocat.png";
import ship from "../../../image/notfound/ship.png";
import bigHouse from "../../../image/notfound/bhouse.png";
import lilHouse from "../../../image/notfound/lhouse.png";

class NotFound extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div
        className="position-relative" /*style="z-index: 0; transition: all 0.25s ease-in"*/
      >
        <div
          className="position-absolute overflow-hidden width-full top-0 left-0" /*style="height: 370px"*/
        >
          <img
            alt=""
            className="c404-back"
            data-invert="true"
            data-xrange="0"
            data-yrange="20"
            height="415"
            width="940"
            src={background}
          />
        </div>
        <div
          className="c404-cont position-relative d-block my-0 mx-auto overflow-hidden" /*style="width: 940px; height: 370px; clear: both"*/
        >
          <img
            alt="404 “This is not the web page you are looking for”"
            className="c404-err js-plaxify position-absolute"
            data-xrange="20"
            data-yrange="10"
            height="249"
            width="271"
            src={error}
          />

          <img
            alt=""
            className="c404-cat js-plaxify position-absolute"
            data-xrange="10"
            data-yrange="10"
            height="230"
            width="188"
            src={octocat}
          />

          <img
            alt=""
            className="c404-ship js-plaxify position-absolute"
            data-xrange="10"
            data-yrange="10"
            height="156"
            width="440"
            src={ship}
          />

          {/* <img alt="" className="js-plaxify position-absolute" data-xrange="10" data-yrange="10" height="49" width="166" src="" /> */}

          {/* <img alt="" className="js-plaxify position-absolute" data-xrange="10" data-yrange="10" height="75" width="430" src="" /> */}

          <img
            alt=""
            className="c404-bhouse js-plaxify position-absolute"
            data-invert="true"
            data-xrange="50"
            data-yrange="20"
            height="123"
            width="304"
            src={bigHouse}
          />

          <img
            alt=""
            className="c404-lhouse js-plaxify position-absolute"
            data-invert="true"
            data-xrange="75"
            data-yrange="30"
            height="50"
            width="116"
            src={lilHouse}
          />
        </div>
      </div>
    );
  }
}

export default NotFound;
