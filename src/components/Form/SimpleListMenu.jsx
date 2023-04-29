import { IconButton, ListItemButton } from "@mui/material";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { KebabHorizontalIcon } from "@primer/octicons-react";
import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useMemo, useState } from "react";

/**
 * @typedef {Object} SimpleListMenuProps
 * @property {boolean} [disabled] whether menu is interdisabled
 * @property {boolean} [flip] whether elipsis and options are horizontally reversed
 * @property {string} title
 * @property {string[]} options
 * @property {number} initial
 * @property {(index: number)=>void} onChange
 */

/**
 * @param {SimpleListMenuProps} props
 */
export default function SimpleListMenu(props) {
  const [anchorEl, setAnchorEl] = useState(
    /** @type {null | HTMLElement} */ null
  );
  const [selectedIndex, setSelectedIndex] = useState(props.initial);

  const options = useMemo(() => props.options, []);

  useMemo(() => {
    setSelectedIndex(props.initial);
  }, [props.initial]);

  const open = Boolean(anchorEl);
  const handleClickListItem = (
    /** @type {React.MouseEvent<HTMLElement>} */ event
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (
    /** @type {React.MouseEvent<HTMLElement>} */ event,
    /** @type {number} */ index
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
            onClick={(event) => handleMenuItemClick(event, index)}
          >
            {option}
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
