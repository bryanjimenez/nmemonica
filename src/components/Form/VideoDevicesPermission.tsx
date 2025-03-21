import {
  Button,
  Dialog,
  DialogContent,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { DeviceCameraVideoIcon } from "@primer/octicons-react";
import classNames from "classnames";
import { useEffect, useState } from "react";

interface VideoDevicesPermissionProps {
  visible: boolean;
  getDevices: () => Promise<MediaDeviceInfo[]>;
  activeDevice: string | null;
  accept: (id: string) => void;
  decline: () => void;
}

export function VideoDevicesPermission(props: VideoDevicesPermissionProps) {
  const { visible, getDevices, activeDevice, accept, decline } = props;

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (visible === true && devices.length === 0) {
      void getDevices().then((d) => setDevices(d));
    }
    if (visible === false) {
      setSelectedId(null);
    }
  }, [visible, activeDevice, devices.length, getDevices]);

  return (
    <Dialog
      open={visible === true}
      onClose={decline}
      aria-label="Video Device Permission Request"
    >
      <DialogContent className="p-0 m-0">
        <div className="d-flex flex-column p-2">
          <div className="p-2">
            <p>Requesting permission to:</p>
            <p>
              use your <span className="fw-bold">video capture device</span>.
            </p>
          </div>

          <FormControl>
            <RadioGroup>
              {devices.length === 0 && (
                <div className="p-2 fs-x-small text-center">
                  loading devices...
                </div>
              )}
              {devices.map((device) => (
                <div key={JSON.stringify(device)}>
                  <FormControlLabel
                    className="m-0"
                    value="Accept Cookies"
                    control={
                      <Radio
                        size="small"
                        checked={device.deviceId === selectedId}
                        onChange={() => {
                          setSelectedId(device.deviceId);
                        }}
                      />
                    }
                    label={
                      <div
                        className="d-flex"
                        onClick={() => {
                          setSelectedId(device.deviceId);
                        }}
                      >
                        <div
                          className={classNames({
                            "d-flex flex-column pb-3 clickable p-2": true,
                            "fw-bold": device.deviceId === activeDevice,
                          })}
                        >
                          <span className="fs-xx-small">{`id: ...${device.deviceId.slice(-6)}`}</span>
                          {/* <span className="fs-xx-small">{`kind: ${device.kind}`}</span> */}
                          <span className="fs-xx-small">{`lbl: ${device.label}`}</span>
                        </div>
                        <div
                          className={classNames({
                            "p-2": true,
                            "opacity-50": device.deviceId !== selectedId,
                            "incorrect-color": device.deviceId === activeDevice,
                          })}
                        >
                          <DeviceCameraVideoIcon className="mirror-x" />
                        </div>
                      </div>
                    }
                  />
                </div>
              ))}
            </RadioGroup>
          </FormControl>

          <div className="d-flex justify-content-around pt-1">
            <Button
              variant="outlined"
              size="small"
              color="error"
              className="p-0 m-1"
              style={{ textTransform: "none" }}
              onClick={decline}
            >
              Decline
            </Button>

            <Button
              variant="outlined"
              size="small"
              color="success"
              className="p-0 m-1"
              style={{ textTransform: "none" }}
              disabled={selectedId === null}
              onClick={() => {
                if (selectedId !== null) {
                  accept(selectedId);
                }
              }}
            >
              Accept
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
