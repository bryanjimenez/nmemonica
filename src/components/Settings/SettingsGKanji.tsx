import { useDispatch } from "react-redux";

import { buildAction } from "../../helper/eventHandlerHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import type { AppDispatch } from "../../slices";
import {
  setKanjiBtnN,
  toggleKanjiFadeInAnswers,
  toggleKanjiOrdering,
} from "../../slices/kanjiSlice";
import { TermSortBy, TermSortByLabel } from "../../slices/settingHelper";
import SimpleListMenu from "../Form/SimpleListMenu";
import ChoiceNumberSlider from "../Input/ChoiceNumberSlider";
import SettingsSwitch from "../Input/SettingsSwitch";

export default function SettingsKanjiGame() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    sortMethod,
    fadeInAnswers: kanjiFadeInAnswers,
    choiceN: kanjiChoiceN,
  } = useConnectKanji();

  const el = (
    <div className="outer">
      <div className="d-flex flex-row justify-content-between">
        <div className="column-1"></div>
        <div className="column-2 setting-block">
          <div className="mb-2">
            <SimpleListMenu
              title={"Sort by:"}
              options={TermSortByLabel}
              allowed={[
                TermSortBy.DIFFICULTY,
                TermSortBy.RANDOM,
                TermSortBy.VIEW_DATE,
              ]}
              initial={sortMethod}
              onChange={buildAction(dispatch, toggleKanjiOrdering)}
            />
          </div>
          <div className="d-flex justify-content-end p-2 text-end">
            <ChoiceNumberSlider
              initial={kanjiChoiceN}
              setChoiceN={buildAction(dispatch, setKanjiBtnN)}
            />
          </div>
          <div className="d-flex justify-content-end p-2">
            <SettingsSwitch
              active={kanjiFadeInAnswers}
              action={buildAction(dispatch, toggleKanjiFadeInAnswers)}
              statusText="Fade in answers"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return el;
}
