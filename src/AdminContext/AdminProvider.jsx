import { useEffect, useState, useMemo, useId } from "react";
import { AgGridReact } from "ag-grid-react";

import AdminContext from "./AdminContext";
import Modal from "../components/Modal";

// * report form to make modifications to 1 report
// ? modify 1 report & its text values & assigned groups
// ! an api to update a report
// ! since being sent back in original format, must be able to maintain pre-modified record & version in form

// * user form to make modifications to 1 user
// ? modify 1 user & its text values & assigned groups
// ! an api to update a user
// ! since being sent back in original format, must be able to maintain pre-modified record & version in form

// * group form to make modifications to N users & N reports
// ? modify N users & N reports assigned to 1 group
// ! call api N times to update users & reports

// ! call api N times once hit save
/*
current
[
{
group
}
]

changes
[ 

{
 group: groupId, 
 value: recordId,
 checked: true/false
 name: "users"/"reports", 
}

...,

 {},

]
*/

// group form
// group
// list of users
// ...
// list
// userA
// userB
// ...
// list of reports
// ...

const url = "https://irserver2.eku.edu/Apps/DataPage/PROD/auth";

const promises = [
  { url: `${url}/all_users`, id: "users" },
  { url: `${url}/reports_list_api`, id: "reports" },
];

const getJsonPromise = (url) => fetch(url).then((response) => response.json());

const allDataPromise = Promise.all(
  promises.map(({ url }) => getJsonPromise(url))
);

const toTruthyArray = (array) => [array].filter(Boolean).flat();

const usePromise = (promise) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    if (promise) {
      let ignore = false;

      promise.then((response) => !ignore && setState(response));

      return () => {
        ignore = true;
      };
    }
  }, [promise]);

  return state;
};

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

const storeModification = ({ recordId, records, tableId, record }) => {
  const updated = { ...records };

  updated[tableId] = { ...updated[tableId] };

  updated[tableId][recordId] = record;

  return updated;
};

const findNewSetElements = (oldSet, newSet) =>
  [...newSet].filter((el) => !oldSet.has(el));

const updateTableRecGroup = (e, state) => {
  if (e.name === "users") {
    updateUserGroup(e, state);
  }

  if (e.name === "reports") {
    updateReportGroup(e, state);
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

// checklists modifiable
// checklists not savable
// checklist doesn't show if checklist field not found in record

const AdminProvider = ({ children }) => {
  const [modifiedRecords, setModifiedRecords] = useState({
    reports: {},
    users: {},
  });

  const datasets = usePromise(allDataPromise);

  const origTables = useMemo(() => createTables(datasets), [datasets]);

  const tables = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(origTables).map(([tId, recordsById]) => [
          tId,
          Object.fromEntries(
            Object.entries(recordsById).map((entry) => {
              const [rId] = entry;
              if (rId in modifiedRecords[tId]) {
                return [rId, modifiedRecords[tId][rId]];
              }

              return entry;
            })
          ),
        ])
      ),
    [origTables, modifiedRecords]
  );

  //   console.log(tables);

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

  if (record !== null && tempRecord === null) setTempRecord(record);

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

  const save = () => {
    if (tableId in tables) {
      setModifiedRecords((records) =>
        storeModification({ record: tempRecord, recordId, records, tableId })
      );
    }

    if (tableId === "groups") {
      setModifiedRecords((state) => {
        const newState = Object.fromEntries(
          Object.entries(state).map(([tId, recordsById]) => [
            tId,
            { ...recordsById },
          ])
        );

        const changes = findEveryGroupChange({
          newRecord: tempRecord,
          oldRecord: record,
          group: recordId,
        });

        changes.forEach(({ id, ...e }) => {
          newState[e.name][id] = updateTableRecGroup(e, tables[e.name][id]);
        });

        return newState;
      });
      // compare record to tempRecord to find the differences in the sets
      // for both sets, find ids in tempRecord that DON'T appear in record
      // these ids were checked
      // for both sets, find ids in record that DON'T appear in tempRecord
      // these ids were unchecked
      // how do you utilize updateReportGroup & updateUserGroup to handle these changes?
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

  const switchTable = (id) => {
    setTableId(id);

    setRecordId(null);
  };

  const onRowClicked = ({ data: { id } }) =>
    setRecordId((rId) => (id === rId ? null : id));

  const btnGroup = (
    <div>
      <div className="btn-group" role="group">
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

  const dataGrid = (
    <div style={{ height: 500 }}>
      <AgGridReact
        rowData={
          tableId in sortedLists
            ? sortedLists[tableId].map((id) => ({ id }))
            : null
        }
        columnDefs={[{ field: "id" }]}
        onRowClicked={onRowClicked}
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

  const isChecked = ({ value, name }) => {
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

  const modal = (
    <Modal
      body={
        <>
          {tempRecord ? (
            <>
              {Object.entries(tempRecord).map(([name, value]) =>
                showChecklist(name) ? (
                  <FormInput label={name} key={name}>
                    <div className="overflow-y-scroll" style={{ height: 150 }}>
                      {getList(name).map((group) => (
                        <FormCheck
                          checked={
                            tempRecord && isChecked({ value: group, name })
                          }
                          onChange={handleCheck}
                          value={group}
                          label={group}
                          name={name}
                        ></FormCheck>
                      ))}
                    </div>
                  </FormInput>
                ) : (
                  <FormInput
                    onChange={updateTempRecord}
                    value={value}
                    label={name}
                    name={name}
                    key={name}
                  ></FormInput>
                )
              )}
            </>
          ) : null}
        </>
      }
      title={`${tableId}: ${recordId}`}
      active={modalActive}
      close={closeModal}
    ></Modal>
  );

  // console.log(sortedLists);

  return (
    <AdminContext.Provider value={{ btnGroup, dataGrid, modal }}>
      {children}
    </AdminContext.Provider>
  );
};

const FormInput = ({
  placeholder = "Text",
  label = "Label",
  className = "",
  type = "text",
  ...rest
}) => {
  const id = useId();

  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      {"children" in rest ? (
        rest.children
      ) : (
        <input
          className={["form-control", className].filter((el) => el).join(" ")}
          placeholder={placeholder}
          type={type}
          id={id}
          {...rest}
        />
      )}
    </div>
  );
};

const FormCheck = ({
  type = "checkbox",
  label = "Label",
  className = "",
  ...rest
}) => {
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
};

export default AdminProvider;
