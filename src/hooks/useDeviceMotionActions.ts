import { useCallback } from "react";

import {
  getDeviceMotionEventPermission,
  motionThresholdCondition,
} from "../helper/gameHelper";

/**
 * Attaches devicemotion action to component
 *
 * expects an onShakeEventHandler
 */
export function useDeviceMotionActions(motionThreshold: number) {
  /**
   * Returns object with two functions
   *
   * addDeviceMotionEvent and removeDeviceMotionEvent
   * @param onShakeEventHandler function to call on shake event
   */
  const deviceMotionEvent = useCallback(
    (onShakeEventHandler: (value: number) => void) => {
      const motionListener = (event: DeviceMotionEvent) => {
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
    },
    [motionThreshold]
  );

  return deviceMotionEvent;
}
