import {
  getDeviceMotionEventPermission,
  motionThresholdCondition,
} from "../helper/gameHelper";

/**
 * Attaches devicemotion action to component
 *
 * expects an onShakeEventHandler
 * @param {number} motionThreshold
 */
export function useDeviceMotionActions(motionThreshold) {
  /**
   * Returns object with two functions
   *
   * addDeviceMotionEvent and removeDeviceMotionEvent
   * @param {(value: number) => void} onShakeEventHandler function to call on shake event
   */
  function deviceMotionEvent(onShakeEventHandler) {
    const motionListener = (/** @type {DeviceMotionEvent} */ event) => {
      try {
        motionThresholdCondition(event, motionThreshold, onShakeEventHandler);
      } catch (error) {
        if (error instanceof Error) {
          // FIXME: componentDidCatch(error);
        }
      }
    };

    function addDeviceMotionEvent() {
      if (motionThreshold > 0) {
        getDeviceMotionEventPermission(
          () => {
            window.addEventListener("devicemotion", motionListener);
          },
          // FIXME: componentDidCatch
          () => {}
        );
      }
    }

    function removeDeviceMotionEvent() {
      if (motionThreshold > 0) {
        window.removeEventListener("devicemotion", motionListener);
      }
    }

    return { addDeviceMotionEvent, removeDeviceMotionEvent };
  }

  return deviceMotionEvent;
}
