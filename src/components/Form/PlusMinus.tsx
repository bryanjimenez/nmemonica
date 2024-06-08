import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import PropTypes from "prop-types";

interface PlusMinusProps {
  children?: React.JSX.Element | React.JSX.Element[];
  label?: string;
  value: number | undefined;
  multiplier?: number;
  onChange: (value?: number) => void;
}

const infinity = String.fromCharCode(parseInt("0x221e", 16));

export default function PlusMinus(props: PlusMinusProps) {
  const { label = null, value, multiplier = 1, children = null } = props;

  return (
    <div
      className={classNames({
        "d-flex flex-row justify-content-end": true,
      })}
    >
      <div className="d-flex flex-column justify-content-center">
        <div>{label}</div>
        {children}
      </div>
      <div className="d-flex flex-column">
        <div
          className="clickable px-3 text-center"
          onClick={() => {
            props.onChange(
              value !== undefined ? value + Number(multiplier) : 0
            );
          }}
        >
          <FontAwesomeIcon icon={faChevronUp} />
        </div>
        <div
          className={classNames({
            "text-center px-2": true,
          })}
        >
          {value ?? infinity}
        </div>
        <div
          className="clickable px-3 text-center"
          onClick={() => {
            props.onChange(
              value !== undefined ? Math.max(0, value - Number(multiplier)) : 0
            );
          }}
        >
          <FontAwesomeIcon icon={faChevronDown} />
        </div>
      </div>
      {/* <div onClick={()=>{
          console.log("max")
      }}>
        max/min
      </div> */}
    </div>
  );
}

PlusMinus.propTypes = {
  value: PropTypes.number,
};
