import { useDispatch } from "react-redux";

import SettingsSwitch from "./SettingsSwitch";
import { buildAction } from "../../helper/eventHandlerHelper";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import type { AppDispatch } from "../../slices";
import {
  setOppositesARomaji,
  setOppositesQRomaji,
  toggleOppositeFadeInAnswers,
} from "../../slices/oppositeSlice";

export default function SettingsOppositeGame() {
  const dispatch = useDispatch<AppDispatch>();
  const { oppositesQRomaji, oppositesARomaji, oppositeFadeInAnswers } =
    useConnectSetting();

  const el = (
    <div className="outer">
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1"></div>
        <div className="column-2 setting-block">
          <div className="mb-2">
            <SettingsSwitch
              active={oppositesQRomaji}
              action={buildAction(dispatch, setOppositesQRomaji)}
              statusText="Question Romaji"
            />
          </div>
          <div className="mb-2">
            <SettingsSwitch
              active={oppositesARomaji}
              action={buildAction(dispatch, setOppositesARomaji)}
              statusText="Answer Romaji"
            />
          </div>
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
