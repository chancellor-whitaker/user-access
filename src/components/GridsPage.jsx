import { AgGridReact } from "ag-grid-react";
import { useState } from "react";

import useData from "../hooks/useData";
import Modal from "./Modal";

const defaultDataAccessor = (x) => x;

export default function GridsPage({
  secondaryDataAccessor = defaultDataAccessor,
  primaryDataAccessor = defaultDataAccessor,
  formRenderer: Editor,
  secondaryUrlGetter,
  primaryGroupsKey,
  secondaryColDefs,
  primaryColDefs,
  secondaryLabel,
  primaryIdKey,
  primaryLabel,
  primaryUrl,
}) {
  const [modifiedRows, setModifiedRows] = useState([]);

  const [clickedRowId, setClickedRowId] = useState(null);

  const originalRows = useData(primaryUrl);

  const rows = primaryDataAccessor(originalRows);

  const replaceRows = () => {
    const arr = [rows].filter((el) => el).flat();

    const store = {};

    arr.forEach((el) => (store[el[primaryIdKey]] = el));

    modifiedRows.forEach((el) => (store[el[primaryIdKey]] = el));

    return Object.values(store);
  };

  const rowData = replaceRows(rows);

  //   console.log(originalRows);

  const clickedRow = rowData.find(
    ({ [primaryIdKey]: rowId }) => rowId === clickedRowId
  );

  const onRowClicked = ({ data: { [primaryIdKey]: rowId } }) =>
    setClickedRowId((id) => (id !== rowId ? rowId : null));

  const primaryGrid = (
    <div>
      <p className="mb-2">{primaryLabel}</p>
      <div style={{ height: 500 }}>
        <AgGridReact
          onRowClicked={onRowClicked}
          columnDefs={primaryColDefs}
          rowData={rowData}
        />
      </div>
    </div>
  );

  const [modalActive, setModalActive] = useState(false);

  const [pendingRow, setPendingRow] = useState({});

  const toggleModal = () => {
    setModalActive((status) => !status);

    setClickedRowId(null);
  };

  if (clickedRowId && !modalActive) {
    setModalActive(true);

    setPendingRow(clickedRow);
  }

  const saveChanges = () => {
    setModifiedRows((arr) => [
      ...arr.filter((el) => el[primaryIdKey] !== pendingRow[primaryIdKey]),
      pendingRow,
    ]);

    toggleModal();
  };

  const modalFooter = (
    <>
      <button className="btn btn-secondary" onClick={toggleModal} type="button">
        Close
      </button>
      <button className="btn btn-primary" onClick={saveChanges} type="button">
        Save changes
      </button>
    </>
  );

  const secondaryUrl = secondaryUrlGetter(clickedRowId);

  const originalSecondaryRows = useData(secondaryUrl);

  const secondaryRows = secondaryDataAccessor(originalSecondaryRows);

  const secondaryData = [secondaryRows].filter((el) => el).flat();

  // const [clickedSecondaryId, setClickedSecondaryId] = useState(null);

  // const clickedUser = secondaryData.find(
  //   ({ [secondaryIdKey]: userId }) => userId === clickedSecondaryId
  // );

  // const onUserRowClicked = ({ data: { [secondaryIdKey]: userId } }) =>
  //   setClickedSecondaryId((id) => (id !== userId ? userId : null));

  const secondaryGrid = clickedRowId && (
    <div>
      <AgGridReact
        // onRowClicked={onUserRowClicked}
        columnDefs={secondaryColDefs}
        rowData={secondaryData}
        domLayout="autoHeight"
      />
    </div>
  );

  // const userUrl = getUserUrl(clickedSecondaryId);

  // const userData = useData(userUrl);

  // const user = clickedSecondaryId ? userData : { Reports: [], Groups: [] };

  // const userReports = user.Reports;

  // const userGrid = clickedSecondaryId && (
  //   <div style={{ height: 500 }}>
  //     <AgGridReact
  //       // onRowClicked={onRowClicked}
  //       columnDefs={primaryColDefs}
  //       rowData={userReports}
  //     />
  //   </div>
  // );

  const [notEditing, setNotEditing] = useState();

  const modalTitle = (
    <div className="d-flex flex-wrap gap-2">
      <div>{clickedRowId}</div>
      <div className="btn-group" role="group">
        <button
          className={["btn btn-primary", !notEditing && "active"]
            .filter((el) => el)
            .join(" ")}
          onClick={() => setNotEditing(false)}
          type="button"
        >
          Details
        </button>
        <button
          className={["btn btn-primary", notEditing && "active"]
            .filter((el) => el)
            .join(" ")}
          onClick={() => setNotEditing(true)}
          type="button"
        >
          {secondaryLabel}
        </button>
      </div>
    </div>
  );

  const editorProps = {
    primaryGroupsKey,
    setPendingRow,
    pendingRow,
    clickedRow,
    rowData,
  };

  const modalBody = notEditing ? (
    secondaryGrid
  ) : typeof Editor === "function" ? (
    <Editor {...editorProps}></Editor>
  ) : null;

  return (
    <>
      {primaryGrid}
      <Modal
        active={modalActive}
        footer={modalFooter}
        close={toggleModal}
        title={modalTitle}
        body={modalBody}
      ></Modal>
    </>
  );
}
