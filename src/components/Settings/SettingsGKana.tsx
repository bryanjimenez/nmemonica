import { useDispatch } from "react-redux";

import { buildAction } from "../../helper/eventHandlerHelper";
import { labelOptions } from "../../helper/gameHelper";
import { useConnectKana } from "../../hooks/useConnectKana";
import type { AppDispatch } from "../../slices";
import {
  setKanaBtnN,
  toggleKana,
  toggleKanaEasyMode,
  toggleKanaGameWideMode,
} from "../../slices/kanaSlice";
import { KanaType } from "../../slices/settingHelper";
import ChoiceNumberSlider from "../Input/ChoiceNumberSlider";
import SettingsSwitch from "../Input/SettingsSwitch";

export default function SettingsKanaGame() {
  const dispatch = useDispatch<AppDispatch>();

  const { charSet, easyMode, wideMode, choiceN } = useConnectKana();

  const el = (
    <div className="outer">
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1"></div>
        <div className="column-2 setting-block">
          <div>
            <SettingsSwitch
              active={charSet === KanaType.HIRAGANA}
              action={buildAction(dispatch, toggleKana)}
              statusText={labelOptions(charSet, [
                "Hiragana",
                "Katakana",
                "Mixed",
              ])}
            />
          </div>
          <div className="d-flex justify-content-end p-2">
            <ChoiceNumberSlider
              initial={choiceN}
              setChoiceN={buildAction(dispatch, setKanaBtnN)}
              wideMode={wideMode}
              wideN={31}
              toggleWide={buildAction(dispatch, toggleKanaGameWideMode)}
            />
          </div>
          <div>
            <SettingsSwitch
              active={easyMode}
              action={buildAction(dispatch, toggleKanaEasyMode)}
              statusText="Kana Hints"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return el;
}
