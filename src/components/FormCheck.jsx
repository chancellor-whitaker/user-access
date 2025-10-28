import { useId } from "react";

export default function FormCheck({
  type = "checkbox",
  inline = true,
  children,
  ...rest
}) {
  const id = useId();

  const className = ["form-check", inline && "form-check-inline"]
    .filter((el) => el)
    .join(" ");

  return (
    <div className={className}>
      <input className="form-check-input" type={type} id={id} {...rest} />
      <label className="form-check-label" htmlFor={id}>
        {children}
      </label>
    </div>
  );
}
