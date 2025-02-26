import { BrowserQRCodeReader, BrowserQRCodeSvgWriter } from "@zxing/browser";
import classNames from "classnames";
import { useCallback, useMemo, useRef, useState } from "react";

import { DebugLevel } from "../helper/consoleHelper";
import { ValuesOf } from "../typings/utils";

interface QRCodeProps {
  w: number;
  h: number;
  loggerCB?: (msg: string, lvl?: ValuesOf<typeof DebugLevel>) => void;
}

/**
 * Hook for WebRTC Signaling (no service)
 */
export function useQRCode(props: QRCodeProps) {
  const { w = 200, h = 200 } = props;
  const active = useRef<MediaStream>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const [decoded, setDecoded] = useState(false);

  const encode = useCallback(
    (text: string) => {
      const qrw = new BrowserQRCodeSvgWriter();

      const output = qrw.write(text, w, h, new Map([]));

      return (
        <svg height={h} width={w} viewBox={`0 0 ${h} ${w}`}>
          {Array.from(output.children).map((el) => (
            <rect
              key={`${el.getAttribute("x")},${el.getAttribute("y")},${el.getAttribute("fill")}`}
              x={el.getAttribute("x") ?? undefined}
              y={el.getAttribute("y") ?? undefined}
              width={el.getAttribute("width") ?? undefined}
              height={el.getAttribute("height") ?? undefined}
              fill={el.getAttribute("fill") ?? undefined}
            />
          ))}
        </svg>
      );
    },
    [w, h]
  );

  const stopCapture = useCallback(() => {
    const { current: activeDevice } = active;
    if (activeDevice !== null) {
      activeDevice.getTracks().forEach((track) => {
        track.stop();
      });

      active.current = null;
      setDecoded(false);
    }
  }, []);

  const selectDevice = useCallback(
    (deviceId: string) => {
      stopCapture();

      return navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: { deviceId: { exact: deviceId } },
        })
        .then((device) => {
          if (video.current !== null) {
            video.current.srcObject = new MediaStream(device.getTracks());
            void video.current.play();
            active.current = device;

            setAspectRatio(
              device.getVideoTracks()[0].getSettings().aspectRatio ?? 1
            );
            return true;
          }
          throw new Error("Could not select device");
        });
    },
    [stopCapture]
  );

  const decode = useCallback(() => {
    if (
      video.current === null ||
      canvas.current === null ||
      active.current === null
    ) {
      throw new Error("Expected elements not ready");
    }

    clearCanvas(canvas.current);
    // TODO: get orientation
    const image = takeImage(canvas.current, video.current, true, aspectRatio);

    const qrr = new BrowserQRCodeReader();

    return qrr
      .decodeFromImageUrl(image)
      .then((res) => {
        const { text, format } = res as unknown as {
          text: string;
          format: number;
        };
        if (format !== 11) {
          throw new Error("Unexpected QR format");
        }

        // TODO: validate text
        return text;
      })
      .then((text) => {
        setDecoded(true);

        return text;
      });
  }, [aspectRatio]);

  const view = useMemo(
    () => (
      <div className="d-flex">
        <canvas
          ref={canvas}
          className={classNames({ "w-0": !decoded })}
          width={w}
          height={h}
        />
        <video
          ref={video}
          className={classNames({ "w-0": decoded })}
          width={w}
          height={h}
        />
      </div>
    ),
    [decoded, w, h]
  );

  const getDevices = useCallback(() => {
    return getMediaPermission().then(() =>
      navigator.mediaDevices
        .enumerateDevices()
        .then((info) => info.filter((i) => i.kind === "videoinput"))
    );
  }, []);

  return {
    encode,

    getDevices,
    selectDevice,
    decode,

    view,

    stopCapture,
  };
}

async function getMediaPermission() {
  // get permission

  try {
    // works in chrome only
    const { state } = await navigator.permissions
      .query({ name: "camera" });

    if (state !== "granted") {
      return navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: true,
        })
        .then(() => {});
    }

    return Promise.resolve(/** already granted */);
  } catch {
    // permission query not supported

    return navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: true,
      })
      .then(() => {});
    // return Promise.reject(err)
  }
}

function clearCanvas(canvas: HTMLCanvasElement) {
  const { width, height } = canvas;
  const context = canvas.getContext("2d");
  if (context !== null) {
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, width, height);
  }
}

function takeImage(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landscape: boolean,
  aspectRatio: number
) {
  const { height: h, width: w } = video;

  const context = canvas.getContext("2d");
  context?.drawImage(video, 0, 0, w, h * (1 / (landscape ? aspectRatio : 1)));
  const image = canvas.toDataURL("image/png");

  return image;
}
