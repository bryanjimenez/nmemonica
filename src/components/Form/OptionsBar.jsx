import React, { memo, useEffect, useRef } from "react";
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
import { useForceRender } from "../../hooks/helperHK";

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
 * @typedef {Object} ToggleFrequencyTermBtnProps
 * @property {boolean} [visible]
 * @property {boolean} [active]
 * @property {(uid:string)=>void} addFrequencyTerm
 * @property {(uid:string)=>void} removeFrequencyTerm
 * @property {boolean} toggle
 * @property {MinimunRawItem} term
 * @property {number} [count]
 */
export function ToggleFrequencyTermBtn(
  /** @type {ToggleFrequencyTermBtnProps}*/ props
) {
  const prevCount = useRef(0);

  const {
    addFrequencyTerm,
    removeFrequencyTerm,
    toggle,
    term,
    count = prevCount.current, // count is optional
  } = props;
  const forceRender = useForceRender();

  const fade = prevCount.current === count;

  useEffect(() => {
    prevCount.current = count !== undefined ? count : 0;

    if (fade === false) {
      // fade this time
      forceRender();
    }
  }, [count, fade, forceRender]);

  return props.visible === false ? null : (
    <div
      aria-label={toggle ? "Remove term" : "Add term"}
      className="sm-icon-grp clickable"
      onClick={() => {
        if (toggle) {
          removeFrequencyTerm(term.uid);
        } else {
          addFrequencyTerm(term.uid);
        }
      }}
    >
      {toggle ? <XCircleIcon size="small" /> : <PlusCircleIcon size="small" />}
      {count !== undefined && count > -1 && (
        <span
          className={classNames({
            notification: true,
            "notification-fade": fade,
          })}
        >
          {count}
        </span>
      )}
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
  count: PropTypes.number,
};

export const ToggleFrequencyTermBtnMemo = memo(ToggleFrequencyTermBtn);

export const ToggleFrequencyTermBtnMemoLegacy = memo(
  ToggleFrequencyTermBtn,
  ToggleFrequencyTermBtnIsEq
);

/**
 * @param {ToggleFrequencyTermBtnProps} oldProps
 * @param {ToggleFrequencyTermBtnProps} newProps
 */
function ToggleFrequencyTermBtnIsEq(oldProps, newProps) {
  // console.table({old: oldProps, new: newProps})

  const optionalSame = oldProps.toggle === newProps.toggle;

  const interDepSame =
    (oldProps.count === newProps.count &&
      oldProps.toggle === newProps.toggle) ||
    (oldProps.count === newProps.count &&
      oldProps.toggle !== newProps.toggle) ||
    (oldProps.count !== newProps.count && oldProps.toggle === newProps.toggle);

  const reqSame =
    oldProps.term.uid === newProps.term.uid &&
    oldProps.active === newProps.active &&
    oldProps.visible === newProps.visible &&
    oldProps.addFrequencyTerm === newProps.addFrequencyTerm &&
    oldProps.removeFrequencyTerm === newProps.removeFrequencyTerm;

  const isSame =
    (newProps.count !== undefined ? interDepSame : optionalSame) && reqSame;

  return isSame;
}

/**
 * @typedef {{
 * visible: boolean,
 * active: boolean,
 * setShowHint: (showHintValue:boolean)=>void }} ShowHintBtnProps
 * @param {ShowHintBtnProps} props
 */
export function ShowHintBtn(props) {
  const { active, setShowHint } = props;

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
              setShowHint(true);
              setTimeout(() => {
                setShowHint(false);
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
  setShowHint: PropTypes.func,
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
    <div aria-label="Toggle practice side">
      <FontAwesomeIcon
        className="clickable"
        onClick={() => {
          if (typeof action === "function") {
            action();
          }
        }}
        icon={toggle ? faGlasses : faPencilAlt}
      />
      <span className="notification">
        <FontAwesomeIcon icon={!toggle ? faGlasses : faPencilAlt} />
      </span>
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
