import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import {
  GiftIcon,
  PlusCircleIcon,
  ProjectIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faDice,
  faGlasses,
  faPencilAlt,
  faRecycle,
  faRunning,
} from "@fortawesome/free-solid-svg-icons";

/**
 * @typedef {import("../../typings/raw").RawVocabulary} RawVocabulary
 * @typedef {{uid:string, english:string, grp?:string}} MinimunRawItem
 */

/**
 * @typedef {{
 * visible?: boolean,
 * active: boolean,
 * toggle: boolean,
 * toggleFurigana: (uid:string)=>void,
 * vocabulary: RawVocabulary,
 * }} ToggleFuriganaBtnProps
 * @param {ToggleFuriganaBtnProps} props
 */
export function ToggleFuriganaBtn(props) {
  const { active, toggle, toggleFurigana, vocabulary } = props;

  return props.visible === false ? null : (
    <div
      className={classNames({
        clickable: active,
        "sm-icon-grp": true,
        "sm-kanji": active,
      })}
      onClick={active ? () => toggleFurigana(vocabulary.uid) : undefined}
      aria-label="Toggle furigana"
    >
      {active ? (
        <ruby>
          漢
          <rt className={classNames({ "disabled disabled-color": !toggle })}>
            ふりがな
          </rt>
        </ruby>
      ) : (
        <span className="disabled disabled-color">あ</span>
      )}
    </div>
  );
}

ToggleFuriganaBtn.propTypes = {
  visible: PropTypes.bool,
  active: PropTypes.bool,
  toggle: PropTypes.bool,
  toggleFurigana: PropTypes.func,
  hasFurigana: PropTypes.bool,
  vocabulary: PropTypes.object,
};

/**
 * @typedef {{
 * visible?: boolean,
 * active?: boolean,
 * addFrequencyTerm: (uid:string)=>void,
 * removeFrequencyTerm: (uid:string)=>void,
 * toggle: boolean,
 * term: MinimunRawItem,
 * }} ToggleFrequencyTermBtnProps
 * @param {ToggleFrequencyTermBtnProps} props
 */
export function ToggleFrequencyTermBtn(props) {
  const { addFrequencyTerm, removeFrequencyTerm, toggle, term } = props;

  return props.visible === false ? null : (
    <div
      className="sm-icon-grp clickable"
      onClick={() => {
        if (toggle) {
          removeFrequencyTerm(term.uid);
        } else {
          addFrequencyTerm(term.uid);
        }
      }}
      aria-label={toggle ? "Remove term" : "Add term"}
    >
      {toggle ? <XCircleIcon size="small" /> : <PlusCircleIcon size="small" />}
    </div>
  );
}

ToggleFrequencyTermBtn.propTypes = {
  visible: PropTypes.bool,
  active: PropTypes.bool,
  addFrequencyTerm: PropTypes.func,
  removeFrequencyTerm: PropTypes.func,
  toggle: PropTypes.bool,
  term: PropTypes.object,
};

/**
 * @typedef {{
 * visible: boolean,
 * active: boolean,
 * setState: (state:{showHint:boolean})=>void }} ShowHintBtnProps
 * @param {ShowHintBtnProps} props
 */
export function ShowHintBtn(props) {
  const active = props.active;
  const parentSetState = props.setState;

  return !props.visible ? null : (
    <div
      className={classNames({
        "sm-icon-grp": true,
        clickable: active,
        "disabled disabled-color": !active,
      })}
      onClick={
        active
          ? () => {
              parentSetState({ showHint: true });
              setTimeout(() => {
                parentSetState({ showHint: false });
              }, 1500);
            }
          : undefined
      }
      aria-label={active ? "Show hint" : "Hint unavailable"}
    >
      <GiftIcon size="small" />
    </div>
  );
}

ShowHintBtn.propTypes = {
  visible: PropTypes.bool,
  active: PropTypes.bool,
  setState: PropTypes.func,
};

/**
 * @typedef {{
 * visible: boolean,
 * active?: boolean,
 * toggleAutoVerbView: function,
 * autoVerbView: boolean,
 * }} ToggleAutoVerbViewBtnProps
 * @param {ToggleAutoVerbViewBtnProps} props
 */
export function ToggleAutoVerbViewBtn(props) {
  const { toggleAutoVerbView, autoVerbView } = props;

  return !props.visible ? null : (
    <div
      className="sm-icon-grp clickable"
      onClick={() => toggleAutoVerbView()}
      aria-label="Toggle auto verb view"
    >
      <FontAwesomeIcon icon={!autoVerbView ? faRunning : faBan} />
    </div>
  );
}

ToggleAutoVerbViewBtn.propTypes = {
  visible: PropTypes.bool,
  active: PropTypes.bool,
  toggleAutoVerbView: PropTypes.func,
  autoVerbView: PropTypes.bool,
};

