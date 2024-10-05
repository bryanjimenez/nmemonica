/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Kiran Abburi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// https://github.com/akiran/react-slick
export const TouchSwipeIgnoreCss = "slick-swipe-ignore";

export interface Spec {
  verticalSwiping?: boolean;
  touchThreshold: number;
  scrolling?: boolean;
  swiped?: boolean;
  swiping?: boolean;
  onSwipe?: Function;
  swipeEvent?: Function;
  touchObject: TouchObject;
}

interface TouchObject {
  swipeLength: number;
  curX: number;
  curY: number;
  startX: number;
  startY: number;
}

function safePreventDefault(event: TouchEvent | MouseEvent) {
  const passiveEvents = ["onTouchStart", "onTouchMove", "onWheel"];

  if (
    "_reactName" in event &&
    typeof event._reactName === "string" &&
    !passiveEvents.includes(event._reactName)
  ) {
    event.preventDefault();
  }
}

export function getSwipeDirection(
  touchObject: TouchObject,
  verticalSwiping = false
) {
  let xDist, yDist, r, swipeAngle;
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

export function swipeStart(
  e: TouchEvent | MouseEvent,
  { verticalSwiping, touchThreshold } = {
    verticalSwiping: false,
    touchThreshold: 5,
  }
): Spec {
  (e.target as HTMLElement).tagName === "IMG" && safePreventDefault(e);

  return {
    verticalSwiping,
    touchThreshold,
    touchObject: {
      swipeLength: 0,
      startX: "touches" in e ? e.touches[0].pageX : e.clientX,
      startY: "touches" in e ? e.touches[0].pageY : e.clientY,
      curX: "touches" in e ? e.touches[0].pageX : e.clientX,
      curY: "touches" in e ? e.touches[0].pageY : e.clientY,
    },
  };
}

export function swipeMove(e: TouchEvent | MouseEvent, spec: Spec): Spec {
  const {verticalSwiping,touchThreshold,swiped, swiping, touchObject, swipeEvent} = spec;

  touchObject.curX = "touches" in e ? e.touches[0].pageX : e.clientX;
  touchObject.curY = "touches" in e ? e.touches[0].pageY : e.clientY;
  touchObject.swipeLength = Math.abs(touchObject.curX - touchObject.startX);
  const verticalSwipeLength = Math.abs(touchObject.curY - touchObject.startY);

  if (!verticalSwiping && !swiping && verticalSwipeLength > 10) {
    return {
      touchObject,
      touchThreshold,
      scrolling: true,
    };
  }

  if (verticalSwiping) {
    touchObject.swipeLength = Math.sqrt(
      Math.pow(verticalSwipeLength, 2) + Math.pow(touchObject.swipeLength, 2)
    );
  }

  const swipeDirection = getSwipeDirection(spec.touchObject, verticalSwiping);

  let state = {
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

export function swipeEnd(e: TouchEvent, spec: Spec) {
  let {touchObject, touchThreshold, verticalSwiping, onSwipe } = spec;

  const minSwipe = touchThreshold;

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
 */
export function isSwipeIgnored(e: TouchEvent) {
  const tEl = e.target as Element;
  const targetSwipeIgnore = Array.from(
    document.getElementsByClassName(TouchSwipeIgnoreCss)
  ).some((el) => el.contains(tEl));

  return targetSwipeIgnore;
}
