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
  visible?: boolean;
  disabled?: boolean;
  /** Decrease opacity when marked reviewed (icon only) */
  reviewed?: boolean;
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
  const { disabled, visible, reviewed } = props;
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
      className={classNames({
        "sm-icon-grp clickable": true,
        "disabled-color": reviewed,
      })}
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

      {isReinforced === true ? (
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
  visible: boolean;
  disabled?: boolean;
  active: boolean;
  /** Decrease opacity when marked reviewed (icon only) */
  reviewed?: boolean;
  setShowHint: (showHintValue: boolean) => void;
}

export function ShowHintBtn(props: ShowHintBtnProps) {
  const { disabled, active, setShowHint, reviewed } = props;

  return props.visible === false ? null : (
    <div
      className={classNames({
        "sm-icon-grp": true,
        clickable: active,
        "disabled disabled-color": !active,
        "disabled-color": reviewed,
      })}
      onClick={
        active && disabled !== true
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
  visible: boolean;
  disabled?: boolean;
  active?: boolean;
  /** Decrease opacity when marked reviewed (icon only) */
  reviewed?: boolean;
  toggleAutoVerbView: () => void;
  autoVerbView: boolean;
}

export function ToggleAutoVerbViewBtn(props: ToggleAutoVerbViewBtnProps) {
  const { disabled, visible, toggleAutoVerbView, autoVerbView, reviewed } =
    props;

  return visible === false ? null : (
    <div
      className={classNames({
        "sm-icon-grp clickable": true,
        "disabled-color": reviewed,
      })}
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
  visible?: boolean;
  disabled?: boolean;
  /** Decrease opacity when marked reviewed (icon only) */
  reviewed?: boolean;
  active?: boolean;
  action: () => void;
}

export function ReCacheAudioBtn(props: ReCacheAudioBtnProps) {
  const { disabled, active, action, reviewed } = props;

  return props.visible === false ? null : (
    <div
      className={classNames({
        clickable: true,
        "sm-icon-grp": true,
        "disabled-color": reviewed,
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
        icon={active === true ? faPlayCircle : faRecycle}
        className={classNames({ "disabled-color": false })}
      />
      <span className="notification">
        <FontAwesomeIcon
          icon={active === true ? faRecycle : faPlayCircle}
          className={classNames({ "disabled-color": true })}
        />
      </span>
    </div>
  );
}

interface TogglePracticeSideBtnProps {
  visible?: boolean;
  disabled?: boolean;
  active?: boolean;
  /** Decrease opacity when marked reviewed (icon only) */
  reviewed?: boolean;
  action?: React.MouseEventHandler;
  toggle: boolean;
}

export function TogglePracticeSideBtn(props: TogglePracticeSideBtnProps) {
  const { disabled, visible, action, toggle, reviewed } = props;

  return visible === false ? null : (
    <div
      aria-label="Toggle practice side"
      className={classNames({ clickable: true, "disabled-color": reviewed })}
    >
      <FontAwesomeIcon
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
  visible: boolean;
  disabled?: boolean;
  active?: boolean;
  /** Decrease opacity when marked reviewed (icon only) */
  reviewed?: boolean;
  action: () => void;
  toggle: boolean;
}

export function ToggleLiteralPhraseBtn(props: ToggleLiteralPhraseBtnProps) {
  const { disabled, visible, action, toggle, reviewed } = props;

  return visible === false ? null : (
    <div
      className={classNames({
        clickable: true,
        "sm-icon-grp": true,
        "disabled-color": reviewed,
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
      <div className={classNames({ "dash-border-small rounded px-1": toggle })}>
        <div
          className={classNames({
            "disabled-color": toggle,
            "px-1": !toggle,
          })}
        >
          <ProjectIcon size="small" />
        </div>
      </div>
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
    <>
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
    </>
  );
}
