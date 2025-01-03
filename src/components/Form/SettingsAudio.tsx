import { useDispatch } from "react-redux";

import SimpleListMenu from "./SimpleListMenu";
import { buildAction } from "../../helper/eventHandlerHelper";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { VOICE_KIND_JA } from "../../slices/audioSlice";
import { setJapaneseVoice } from "../../slices/globalSlice";
import { properCase } from "../Games/KanjiGame";

export default function SettingsAudio() {
  const dispatch = useDispatch();

  const { japaneseVoice } = useConnectSetting();

  const jVoiceOptions = ["default", ...Object.values(VOICE_KIND_JA)];

  const el = (
    <div className="outer">
      <h3 className="mt-3 mb-1 fw-light">Japanese</h3>
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1"></div>
        <div className="column-2 setting-block">
          <div className="mb-2">
            <SimpleListMenu
              title={"Voice type:"}
              options={jVoiceOptions.map(properCase)}
              initial={jVoiceOptions.indexOf(japaneseVoice)}
              onChange={(index) => {
                const value = jVoiceOptions[index];
                return buildAction(dispatch, setJapaneseVoice)(value);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return el;
}
