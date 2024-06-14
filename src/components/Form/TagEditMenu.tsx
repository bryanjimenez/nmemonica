import { Dialog, DialogContent } from "@mui/material";

import SettingsSwitch from "./SettingsSwitch";

interface TagEditMenuProps {
  visible?: boolean;
  close: () => void;
  tags: { name: string; active: boolean; toggle: () => void }[];
}

export function TagEditMenu(props: TagEditMenuProps) {
  const { visible, close, tags } = props;

  return (
    <Dialog
      open={visible === true}
      onClose={close}
      aria-label={"Tag edit menu"}
    >
      <DialogContent className="py-2">
        <div>Tags</div>
        <div className="d-flex flex-column">
          {tags.map((el) => (
            <div key={el.name} className="d-flex justify-content-between">
              <div className="mt-2 me-4">{el.name}</div>
              <div>
                <SettingsSwitch
                  active={el.active}
                  action={el.toggle}
                  statusText={""}
                />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
