import classNames from "classnames";
import React, { useEffect, useState } from "react";
import "../../css/NotFound.css";

import background from "../../../image/notfound/background.jpeg";
import bigHouse from "../../../image/notfound/bhouse.png";
import error from "../../../image/notfound/error.png";
import lilHouse from "../../../image/notfound/lhouse.png";
import octocat from "../../../image/notfound/octocat.png";
import ship from "../../../image/notfound/ship.png";

export default function NotFound() {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  return (
    <div
      className={classNames({
        "not-found": true,
        "position-relative": true,
        "notification-fade": !fadeIn,
        "notification-fade-in": fadeIn,
      })}
    >
      <div className="position-absolute overflow-hidden width-full top-0 left-0">
        <img
          alt=""
          className="c404-back"
          data-invert="true"
          data-xrange="0"
          data-yrange="20"
          height="415"
          width="940"
          // eslint-disable-next-line
          src={background} // imported image(any) to url(string)
        />
      </div>
      <div className="c404-cont position-relative d-block my-0 mx-auto overflow-hidden">
        <img
          alt="404 “This is not the web page you are looking for”"
          className="c404-err js-plaxify position-absolute"
          data-xrange="20"
          data-yrange="10"
          height="249"
          width="271"
          // eslint-disable-next-line
          src={error}
        />

        <img
          alt=""
          className="c404-cat js-plaxify position-absolute"
          data-xrange="10"
          data-yrange="10"
          height="230"
          width="188"
          // eslint-disable-next-line
          src={octocat}
        />

        <img
          alt=""
          className="c404-ship js-plaxify position-absolute"
          data-xrange="10"
          data-yrange="10"
          height="156"
          width="440"
          // eslint-disable-next-line
          src={ship}
        />
        <img
          alt=""
          className="c404-bhouse js-plaxify position-absolute"
          data-invert="true"
          data-xrange="50"
          data-yrange="20"
          height="123"
          width="304"
          // eslint-disable-next-line
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
          // eslint-disable-next-line
          src={lilHouse}
        />
      </div>
    </div>
  );
}
