import { useState } from "react";

import VirtualList from "./VirtualList";
import FormCheck from "./FormCheck";
import FormInput from "./FormInput";

export default function FormChecklist({
  nameFormatter = (x) => x,
  children = [],
  labelGetter,
  isDisabled,
  isChecked,
  onChange,
  name,
}) {
  const [searchValue, setSearchValue] = useState("");

  const onSearchChange = ({ target: { value } }) => setSearchValue(value);

  const getLabel = (value) =>
    typeof labelGetter === "function" ? labelGetter({ value, name }) : value;

  const filteredChildren = children.filter((value) =>
    getLabel(value).toLowerCase().includes(searchValue.toLowerCase().trim())
  );

  return (
    <FormInput label={nameFormatter(name)} key={name}>
      <input
        className="form-control shadow-sm mb-2"
        onChange={onSearchChange}
        placeholder="Filter..."
        value={searchValue}
        type="text"
      />
      <VirtualList className="overflow-y-scroll" style={{ height: 150 }}>
        {filteredChildren.map((value) => (
          <FormCheck
            disabled={isDisabled({ value, name })}
            checked={isChecked({ value, name })}
            label={getLabel(value)}
            onChange={onChange}
            value={value}
            name={name}
            key={value}
          ></FormCheck>
        ))}
      </VirtualList>
    </FormInput>
  );
}
