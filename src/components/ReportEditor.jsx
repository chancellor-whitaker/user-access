import { Fragment, useMemo } from "react";

import FormInput from "./FormInput";
import FormCheck from "./FormCheck";

export default function ReportEditor({
  primaryGroupsKey,
  setPendingRow,
  pendingRow,
  clickedRow,
  rowData,
}) {
  const binaryIndicators = new Set(["active", "moved"]);

  const ignoreHaving = new Set(["groups", "id", ...binaryIndicators]);

  const removeIgnored = (array, set = ignoreHaving) =>
    !array.some((el) => set.has(el));

  const allFoundGroups = [
    ...new Set(
      rowData
        .map(({ [primaryGroupsKey]: groups }) => groups)
        .filter((el) => typeof el === "string")
        .map((str) => str.split(","))
        .flat()
    ),
  ].sort();

  const onTextInputChange = ({ target: { value, name } }) =>
    setPendingRow((row) =>
      Object.fromEntries(
        Object.entries(row).map((pair) =>
          pair[0] === name ? [name, value] : pair
        )
      )
    );

  const checkedGroups = useMemo(
    () =>
      typeof pendingRow[primaryGroupsKey] === "string"
        ? new Set(pendingRow[primaryGroupsKey].split(","))
        : new Set(),
    [pendingRow, primaryGroupsKey]
  );

  const isGroupChecked = (group) => checkedGroups.has(group);

  const handleGroupsChange = ({ target: { value } }) =>
    setPendingRow((row) => {
      const selected =
        typeof row[primaryGroupsKey] === "string"
          ? new Set(row[primaryGroupsKey].split(","))
          : new Set();

      selected.has(value) ? selected.delete(value) : selected.add(value);

      const groups = [...selected].join();

      return { ...row, [primaryGroupsKey]: groups };
    });

  const handleBinaryChanged = ({ target: { value, name } }) =>
    setPendingRow((row) => ({ ...row, [name]: value }));

  const renderBinaryForm = (name) => (
    <div className="mb-3">
      <label className="form-label">
        {name} (<i className="small text-success">{clickedRow[name]}</i>)
      </label>
      <div>
        {["Y", "N"].map((value) => (
          <FormCheck
            checked={pendingRow[name] === value}
            onChange={handleBinaryChanged}
            value={value}
            name={name}
            key={value}
          >
            {value}
          </FormCheck>
        ))}
      </div>
    </div>
  );

  const binaryForms = !clickedRow
    ? []
    : Object.keys(clickedRow)
        .filter((name) =>
          name.split("_").some((segment) => binaryIndicators.has(segment))
        )
        .map((name) => renderBinaryForm(name));

  const groupsForm = clickedRow && (
    <div className="mb-3">
      <label className="form-label">
        {primaryGroupsKey} (
        <i className="small text-success">{clickedRow[primaryGroupsKey]}</i>)
      </label>
      <div className="overflow-y-scroll">
        {allFoundGroups.map((value) => (
          <FormCheck
            checked={isGroupChecked(value)}
            onChange={handleGroupsChange}
            inline={false}
            value={value}
            key={value}
          >
            {value}
          </FormCheck>
        ))}
      </div>
    </div>
  );

  const textForms = !clickedRow
    ? []
    : Object.entries(clickedRow)
        .filter(([key]) => removeIgnored(key.split("_")))
        .map(([name, value]) => (
          <FormInput
            label={
              <>
                {name} (<i className="small text-success">{clickedRow[name]}</i>
                )
              </>
            }
            value={pendingRow[name] ? pendingRow[name] : ""}
            onChange={onTextInputChange}
            placeholder={value}
            name={name}
            key={name}
          ></FormInput>
        ));

  return [...binaryForms, ...textForms, groupsForm].map((child, i) => (
    <Fragment key={i}>{child}</Fragment>
  ));
}