/**
 * @typedef {{
 * visible?: boolean,
 * active?: boolean,
 * action: function,
 * }} ReCacheAudioBtnProps
 * @param {ReCacheAudioBtnProps} props
 */
export function ReCacheAudioBtn(props) {
  const { active, action } = props;

  return props.visible === false ? null : (
    <div
      className={classNames({
        clickable: true,
        "sm-icon-grp": true,
        "disabled-color": active,
      })}
      onClick={() => {
        if (typeof action === "function") {
          action();
        }
      }}
      aria-label="Override audio"
    >
      <FontAwesomeIcon icon={faRecycle} />
    </div>
  );
}

ReCacheAudioBtn.propTypes = {
  visible: PropTypes.bool,
  active: PropTypes.bool,
  action: PropTypes.func,
};

/**
 * @typedef {{
 * visible?: boolean,
 * active?: boolean,
 * action: function,
 * toggle: boolean,
 * }} TogglePracticeSideBtnProps
 * @param {TogglePracticeSideBtnProps} props
 */
export function TogglePracticeSideBtn(props) {
  const { action, toggle } = props;

  return props.visible === false ? null : (
    <div
      className="clickable"
      onClick={() => {
        if (typeof action === "function") {
          action();
        }
      }}
      aria-label="Toggle practice side"
    >
      <FontAwesomeIcon icon={toggle ? faGlasses : faPencilAlt} />
    </div>
  );
}

TogglePracticeSideBtn.propTypes = {
  visible: PropTypes.bool,
  active: PropTypes.bool,
  toggle: PropTypes.bool,
  action: PropTypes.func,
};

/**
 * @typedef {{
 * visible: boolean,
 * active?: boolean,
 * action: function,
 * toggle: boolean,
 * }} ToggleLiteralPhraseBtnProps
 * @param {ToggleLiteralPhraseBtnProps} props
 */
export function ToggleLiteralPhraseBtn(props) {
  const { action, toggle } = props;

  return !props.visible ? null : (
    <div
      className={classNames({
        clickable: true,
        "sm-icon-grp": true,
        "info-color": toggle,
      })}
      onClick={() => {
        if (typeof action === "function") {
          action();
        }
      }}
      aria-label="Literal english translation"
    >
      <ProjectIcon size="small" />
    </div>
  );
}

ToggleLiteralPhraseBtn.propTypes = {
  visible: PropTypes.bool,
  active: PropTypes.bool,
  toggle: PropTypes.bool,
  action: PropTypes.func,
};

/**
 * @typedef {{
 * visible: boolean,
 * }} FrequencyWordIconProps
 * @param {FrequencyWordIconProps} props
 */
export function FrequencyTermIcon(props) {
  return !props.visible ? null : (
    <div>
      <FontAwesomeIcon icon={faDice} />
    </div>
  );
}

FrequencyTermIcon.propTypes = {
  visible: PropTypes.bool,
};

/**
 * @typedef {{
 * visible: boolean,
 * hover?: import("../Pages/Vocabulary").VocabularyState["tpBtn"],
 * onClick?: function,
 * onPronunciation?: function,
 * onIncorrect?: function,
 * onReset?: function,
 * prevMissPronu: boolean,
 * }} TimePlayVerifyBtnsProps
 * @param {TimePlayVerifyBtnsProps} props
 */
export function TimePlayVerifyBtns(props) {
  return !props.visible ? null : (
    <React.Fragment>
      <div
        key={0}
        className="sm-icon-grp"
        onClick={() => {
          if (typeof props.onClick === "function") {
            props.onClick();
          }

          if (typeof props.onIncorrect === "function") {
            props.onIncorrect();
          }
        }}
      >
        <span
          className={classNames({
            "border-bottom": props.hover === "incorrect",
          })}
        >
          {"-1"}
        </span>
      </div>
      <div
        key={1}
        className="sm-icon-grp"
        onClick={() => {
          if (typeof props.onClick === "function") {
            props.onClick();
          }

          if (typeof props.onPronunciation === "function") {
            props.onPronunciation();
          }
        }}
      >
        <span
          className={classNames({
            "border-bottom":
              props.hover === "pronunciation" ||
              (props.hover !== "reset" && props.prevMissPronu === true),
          })}
        >
          {"P"}
        </span>
      </div>
      <div
        key={2}
        className="sm-icon-grp"
        onClick={() => {
          if (typeof props.onClick === "function") {
            props.onClick();
          }
          if (typeof props.onReset === "function") {
            props.onReset();
          }
        }}
      >
        <span
          className={classNames({
            "border-bottom": props.hover === "reset",
          })}
        >
          0
        </span>
      </div>
    </React.Fragment>
  );
}

TimePlayVerifyBtns.propTypes = {
  visible: PropTypes.bool,
  hover: PropTypes.string,
  onClick: PropTypes.func,
  onIncorrect: PropTypes.func,
  onPronunciation: PropTypes.func,
  onReset: PropTypes.func,
  prevMissPronu: PropTypes.bool,
};
