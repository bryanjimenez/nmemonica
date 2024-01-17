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
import type { RawVocabulary } from "../../typings/raw";

interface MinimunRawItem {
  uid: string;
  english: string;
  grp?: string;
}

interface ToggleFuriganaBtnProps {
  visible?: boolean;
  active: boolean;
  toggle: boolean;
  toggleFurigana: (uid: string) => void;
  vocabulary: RawVocabulary;
}

export function ToggleFuriganaBtn(props: ToggleFuriganaBtnProps) {
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

interface ToggleFrequencyTermBtnProps {
  visible?: boolean;
  active?: boolean;
  addFrequencyTerm: (uid: string) => void;
  removeFrequencyTerm: (uid: string) => void;
  toggle: boolean;
  term: MinimunRawItem;
  count?: number;
}

export function ToggleFrequencyTermBtn(props: ToggleFrequencyTermBtnProps) {
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

    if (!fade) {
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

interface ShowHintBtnProps {
  visible?: boolean;
  active: boolean;
  setShowHint: (showHintValue: boolean) => void;
}

export function ShowHintBtn(props: ShowHintBtnProps) {
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

interface ToggleAutoVerbViewBtnProps {
  visible?: boolean;
  active?: boolean;
  toggleAutoVerbView: Function;
  autoVerbView: boolean;
}

export function ToggleAutoVerbViewBtn(props: ToggleAutoVerbViewBtnProps) {
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

interface ReCacheAudioBtnProps {
  visible?: boolean;
  active?: boolean;
  action: Function;
}

export function ReCacheAudioBtn(props: ReCacheAudioBtnProps) {
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

interface TogglePracticeSideBtnProps {
  visible?: boolean;
  active?: boolean;
  action: React.MouseEventHandler;
  toggle: boolean;
}

export function TogglePracticeSideBtn(props: TogglePracticeSideBtnProps) {
  const { action, toggle } = props;

  return props.visible === false ? null : (
    <div aria-label="Toggle practice side">
      <FontAwesomeIcon
        className="clickable"
        onClick={action}
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

interface ToggleLiteralPhraseBtnProps {
  visible: boolean;
  active?: boolean;
  action: Function;
  toggle: boolean;
}

export function ToggleLiteralPhraseBtn(props: ToggleLiteralPhraseBtnProps) {
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

interface FrequencyWordIconProps {
  visible: boolean;
}

export function FrequencyTermIcon(props: FrequencyWordIconProps) {
  return !props.visible ? null : (
    <div>
      <FontAwesomeIcon icon={faDice} />
    </div>
  );
}

FrequencyTermIcon.propTypes = {
  visible: PropTypes.bool,
};

interface TimePlayVerifyBtnsProps {
  visible: boolean;
  hover?: "pronunciation" | "incorrect" | "reset";
  onClick?: Function;
  onPronunciation?: Function;
  onIncorrect?: Function;
  onReset?: Function;
  prevMissPronu: boolean;
}

export function TimePlayVerifyBtns(props: TimePlayVerifyBtnsProps) {
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
              (props.hover !== "reset" && props.prevMissPronu),
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
