"use strict";
// https://github.com/akiran/react-slick

export const TouchSwipeIgnoreCss = "slick-swipe-ignore";

/**
 * @typedef {Object} Spec
 * @property {boolean} verticalSwiping
 * @property {number} touchThreshold
 * @property {boolean} scrolling
 * @property {boolean} swiped
 * @property {boolean} swiping
 * @property {function} onSwipe
 * @property {function} swipeEvent
 * @property {TouchObject} touchObject
 */

/**
 * @typedef {Object} TouchObject
 * @property {number} swipeLength
 * @property {number} curX
 * @property {number} curY
 * @property {number} startX
 * @property {number} startY
 */

/**
 * @param {import("react").TouchEvent | MouseEvent} event
 */
function safePreventDefault(event) {
  var passiveEvents = ["onTouchStart", "onTouchMove", "onWheel"];

  // @ts-expect-error _reactName
  if (!passiveEvents.includes(event._reactName)) {
    event.preventDefault();
  }
}

/**
 * @param {TouchObject} touchObject
 */
export function getSwipeDirection(touchObject, verticalSwiping = false) {
  var xDist, yDist, r, swipeAngle;
  xDist = touchObject.startX - touchObject.curX;
  yDist = touchObject.startY - touchObject.curY;
  r = Math.atan2(yDist, xDist);
  swipeAngle = Math.round((r * 180) / Math.PI);

  if (swipeAngle < 0) {
    swipeAngle = 360 - Math.abs(swipeAngle);
  }

  if (
    (swipeAngle <= 45 && swipeAngle >= 0) ||
    (swipeAngle <= 360 && swipeAngle >= 315)
  ) {
    return "left";
  }

  if (swipeAngle >= 135 && swipeAngle <= 225) {
    return "right";
  }

  if (verticalSwiping === true) {
    if (swipeAngle >= 35 && swipeAngle <= 135) {
      return "up";
    } else {
      return "down";
    }
  } else {
    return "vertical";
  }
}

/**
 * @param {import("react").TouchEvent | MouseEvent} e
 * @param {{verticalSwiping?:boolean, touchThreshold?:number}} spec
 */
export function swipeStart(
  e,
  { verticalSwiping, touchThreshold } = {
    verticalSwiping: false,
    touchThreshold: 5,
  }
) {
  /** @type {HTMLElement} */ (e.target).tagName === "IMG" &&
    safePreventDefault(e);

  return {
    verticalSwiping,
    touchThreshold,
    touchObject: {
      startX: "touches" in e ? e.touches[0].pageX : e.clientX,
      startY: "touches" in e ? e.touches[0].pageY : e.clientY,
      curX: "touches" in e ? e.touches[0].pageX : e.clientX,
      curY: "touches" in e ? e.touches[0].pageY : e.clientY,
    },
  };
}

/**
 * @param {import("react").TouchEvent | MouseEvent} e
 * @param {Spec} spec
 */
export function swipeMove(e, spec) {
  var verticalSwiping = spec.verticalSwiping,
    touchThreshold = spec.touchThreshold,
    swiped = spec.swiped,
    swiping = spec.swiping,
    touchObject = spec.touchObject,
    swipeEvent = spec.swipeEvent;

  touchObject.curX = "touches" in e ? e.touches[0].pageX : e.clientX;
  touchObject.curY = "touches" in e ? e.touches[0].pageY : e.clientY;
  touchObject.swipeLength = Math.abs(touchObject.curX - touchObject.startX);
  var verticalSwipeLength = Math.abs(touchObject.curY - touchObject.startY);

  if (!verticalSwiping && !swiping && verticalSwipeLength > 10) {
    return {
      scrolling: true,
    };
  }

  if (verticalSwiping) {
    touchObject.swipeLength = Math.sqrt(
      Math.pow(verticalSwipeLength, 2) + Math.pow(touchObject.swipeLength, 2)
    );
  }

  var swipeDirection = getSwipeDirection(spec.touchObject, verticalSwiping);

  var state = {
    touchObject,
    verticalSwiping,
    touchThreshold,
    swiped: false,
    swiping: false,
  };
  if (!swiped && swipeEvent) {
    swipeEvent(swipeDirection);
    state = { ...state, swiped: true };
  }

  if (touchObject.swipeLength > 10) {
    state = { ...state, swiping: true };
    safePreventDefault(e);
  }

  return state;
}

/**
 * @param {import("react").TouchEvent} e
 * @param {Spec} spec
 */
export function swipeEnd(e, spec) {
  var touchObject = spec.touchObject,
    touchThreshold = spec.touchThreshold,
    verticalSwiping = spec.verticalSwiping,
    onSwipe = spec.onSwipe;

  var minSwipe = touchThreshold;

  let swipeDirection;
  if (touchObject.swipeLength) {
    swipeDirection = getSwipeDirection(touchObject, verticalSwiping);
  }

  if (touchObject.swipeLength > minSwipe) {
    safePreventDefault(e);

    if (onSwipe) {
      onSwipe(swipeDirection);
    }
  }

  const state = {
    swipeDirection,
    ...spec,
  };

  return state;
}

/**
 * Test if touch event originates from
 * swipe-ignore element
 * @param {import("react").TouchEvent} e
 */
export function isSwipeIgnored(e) {
  const tEl = /** @type {Element} */ (e.target);
  const targetSwipeIgnore = Array.from(
    document.getElementsByClassName(TouchSwipeIgnoreCss)
  ).some((el) => el.contains(tEl));

  return targetSwipeIgnore;
}
