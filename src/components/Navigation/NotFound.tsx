import classNames from "classnames";
import { useEffect, useState } from "react";
import "../../css/NotFound.css";

export default function NotFound() {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  return (
    <div className="d-flex justify-content-center h-100 align-items-center">
      <div
        className={classNames({
          "d-flex flex-column text-center not-found": true,
          "notification-fade": !fadeIn,
          "notification-fade-in": fadeIn,
        })}
      >
        <div>404</div>
        <div>This page isn&apos;t found..?</div>
      </div>
    </div>
  );
}
