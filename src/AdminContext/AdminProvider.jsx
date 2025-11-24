import { useCallback, useState, useMemo } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { AgGridReact } from "ag-grid-react";

import { findNewSetElements, getJsonPromise, toTruthyArray } from "../utils";
import AutoHeightTextarea from "../components/AutoHeightTextarea";
import FormChecklist from "../components/FormChecklist";
import FormInput from "../components/FormInput";
import FormCheck from "../components/FormCheck";
import usePromise from "../hooks/usePromise";
import { urlSegments } from "../constants";
import AdminContext from "./AdminContext";
import Modal from "../components/Modal";

const promises = [
  { url: `${urlSegments.base}/${urlSegments.users}`, id: "users" },
  { url: `${urlSegments.base}/${urlSegments.reports}`, id: "reports" },
];

const datasetsPromiseFactory = () =>
  Promise.all(promises.map(({ url }) => getJsonPromise(url)));

const groupsPromiseFactory = () =>
  fetch(`${urlSegments.base}/${urlSegments.groups}`).then((res) => res.json());

const createTables = (datasets) => {
  if (Array.isArray(datasets)) {
    const usersTable = datasets[promises.findIndex(({ id }) => id === "users")];

    const reportsData =
      datasets[promises.findIndex(({ id }) => id === "reports")];

    const reportsTable = Object.fromEntries(
      reportsData.map((row) => [row.report_id, row])
    );

    return { reports: reportsTable, users: usersTable };
  }

  return { reports: {}, users: {} };
};

const inferGroupsTable = ({ reports: reportsTable, users: usersTable }) => {
  const groupsTable = {};

  Object.entries(usersTable).forEach(([user, row]) => {
    const groups = toTruthyArray(row.groups)
      .filter(({ acl_active }) => acl_active === "Y")
      .map(({ acl_report_id }) => acl_report_id);

    groups.forEach((group) => {
      if (!(group in groupsTable)) {
        groupsTable[group] = { reports: new Set(), users: new Set() };
      }

      groupsTable[group].users.add(user);
    });
  });

  Object.entries(reportsTable).forEach(([report, row]) => {
    const groups =
      typeof row.report_groups === "string" ? row.report_groups.split(",") : [];

    groups.forEach((group) => {
      if (!(group in groupsTable)) {
        groupsTable[group] = { reports: new Set(), users: new Set() };
      }

      groupsTable[group].reports.add(report);
    });
  });

  return groupsTable;
};

const updateGroupSet = ({ target: { checked, value, name } }, state) => {
  const newState = { ...state };

  const items = [...newState[name]].filter((item) => item !== value);

  if (checked) items.push(value);

  newState[name] = new Set(items);

  return newState;
};

const updateRecordProperty = ({ target: { value, name } }, state) =>
  Object.fromEntries(
    Object.entries(state).map((arr) => (arr[0] === name ? [name, value] : arr))
  );

const updateReportGroup = ({ target: { value: group, checked } }, state) => {
  let groups = (
    typeof state.report_groups === "string" ? state.report_groups : ""
  )
    .split(",")
    .filter((el) => el !== group);

  if (checked) groups = [...groups, group];

  return { ...state, report_groups: groups.join() };
};

const updateUserGroup = ({ target: { value: group, checked } }, state) => {
  const didExist = toTruthyArray(state.groups).find(
    ({ acl_report_id }) => acl_report_id === group
  );

  const el = {
    acl_active: checked ? "Y" : "N",
    acl_report_id: group,
    acl_group_ind: "Y",
    acl_flags: null,
  };

  let groups = [
    ...toTruthyArray(state.groups).filter(
      ({ acl_report_id }) => acl_report_id !== group
    ),
    el,
  ];

  if (!didExist && !checked) {
    groups = groups.filter((obj) => obj !== el);
  }

  return { ...state, groups };
};

const updateTableRecGroup = (e, state) => {
  if (e.target.name === "users") {
    return updateUserGroup(e, state);
  }

  if (e.target.name === "reports") {
    return updateReportGroup(e, state);
  }
};

