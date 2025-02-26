import {
  Dialog,
  DialogContent,
  FormControl,
  FormHelperText,
} from "@mui/material";
import { DeviceCameraVideoIcon } from "@primer/octicons-react";
import classNames from "classnames";
import { useEffect, useState } from "react";

interface VideoDevicesMenuProps {
  visible?: boolean;
  getDevices: () => Promise<MediaDeviceInfo[]>;
  // devices: MediaDeviceInfo[];
  activeDevice: string | null;
  selectDeviceHandler: (id: string) => void;
  closeHandler: () => void;
}

export function VideoDevicesMenu(props: VideoDevicesMenuProps) {
  const {
    visible,
    closeHandler,
    getDevices,
    activeDevice,
    selectDeviceHandler,
  } = props;

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (visible === true && devices.length === 0) {
      void getDevices().then((d) => setDevices(d));
    }
  }, [visible, devices.length, getDevices]);

  return (
    <Dialog
      open={visible === true}
      onClose={closeHandler}
      aria-label="Message encryption key input"
    >
      <DialogContent className="p-2 m-0">
        <FormControl className="mt-2 w-100">
          <div>
            {devices.map((device) => (
              <div
                className="d-flex"
                key={JSON.stringify(device)}
                onClick={() => {
                  selectDeviceHandler(device.deviceId);
                  setTimeout(closeHandler, 750);
                }}
              >
                <div className="p-3">
                  {device.deviceId === activeDevice ? (
                    <DeviceCameraVideoIcon />
                  ) : null}
                </div>
                <div
                  className={classNames({
                    "d-flex flex-column pb-3 clickable p-2": true,
                    "fw-bold": device.deviceId === activeDevice,
                  })}
                >
                  <span className="fs-xx-small">{`id: ${device.deviceId.slice(0, 6)}...`}</span>
                  <span className="fs-xx-small">{`kind: ${device.kind}`}</span>
                  <span className="fs-xx-small">{`lbl: ${device.label}`}</span>
                </div>
              </div>
            ))}
          </div>
          <FormHelperText>
            <span>Video Input Devices</span>
          </FormHelperText>
        </FormControl>
      </DialogContent>
    </Dialog>
  );
}
