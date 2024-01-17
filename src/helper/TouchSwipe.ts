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
  var passiveEvents = ["onTouchStart", "onTouchMove", "onWheel"];

  // @ts-expect-error _reactName
  if (!passiveEvents.includes(event._reactName)) {
    event.preventDefault();
  }
}

export function getSwipeDirection(
  touchObject: TouchObject,
  verticalSwiping = false
) {
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

export function swipeStart(
  e: TouchEvent | MouseEvent,
  { verticalSwiping, touchThreshold } = {
    verticalSwiping: false,
    touchThreshold: 5,
  }
) {
  (e.target as HTMLElement).tagName === "IMG" && safePreventDefault(e);

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

export function swipeMove(e: TouchEvent | MouseEvent, spec: Spec): Spec {
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
      // TODO: added
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

export function swipeEnd(e: TouchEvent, spec: Spec) {
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
 */
export function isSwipeIgnored(e: TouchEvent) {
  const tEl = e.target as Element;
  const targetSwipeIgnore = Array.from(
    document.getElementsByClassName(TouchSwipeIgnoreCss)
  ).some((el) => el.contains(tEl));

  return targetSwipeIgnore;
}
