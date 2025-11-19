import { useId } from "react";

export default function FormCheck({
  type = "checkbox",
  label = "Label",
  className = "",
  ...rest
}) {
  const id = useId();

  return (
    <div className="form-check">
      <input
        className={["form-check-input", className].filter((el) => el).join(" ")}
        type={type}
        id={id}
        {...rest}
      />
      <label className="form-check-label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}