const findEveryGroupChange = ({ oldRecord, newRecord, group }) => {
  const checkedIdEvents = Object.entries(newRecord)
    .map(([tId, set]) =>
      findNewSetElements(oldRecord[tId], set).map((id) => ({
        target: { checked: true, value: group, name: tId },
        id,
      }))
    )
    .flat();

  const uncheckedIdEvents = Object.entries(newRecord)
    .map(([tId, set]) =>
      findNewSetElements(set, oldRecord[tId]).map((id) => ({
        target: { checked: false, value: group, name: tId },
        id,
      }))
    )
    .flat();

  return [...checkedIdEvents, ...uncheckedIdEvents];
};

const getUserUrl = (id) => `${urlSegments.base}/${urlSegments.users}/${id}`;

const getReportUrl = () => `${urlSegments.base}/${urlSegments.reports}`;

// * groups modal save error
// * search on grids
// * search checklists
// * checklist doesn't show if checklist field not found in record
// * float active items in checklists to top
// * might want multiple fields in checklists like report title
// * disable non-fetched groups
// ? more fields in grid
// ? may still want option to click item in group modal to launch edit modal of item
// * add mechanism for sending new report back
// * add mechanism for sending many reports & groups back
// * add mechanism for refetching data after pushing changes
// * handle newline characters in text boxes like report notes

// * meagan punctuation/grammar
// * report table in users modal
// * make user active a radio Y or N
// * make report active a radio Y or N
// * borders instead of shadows on input elements
// * to report table, add active, id, title, & link
// * to user table, add active, admin, id, & groups
// * only clicking id should open modal
// * make report link clickable
// ? insert users & insert reports & create groups
// ? how to handle acl flags for user groups? (groups listed as table or text box next to group name or another modal?)

const doNotDisplay = new Set([
  "report_users_moved",
  "report_data_moved",
  "report_url_for",
  "report_moved",
]);

const disabledFields = new Set(["report_id"]);

const idColDef = {
  cellClass: "text-decoration-underline pointer",
  field: "id",
};

