import { useDispatch } from "react-redux";

import SettingsSwitch from "../Form/SettingsSwitch";
import { buildAction } from "../../helper/eventHandlerHelper";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import type { AppDispatch } from "../../slices";
import { toggleParticleFadeInAnswers } from "../../slices/particleSlice";

export default function SettingsParticleGame() {
  const dispatch = useDispatch<AppDispatch>();

  const { particleFadeInAnswer } = useConnectSetting();

  const el = (
    <div className="outer">
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1"></div>
        <div className="column-2 setting-block">
          <div className="mb-2">
            <SettingsSwitch
              active={particleFadeInAnswer}
              action={buildAction(dispatch, toggleParticleFadeInAnswers)}
              statusText="Fade in answers"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return el;
}
