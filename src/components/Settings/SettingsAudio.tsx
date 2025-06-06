import { useDispatch } from "react-redux";

import SimpleListMenu from "../Form/SimpleListMenu";
import { VOICE_KIND_EN, VOICE_KIND_JA } from "../../constants/voiceConstants";
import { buildAction } from "../../helper/eventHandlerHelper";
import { useConnectSetting } from "../../hooks/useConnectSettings";
import { setEnglishVoice, setJapaneseVoice } from "../../slices/globalSlice";
import { properCase } from "../Games/KanjiGame";

export default function SettingsAudio() {
  const dispatch = useDispatch();

  const { japaneseVoice, englishVoice } = useConnectSetting();

  const jVoiceOptions = ["default", ...Object.values(VOICE_KIND_JA)];
  const eVoiceOptions = ["default", ...Object.values(VOICE_KIND_EN)];

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
      <h3 className="mt-3 mb-1 fw-light">English</h3>
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1"></div>
        <div className="column-2 setting-block">
          <div className="mb-2">
            <SimpleListMenu
              title={"Voice type:"}
              options={eVoiceOptions.map((v) =>
                v.split(" ").map(properCase).join(" ")
              )}
              initial={eVoiceOptions.indexOf(englishVoice)}
              onChange={(index) => {
                const value = eVoiceOptions[index];
                return buildAction(dispatch, setEnglishVoice)(value);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return el;
}
