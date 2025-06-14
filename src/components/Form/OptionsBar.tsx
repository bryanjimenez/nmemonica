import { faPlayCircle } from "@fortawesome/free-regular-svg-icons";
import {
  faBan,
  faCircleNotch,
  faGlasses,
  faPencilAlt,
  faRecycle,
  faRunning,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  GiftIcon,
  MilestoneIcon,
  ProjectIcon,
  PulseIcon,
  TagIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import type { RawVocabulary } from "nmemonica";
import React from "react";

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
      onClick={(ev: React.MouseEvent<HTMLDivElement>) => {
        ev.preventDefault();

        if (active && disabled !== true) {
          toggleFurigana(vocabulary.uid);
        }
      }}
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

interface TagTermBtnProps {
  visible?: boolean;
  disabled?: boolean;
  /** Decrease opacity when marked reviewed (icon only) */
  reviewed?: boolean;
  action: () => void;
}

export function ApplyTagsBtn(props: TagTermBtnProps) {
  const { disabled, visible, action, reviewed } = props;

  return visible === false ? null : (
    <div
      className={classNames({
        "clickable sm-icon-grp": true,
        "disabled disabled-color": disabled === true,
        "disabled-color": reviewed,
      })}
      onClick={disabled !== true ? () => action() : undefined}
    >
      <TagIcon />
    </div>
  );
}

interface PronunciationWarningBtnProps {
  visible: boolean;
  disabled?: boolean;
  /** Decrease opacity when marked reviewed (icon only) */
  reviewed?: boolean;
}

export function PronunciationWarningBtn(props: PronunciationWarningBtnProps) {
  const { disabled, visible, reviewed } = props;

  return visible === false ? null : (
    <div
      className={classNames({
        "disabled disabled-color": disabled === true,
        "disabled-color": reviewed,
      })}
    >
      <PulseIcon />
      <span className="notification">!</span>
    </div>
  );
}

interface ViewLessonsBtnProps {
  visible: boolean;
  disabled?: boolean;
  /** Decrease opacity when marked reviewed (icon only) */
  reviewed?: boolean;
  action: () => void;
}

export function ViewLessonsBtn(props: ViewLessonsBtnProps) {
  const { disabled, visible, reviewed, action } = props;

  return visible === false ? null : (
    <div
      className={classNames({
        "sm-icon-grp clickable": true,
        "disabled disabled-color": disabled === true,
        "disabled-color": reviewed,
      })}
      aria-label="Show lesson"
      onClick={disabled !== true ? () => action() : undefined}
    >
      <MilestoneIcon />
    </div>
  );
}

interface AudioLoadingIconProps {
  visible?: boolean;
  notification?: string;
}

export function AudioLoadingIcon(props: AudioLoadingIconProps) {
  const { visible, notification } = props;
  return visible !== true ? null : (
    <div
      className={classNames({
        "sm-icon-grp": true,
        "disabled-color": true,
      })}
      aria-label="Loading audio"
    >
      <FontAwesomeIcon
        icon={faCircleNotch}
        className={classNames({ "spin-a-bit": true })}
      />
      {notification !== undefined && (
        <span className="notification">{notification}</span>
      )}
    </div>
  );
}
