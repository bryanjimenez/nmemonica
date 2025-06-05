import { Dialog, DialogContent } from "@mui/material";
import { RawVocabulary } from "nmemonica";
import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { AppDispatch } from "../../slices";
import SettingsSwitch from "../Input/SettingsSwitch";

interface TagEditMenuProps {
  visible: boolean;
  close: () => void;
  get: () => Promise<string[]>;
  toggle: (tag: string) => Promise<void>;
  term: RawVocabulary;
  title?: ReactElement;
  tags: string[];
}

export function TagEditMenu(props: TagEditMenuProps) {
  const { visible, close, tags, term, title, get, toggle } = props;
  const dispatch = useDispatch<AppDispatch>();

  const [activeTags, setActiveTags] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      void get().then((tags) => {
        setActiveTags(tags);
      });
    }
  }, [dispatch, get, visible, term.japanese]);

  const toggleCB = useCallback(
    (tag: string) => () => {
      const lCaseTag = tag.toLowerCase();

      void toggle(lCaseTag).then(() => {
        setActiveTags((p) =>
          p.includes(lCaseTag)
            ? p.filter((t) => t !== lCaseTag)
            : [...p, lCaseTag]
        );
      });
    },
    [toggle]
  );

  const tagElToggles = useMemo(
    () =>
      tags.map((tag) => (
        <div key={tag} className="d-flex justify-content-between">
          <div className="mt-2 me-4">{tag}</div>
          <div>
            <SettingsSwitch
              active={activeTags.includes(tag.toLowerCase())}
              action={toggleCB(tag)}
              statusText={""}
            />
          </div>
        </div>
      )),
    [tags, activeTags, toggleCB]
  );

  return (
    <Dialog open={visible} onClose={close} aria-label={"Tag edit menu"}>
      <DialogContent className="py-2">
        <div className="d-flex flex-column">
          {title}
          {tagElToggles}
        </div>
      </DialogContent>
    </Dialog>
  );
}
