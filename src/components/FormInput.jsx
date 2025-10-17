import { useId } from "react";

export default function FormInput({
  placeholder = "Chance",
  label = "First name",
  type = "text",
  ...rest
}) {
  const id = useId();

  return (
    <>
      <div className="mb-3">
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
        <input
          placeholder={placeholder}
          className="form-control"
          type={type}
          id={id}
          {...rest}
        />
      </div>
    </>
  );
}
