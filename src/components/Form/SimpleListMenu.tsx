import {
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { KebabHorizontalIcon } from "@primer/octicons-react";
import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useEffect, useRef, useState } from "react";

interface SimpleListMenuProps {
  disabled?: boolean; //whether menu is interdisabled
  flip?: boolean; //whether elipsis and options are horizontally reversed
  title: string;
  options: string[];
  allowed?: number[];
  initial: number;
  onChange: (index: number) => void;
}

export default function SimpleListMenu(props: SimpleListMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(props.initial);

  const optionsRef = useRef(props.options);
  const allowedRef = useRef(props.allowed ?? props.options.map((o, i) => i));
  const options = optionsRef.current;
  const allowed = allowedRef.current;

  useEffect(() => {
    setSelectedIndex(props.initial);
  }, [props.initial]);

  const open = Boolean(anchorEl);
  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLElement>,
    index: number
  ) => {
    setSelectedIndex(index);
    setAnchorEl(null);
    props.onChange(index);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div
      className={classNames({
        clickable: props.disabled !== true,
        "d-flex": true,
        "flex-row-reverse": props.flip === true ? true : undefined,
        "justify-content-end": true,
      })}
    >
      <List component="nav" disablePadding={true}>
        <ListItemButton
          disableGutters={true}
          disabled={props.disabled === true}
          id="filter-button"
          aria-haspopup="listbox"
          aria-controls="filter-menu"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClickListItem}
        >
          <ListItemText
            primary={props.title}
            secondary={options[selectedIndex]}
            secondaryTypographyProps={{ color: "unset" }}
          />
        </ListItemButton>
      </List>
      <Menu
        id="filter-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "filter-button",
          role: "listbox",
        }}
      >
        {options.map((option, index) => (
          <MenuItem
            key={option}
            // disabled={index === 0}
            selected={index === selectedIndex}
            onClick={(event) => {
              if (allowed.includes(index)) handleMenuItemClick(event, index);
            }}
          >
            {allowed.includes(index) ? (
              option
            ) : (
              <span className="disabled-color">{option}</span>
            )}
          </MenuItem>
        ))}
      </Menu>

      <IconButton
        aria-labelledby="filter-button"
        sx={{ color: "unset", minWidth: "55px" }}
        aria-haspopup="listbox"
        disabled={props.disabled === true}
        onClick={handleClickListItem}
      >
        <KebabHorizontalIcon
          size="medium"
          className={classNames({
            "rotate-transition": true,
            "rotate-90": open,
          })}
        />
      </IconButton>
    </div>
  );
}

SimpleListMenu.propTypes = {
  disabled: PropTypes.bool,
  flip: PropTypes.bool,
  title: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.string),
  initial: PropTypes.number,
  onChange: PropTypes.func,
};
