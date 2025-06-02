import classNames from "classnames";

export function NotReady(props: { addlStyle?: string; text?: string }) {
  const { addlStyle } = props;
  const additionalStyles = addlStyle === undefined ? {} : { [addlStyle]: true };
  const css = classNames({
    ...additionalStyles,
    "d-flex flex-column justify-content-around text-center h-100": true,
  });
  return (
    <div className={css}>
      <div>{props.text ?? "Awaiting data ..."}</div>
    </div>
  );
}
