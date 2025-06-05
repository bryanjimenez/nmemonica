import { useDispatch } from "react-redux";

import { buildAction } from "../../helper/eventHandlerHelper";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import type { AppDispatch } from "../../slices";
import { toggleOppositeFadeInAnswers } from "../../slices/oppositeSlice";
import SettingsSwitch from "../Input/SettingsSwitch";

export default function SettingsOppositeGame() {
  const dispatch = useDispatch<AppDispatch>();
  const { oppositeFadeInAnswers } = useConnectSetting();

  const el = (
    <div className="outer">
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1"></div>
        <div className="column-2 setting-block">
          <div className="mb-2">
            <SettingsSwitch
              active={oppositeFadeInAnswers}
              action={buildAction(dispatch, toggleOppositeFadeInAnswers)}
              statusText="Fade in answers"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return el;
}
