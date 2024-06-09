import { faPlayCircle } from "@fortawesome/free-regular-svg-icons";
import {
  faBan,
  faDice,
  faGlasses,
  faPencilAlt,
  faRecycle,
  faRunning,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  GiftIcon,
  PlusCircleIcon,
  ProjectIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import type { RawVocabulary } from "nmemonica";
import React, { memo, useEffect, useRef } from "react";

import { useForceRender } from "../../hooks/useFade";

interface MinimunRawItem {
  uid: string;
  english: string;
  grp?: string;
}

interface ToggleFuriganaBtnProps {
  disabled?: boolean;
  visible?: boolean;
  active: boolean;
  toggle: boolean;
  toggleFurigana: (uid: string) => void;
  vocabulary: RawVocabulary;
}

export function ToggleFuriganaBtn(props: ToggleFuriganaBtnProps) {
  const { disabled, visible, active, toggle, toggleFurigana, vocabulary } =
    props;

  return visible === false ? null : (
    <div
      className={classNames({
        clickable: active,
        "sm-icon-grp": true,
        "sm-kanji": active,
      })}
      onClick={
        active && disabled !== true
          ? () => toggleFurigana(vocabulary.uid)
          : undefined
      }
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

interface ToggleFrequencyTermBtnProps {
  disabled?: boolean;
  visible?: boolean;
  term: MinimunRawItem;
  /** Count of reinforced terms */
  count?: number;
  /** Is it **currently** being reinforced? */
  isReinforced?: boolean;
  /**
   * Has it been marked for reinforcement
   *
   * toggle between add/remove
   **/
  hasReinforce: boolean;
  addFrequencyTerm: (uid: string) => void;
  removeFrequencyTerm: (uid: string) => void;
}

export function ToggleFrequencyTermBtn(props: ToggleFrequencyTermBtnProps) {
  const { disabled, visible } = props;
  const prevCount = useRef(0);

  const {
    isReinforced,
    addFrequencyTerm,
    removeFrequencyTerm,
    hasReinforce,
    term,
    count = prevCount.current, // count is optional
  } = props;
  const forceRender = useForceRender();

  const fade = prevCount.current === count;

  useEffect(() => {
    prevCount.current = count;

    if (!fade) {
      // fade this time
      forceRender();
    }
  }, [count, fade, forceRender]);

  return visible === false ? null : (
    <div
      aria-label={hasReinforce ? "Remove term" : "Add term"}
      className="sm-icon-grp clickable"
      onClick={
        disabled !== true
          ? () => {
              if (hasReinforce) {
                removeFrequencyTerm(term.uid);
              } else {
                addFrequencyTerm(term.uid);
              }
            }
          : undefined
      }
    >
      {hasReinforce ? (
        <XCircleIcon size="small" />
      ) : (
        <PlusCircleIcon size="small" />
      )}

      {isReinforced ? (
        <span className="notification">
          <FontAwesomeIcon icon={faDice} />
        </span>
      ) : (
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

export const ToggleFrequencyTermBtnMemo = memo(ToggleFrequencyTermBtn);

interface ShowHintBtnProps {
  disabled?: boolean;
  visible?: boolean;
  active: boolean;
  setShowHint: (showHintValue: boolean) => void;
}

export function ShowHintBtn(props: ShowHintBtnProps) {
  const { disabled, active, setShowHint } = props;

  return !props.visible ? null : (
    <div
      className={classNames({
        "sm-icon-grp": true,
        clickable: active,
        "disabled disabled-color": !active,
      })}
      onClick={
        active && !disabled
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

interface ToggleAutoVerbViewBtnProps {
  disabled?: boolean;
  visible?: boolean;
  active?: boolean;
  toggleAutoVerbView: () => void;
  autoVerbView: boolean;
}

export function ToggleAutoVerbViewBtn(props: ToggleAutoVerbViewBtnProps) {
  const { disabled, visible, toggleAutoVerbView, autoVerbView } = props;

  return !visible ? null : (
    <div
      className="sm-icon-grp clickable"
      onClick={disabled !== true ? () => toggleAutoVerbView() : undefined}
      aria-label="Toggle auto verb view"
    >
      <FontAwesomeIcon icon={!autoVerbView ? faRunning : faBan} />
      <span className="notification">
        <FontAwesomeIcon icon={!autoVerbView ? faBan : faRunning} />
      </span>
    </div>
  );
}

interface ReCacheAudioBtnProps {
  disabled?: boolean;
  visible?: boolean;
  active?: boolean;
  action: () => void;
}

export function ReCacheAudioBtn(props: ReCacheAudioBtnProps) {
  const { disabled, active, action } = props;

  return props.visible === false ? null : (
    <div
      className={classNames({
        clickable: true,
        "sm-icon-grp": true,
      })}
      onClick={
        disabled !== true
          ? () => {
              if (typeof action === "function") {
                action();
              }
            }
          : undefined
      }
      aria-label="Override audio"
    >
      <FontAwesomeIcon
        icon={active ? faPlayCircle : faRecycle}
        className={classNames({ "disabled-color": false })}
      />
      <span className="notification">
        <FontAwesomeIcon
          icon={active ? faRecycle : faPlayCircle}
          className={classNames({ "disabled-color": true })}
        />
      </span>
    </div>
  );
}

interface TogglePracticeSideBtnProps {
  disabled?: boolean;
  visible?: boolean;
  active?: boolean;
  action?: React.MouseEventHandler;
  toggle: boolean;
}

export function TogglePracticeSideBtn(props: TogglePracticeSideBtnProps) {
  const { disabled, visible, action, toggle } = props;

  return visible === false ? null : (
    <div aria-label="Toggle practice side">
      <FontAwesomeIcon
        className="clickable"
        onClick={disabled !== true ? action : undefined}
        icon={toggle ? faGlasses : faPencilAlt}
      />
      <span className="notification">
        <FontAwesomeIcon icon={!toggle ? faGlasses : faPencilAlt} />
      </span>
    </div>
  );
}

interface ToggleLiteralPhraseBtnProps {
  disabled?: boolean;
  visible: boolean;
  active?: boolean;
  action: () => void;
  toggle: boolean;
}

export function ToggleLiteralPhraseBtn(props: ToggleLiteralPhraseBtnProps) {
  const { disabled, visible, action, toggle } = props;

  return !visible ? null : (
    <div
      className={classNames({
        clickable: true,
        "sm-icon-grp": true,
        "info-color": toggle,
      })}
      onClick={
        disabled !== true
          ? () => {
              if (typeof action === "function") {
                action();
              }
            }
          : undefined
      }
      aria-label="Literal english translation"
    >
      <ProjectIcon size="small" />
    </div>
  );
}

interface TimePlayVerifyBtnsProps {
  visible: boolean;
  hover?: "pronunciation" | "incorrect" | "reset";
  onClick?: () => void;
  onPronunciation?: () => void;
  onIncorrect?: () => void;
  onReset?: () => void;
  prevMissPronu: boolean;
}

export function TimePlayVerifyBtns(props: TimePlayVerifyBtnsProps) {
  return !props.visible ? null : (
    <React.Fragment>
      <div
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
            underline: props.hover === "incorrect",
          })}
        >
          {"-1"}
        </span>
      </div>
      <div
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
            underline:
              props.hover === "pronunciation" ||
              (props.hover !== "reset" && props.prevMissPronu),
          })}
        >
          {"P"}
        </span>
      </div>
      <div
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
            underline: props.hover === "reset",
          })}
        >
          0
        </span>
      </div>
    </React.Fragment>
  );
}
