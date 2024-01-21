import classNames from "classnames";
import PropTypes from "prop-types";

interface PlusMinusProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function PlusMinus(props: PlusMinusProps) {
  const { label, value } = props;

  return (
    <div
      className={classNames({
        "mb-3 d-flex flex-row justify-content-end": true,
      })}
    >
      <div>{label}</div>
      <div
        className="clickable px-2"
        onClick={() => {
          props.onChange(value - 1);
        }}
      >
        -
      </div>
      <div
        className={classNames({
          "px-2": true,
        })}
      >
        {value}
      </div>
      <div
        className="clickable px-2"
        onClick={() => {
          props.onChange(value + 1);
        }}
      >
        +
      </div>
    </div>
  );
}

PlusMinus.propTypes = {
  value: PropTypes.number,
};