const AdminProvider = ({ children }) => {
  const [allGroups, fetchAllGroups] = usePromise(groupsPromiseFactory);

  const allGroupsSet = new Set([allGroups].filter((el) => el).flat());

  const [quickFilterText, setQuickFilterText] = useState("");

  const onQuickFilterChange = ({ target: { value } }) =>
    setQuickFilterText(value);

  const quickFilter = (
    <input
      className="form-control shadow-sm"
      onChange={onQuickFilterChange}
      style={{ maxWidth: 200 }}
      placeholder="Filter..."
      value={quickFilterText}
      type="text"
    />
  );

  // const [modifiedRecords, setModifiedRecords] = useState({
  //   reports: {},
  //   users: {},
  // });

  const [datasets, fetchDatasets] = usePromise(datasetsPromiseFactory);

  const tables = useMemo(() => createTables(datasets), [datasets]);

  // const tables = useMemo(
  //   () =>
  //     Object.fromEntries(
  //       Object.entries(origTables).map(([tId, recordsById]) => [
  //         tId,
  //         Object.fromEntries(
  //           Object.entries(recordsById).map((entry) => {
  //             const [rId] = entry;
  //             if (rId in modifiedRecords[tId]) {
  //               return [rId, modifiedRecords[tId][rId]];
  //             }

  //             return entry;
  //           })
  //         ),
  //       ])
  //     ),
  //   [origTables, modifiedRecords]
  // );

  const labelLookup = useMemo(() => {
    return Object.fromEntries(
      Object.entries(tables).map(([tId, tableByIds]) => {
        return [
          tId,
          Object.fromEntries(
            Object.entries(tableByIds).map(([id, row]) => {
              return tId === "reports"
                ? [id, `${id} (${row.report_title})`]
                : [id, id];
            })
          ),
        ];
      })
    );
  }, [tables]);

  const getLabel = useCallback(
    ({ value, name }) => {
      if (name in labelLookup && value in labelLookup[name]) {
        return labelLookup[name][value];
      }

      return value;
    },
    [labelLookup]
  );

  const groupsTable = useMemo(() => inferGroupsTable(tables), [tables]);

  const [tableId, setTableId] = useState(null);

  let table = null;

  if (tableId in tables) table = tables[tableId];

  if (tableId === "groups") table = groupsTable;

  const [recordId, setRecordId] = useState(null);

  const locateRecord = () => table[recordId];

  const recordLocatable = table !== null && recordId !== null;

  const record = recordLocatable ? locateRecord() : null;

  const [tempRecord, setTempRecord] = useState(null);

  if (record !== null && tempRecord === null) {
    // if (tableId in table2GroupsKey && !(table2GroupsKey[tableId] in record)) {
    //   setTempRecord({ [table2GroupsKey[tableId]]: [], ...record });
    // } else {
    //   setTempRecord(record);
    // }
    if (tableId === "users" && !("groups" in record)) {
      setTempRecord({ groups: [], ...record });
    } else if (tableId === "reports" && !("report_groups" in record)) {
      setTempRecord({ report_groups: [], ...record });
    } else {
      setTempRecord(record);
    }
  }

  if (record === null && tempRecord !== null) setTempRecord(null);

  const updateTempRecord = (e) =>
    setTempRecord((state) => updateRecordProperty(e, state));

  const handleCheck = (e) => {
    if (tableId === "users") {
      setTempRecord((state) => updateUserGroup(e, state));
    }

    if (tableId === "reports") {
      setTempRecord((state) => updateReportGroup(e, state));
    }

    if (tableId === "groups") {
      setTempRecord((state) => updateGroupSet(e, state));
    }
  };

  const postToPromise = ({ body, url }) =>
    fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      method: "POST",
    });

  const getBody = (tId, rId, row) => {
    if (tId === "users") {
      return {
        [rId]: {
          ...row,
          groups: row.groups.filter(({ acl_report_id }) =>
            allGroupsSet.has(acl_report_id)
          ),
        },
      };
    }

    if (tId === "reports") {
      return {
        ...row,
        report_groups:
          row.report_groups && typeof row.report_groups === "string"
            ? row.report_groups
                .split(",")
                .filter((el) => allGroupsSet.has(el))
                .join(",")
            : row.report_groups,
      };
    }
  };

  const getUrl = (tId, rId) =>
    tId === "users"
      ? getUserUrl(rId)
      : tId === "reports"
      ? getReportUrl("")
      : "";

  const handleSubmit = async (posts) => {
    await Promise.all(posts.map(postToPromise))
      .then((responses) => {
        // All requests succeeded
        console.log("All responses:", responses);
        return Promise.all(responses.map((res) => res.json()));
      })
      .then((data) => {
        console.log("All response data:", data);
      })
      .catch((error) => {
        console.error("One or more requests failed:", error);
      });

    fetchDatasets();

    fetchAllGroups();
  };

  const save = () => {
    if (tableId in tables) {
      const posts = [
        {
          body: getBody(tableId, recordId, tempRecord),
          url: getUrl(tableId, recordId),
        },
      ];

      handleSubmit(posts);
    }

    if (tableId === "groups") {
      const changes = findEveryGroupChange({
        newRecord: tempRecord,
        oldRecord: record,
        group: recordId,
      });

      const posts = changes.map(({ id, ...e }) => ({
        body: getBody(
          e.target.name,
          id,
          updateTableRecGroup(e, tables[e.target.name][id])
        ),
        url: getUrl(e.target.name, id),
      }));

      handleSubmit(posts);
    }
  };

  const sortedLists = {
    ...Object.fromEntries(
      Object.entries(tables).map(([id, records]) => [
        id,
        Object.keys(records).sort(),
      ])
    ),
    groups: Object.keys(groupsTable).sort(),
  };

  if (tableId === null && datasets !== null) {
    setTableId(Object.keys(sortedLists)[0]);
  }

  const switchTable = (id) => {
    setTableId(id);

    setRecordId(null);
  };

  // const onRowClicked = (e) => {
  //   const {
  //     data: { id },
  //   } = e;
  //   setRecordId((rId) => (id === rId ? null : id));
  // };

  const onCellClicked = (e) => {
    const {
      colDef: { field },
      data: { id },
    } = e;

    if (field === "id") {
      setRecordId((rId) => (id === rId ? null : id));
    }
  };

  const btnGroup = (
    <div>
      <div className="btn-group shadow-sm" role="group">
        {Object.keys(sortedLists).map((str) => (
          <button
            className={["btn btn-primary", tableId === str && "active"]
              .filter((el) => el)
              .join(" ")}
            onClick={() => switchTable(str)}
            type="button"
            key={str}
          >
            {str[0].toLocaleUpperCase() + str.substring(1).toLocaleLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );

  const getRowsAndCols = () => {
    const rowData =
      tableId in sortedLists
        ? sortedLists[tableId].map((id) => ({ id }))
        : null;

    const valueGetter = ({ colDef: { field }, data: { id } }) =>
      tables[tableId][id]?.[field];

    if (tableId === "reports") {
      return {
        columnDefs: [
          { field: "report_active", headerName: "Active", valueGetter },
          idColDef,
          { field: "report_title", headerName: "Title", valueGetter },
          {
            cellRenderer: ({ value }) => (
              <a
                className="text-decoration-underline text-primary"
                rel="noreferrer"
                target="_blank"
                href={value}
              >
                {value}
              </a>
            ),
            field: "report_link",
            headerName: "Link",
            valueGetter,
          },
        ],
        rowData,
      };
    }

    if (tableId === "users") {
      return {
        columnDefs: [
          { field: "user_active", headerName: "Active", valueGetter },
          idColDef,
          {
            valueGetter: ({ data: { id } }) =>
              [tables[tableId][id]?.groups]
                .filter((el) => el)
                .flat()
                .find(
                  ({ acl_report_id, acl_active }) =>
                    acl_active && acl_report_id === "ADMIN"
                )
                ? "Y"
                : "N",
            headerName: "Admin",
          },
          {
            valueGetter: ({ data: { id } }) =>
              [tables[tableId][id]?.groups]
                .filter((el) => el)
                .flat()
                .filter(({ acl_active }) => acl_active)
                .map(({ acl_report_id }) => acl_report_id)
                .join(", "),
            headerName: "Groups",
          },
        ],
        rowData,
      };
    }

    return { rowData };
  };

  const { columnDefs = [idColDef], rowData } = getRowsAndCols();

  const dataGrid = (
    <div style={{ height: 500 }}>
      <AgGridReact
        quickFilterText={quickFilterText}
        onCellClicked={onCellClicked}
        // onRowClicked={onRowClicked}
        columnDefs={columnDefs}
        rowData={rowData}
      />
    </div>
  );

  const [modalActive, setModalActive] = useState();

  if (recordId && !modalActive) setModalActive(true);

  const closeModal = () => {
    setModalActive(false);
    setRecordId(null);
  };

  const showChecklist = (name) => {
    if (tableId === "users" && name === "groups") {
      return true;
    }

    if (tableId === "reports" && name === "report_groups") {
      return true;
    }

    if (tableId === "groups" && name === "users") {
      return true;
    }

    if (tableId === "groups" && name === "reports") {
      return true;
    }

    return false;
  };

  const isDisabled = ({ value, name }) => {
    if (tableId === "users" && name === "groups") {
      return !allGroupsSet.has(value);
    }

    if (tableId === "reports" && name === "report_groups") {
      return !allGroupsSet.has(value);
    }

    return false;
  };

  const isChecked = ({ value, name }) => {
    if (!tempRecord) return false;

    if (tableId === "users") {
      const set = new Set(
        toTruthyArray(tempRecord[name])
          .filter(({ acl_active }) => acl_active === "Y")
          .map(({ acl_report_id }) => acl_report_id)
      );

      return set.has(value);
    }

    if (tableId === "reports") {
      const set = new Set(
        typeof tempRecord[name] === "string" ? tempRecord[name].split(",") : []
      );

      return set.has(value);
    }

    if (tableId === "groups") {
      const set = tempRecord[name];

      return set.has(value);
    }
  };

  const wasChecked = ({ value, name }) => {
    if (!record) return false;

    if (tableId === "users") {
      const set = new Set(
        toTruthyArray(record[name])
          .filter(({ acl_active }) => acl_active === "Y")
          .map(({ acl_report_id }) => acl_report_id)
      );

      return set.has(value);
    }

    if (tableId === "reports") {
      const set = new Set(
        typeof record[name] === "string" ? record[name].split(",") : []
      );

      return set.has(value);
    }

    if (tableId === "groups") {
      const set = record[name];

      return set.has(value);
    }
  };

  const getList = (name) => {
    if (tableId === "users") {
      return sortedLists.groups;
    }

    if (tableId === "reports") {
      return sortedLists.groups;
    }

    if (tableId === "groups") {
      return sortedLists[name];
    }
  };

  const boolToBin = (a) => (a ? 1 : 0);

  const sortByWasChecked = (name) => (a, b) =>
    boolToBin(wasChecked({ value: b, name })) -
    boolToBin(wasChecked({ value: a, name }));

  const getUserReports = () => {
    if (tableId === "users" && tempRecord) {
      const groups = new Set(
        [tempRecord.groups]
          .filter(Boolean)
          .flat()
          .filter(({ acl_active }) => acl_active)
          .map(({ acl_report_id }) => acl_report_id)
      );

      return Object.values(tables.reports).filter((object) =>
        (typeof object.report_groups === "string" ? object.report_groups : "")
          .split(",")
          .some((group) => groups.has(group))
      );
    }

    return null;
  };

  const userReports = getUserReports();

  console.log(userReports);

  const modalBody = (
    <>
      {tempRecord ? (
        <>
          {Object.entries(tempRecord)
            .sort(
              ([a], [b]) =>
                (b.split("_").includes("active") ? 1 : 0) -
                (a.split("_").includes("active") ? 1 : 0)
            )
            .filter(([name]) => !doNotDisplay.has(name))
            .map(([name, value]) =>
              showChecklist(name) ? (
                <FormChecklist
                  nameFormatter={labelFormatter}
                  isDisabled={isDisabled}
                  labelGetter={getLabel}
                  onChange={handleCheck}
                  isChecked={isChecked}
                  name={name}
                  key={name}
                >
                  {[...getList(name)].sort(sortByWasChecked(name))}
                </FormChecklist>
              ) : (
                <FormInput
                  // value={typeof value === "string" ? value : ""}
                  // onChange={updateTempRecord}
                  label={labelFormatter(typeof name === "string" ? name : "")}
                  // name={name}
                  key={name}
                >
                  {name.split("_").includes("active") ? (
                    <div>
                      <FormCheck
                        onChange={updateTempRecord}
                        checked={value === "Y"}
                        name={name}
                        value="Y"
                        label="Y"
                        inline
                      ></FormCheck>
                      <FormCheck
                        onChange={updateTempRecord}
                        checked={value === "N"}
                        name={name}
                        value="N"
                        label="N"
                        inline
                      ></FormCheck>
                    </div>
                  ) : (
                    <TextareaAutosize
                      value={typeof value === "string" ? value : ""}
                      style={{ overflow: "hidden", resize: "none" }}
                      disabled={disabledFields.has(name)}
                      className="form-control shadow-sm"
                      onChange={updateTempRecord}
                      name={name}
                    ></TextareaAutosize>
                  )}
                  {/* <AutoHeightTextarea
                  value={typeof value === "string" ? value : ""}
                  onChange={updateTempRecord}
                  name={name}
                ></AutoHeightTextarea> */}
                </FormInput>
              )
            )}
          {userReports ? (
            <div>
              <AgGridReact
                columnDefs={[
                  { field: "report_id", headerName: "Id" },
                  { field: "report_title", headerName: "Title" },
                ]}
                domLayout="autoHeight"
                rowData={userReports}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );

  const modalFooter = (
    <>
      <button className="btn btn-secondary" onClick={closeModal} type="button">
        Close
      </button>
      <button
        onClick={() => {
          save();
          closeModal();
        }}
        className="btn btn-primary"
        type="button"
      >
        Save changes
      </button>
    </>
  );

  const modal = (
    <Modal
      title={`${labelFormatter(tableId)}: ${recordId}`}
      footer={modalFooter}
      active={modalActive}
      close={closeModal}
      body={modalBody}
    ></Modal>
  );

  return (
    <AdminContext.Provider value={{ quickFilter, btnGroup, dataGrid, modal }}>
      {children}
    </AdminContext.Provider>
  );
};

const labelFormatter = (string = "") =>
  string
    .split("_")
    .map((word) => word[0].toUpperCase() + word.substring(1).toLowerCase())
    .join(" ");

export default AdminProvider;
