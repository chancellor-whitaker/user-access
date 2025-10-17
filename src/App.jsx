import { useState, useMemo, useId } from "react";
import { AgGridReact } from "ag-grid-react";

import FormInput from "./components/FormInput";
// import reports from "./data/reports";
import fakeGroups from "./data/groups";
import Modal from "./components/Modal";
import useData from "./hooks/useData";
import fakeUsers from "./data/users";

const uniqueFakeUsers = new Set(fakeUsers.map(({ id }) => id));

const uniqueFakeGroups = new Set(fakeGroups.map(({ id }) => id));

const sortedFakeGroups = [...uniqueFakeGroups].sort();

// how are reports, groups, and users linked?
// each user can belong to many groups
// each group can have many users
// each group can access many reports
// each report can be accessed by many groups

// so, you need userGroups & reportGroups

// function getRandomElement(arr) {
//   // Generate a random index between 0 (inclusive) and arr.length (exclusive)
//   const randomIndex = Math.floor(Math.random() * arr.length);

//   // Return the element at the random index
//   return arr[randomIndex];
// }

// const getRandomRelationship = (arr1, arr2) => {
//   const arr1Element = getRandomElement(arr1);

//   const arr2Element = getRandomElement(arr2);

//   return {
//     [arr1Element.type]: arr1Element.id,
//     [arr2Element.type]: arr2Element.id,
//   };
// };

// const initializeRelationships = (iterations = 500) => {
//   const userGroups = [];

//   const reportGroups = [];

//   for (let i = 1; i <= iterations; i++) {
//     userGroups.push(getRandomRelationship(users, groups));

//     reportGroups.push(getRandomRelationship(groups, reports));
//   }

//   return { reportGroups, userGroups };
// };

// const { reportGroups, userGroups } = initializeRelationships(500);

// const sortByValueOrder = (arr, order = ["id", "type"], key = "field") => {
//   const quantify = (value) =>
//     order.includes(value) ? order.indexOf(value) : Number.MAX_SAFE_INTEGER;

//   return [...arr].sort(
//     ({ [key]: a }, { [key]: b }) => quantify(a) - quantify(b)
//   );
// };

// const getColDefs = (rows) =>
//   sortByValueOrder(
//     [...new Set(rows.map(Object.keys).flat())].map((field) => ({
//       pinned: field === "id" || field === "type",
//       field,
//     }))
//   );

const url = "https://irserver2.eku.edu/Apps/DataPage/PROD/auth";

const reportsUrl = `${url}/reports_list_api`;

const getUserUrl = (activeUser) =>
  activeUser ? `${url}/user_api/${activeUser}` : null;

const getAccessUrl = (activeReport) =>
  activeReport ? `${url}/report_access_api/${activeReport}` : null;

const reportColDefs = [
  { field: "report_id" },
  { field: "report_title" },
  { field: "report_active" },
  { field: "report_link" },
  { field: "report_groups" },
];

const userColDefs = [
  { field: "user_id" },
  { valueFormatter: ({ value }) => value.join(), field: "Groups" },
];

const FormCheck = ({ type = "checkbox", children, ...rest }) => {
  const id = useId();

  return (
    <div className="form-check">
      <input className="form-check-input" type={type} id={id} {...rest} />
      <label className="form-check-label" htmlFor={id}>
        {children}
      </label>
    </div>
  );
};

// manage running changes

// list of reports
// click on id to launch edit modal/modify icon button (api call when saving changes, passes id and other modifiable values)
// ! when editing report, edit everything but id (handle removing specific columns)
// toggle button where active Y/N (api call for active or not, pass id and whether is currently active)

// report clicked -> list of users that can access report
// leave as is

// user clicked -> list of reports they can access & user's properties
// api call to get all groups (to populate group checklist)
// change user being active (api call)
// change groups user can access through interface (save triggers api call where user id & now active groups are passed)

const ignoreHaving = new Set(["active", "groups", "moved", "id"]);

const removeIgnored = (array, set = ignoreHaving) =>
  !array.some((el) => set.has(el));

export default function App() {
  const idKey = "report_id";

  const [modifiedReps, setModifiedReps] = useState([]);

  const [clickedRepId, setClickedRepId] = useState(null);

  const reps = useData(reportsUrl);

  const replaceReps = () => {
    const arr = [reps].filter((el) => el).flat();

    const store = {};

    arr.forEach((el) => (store[el[idKey]] = el));

    modifiedReps.forEach((el) => (store[el[idKey]] = el));

    return Object.values(store);
  };

  const repData = replaceReps(reps);

  const clickedRep = repData.find(
    ({ [idKey]: repId }) => repId === clickedRepId
  );

  const repColDefs = useMemo(
    () => [
      { field: "report_active" },
      { field: "report_id" },
      { field: "report_title" },
      { field: "report_link" },
    ],
    []
  );

  const onRepRowClicked = ({ data: { [idKey]: repId } }) =>
    setClickedRepId((id) => (id !== repId ? repId : null));

  const [modalActive, setModalActive] = useState(false);

  const toggleModal = () => {
    setModalActive((status) => !status);

    setClickedRepId(null);
  };

  const [pendingRep, setPendingRep] = useState({});

  if (clickedRepId && !modalActive) {
    setModalActive(true);

    setPendingRep(clickedRep);
  }

  const onTextInputChange = ({ target: { value, name } }) =>
    setPendingRep((rep) =>
      Object.fromEntries(
        Object.entries(rep).map((pair) =>
          pair[0] === name ? [name, value] : pair
        )
      )
    );

  const saveChanges = () => {
    setModifiedReps((arr) => [
      ...arr.filter((el) => el[idKey] !== pendingRep[idKey]),
      pendingRep,
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

  return (
    <>
      <div style={{ height: 500 }}>
        <AgGridReact
          onRowClicked={onRepRowClicked}
          columnDefs={repColDefs}
          rowData={repData}
        />
      </div>
      <Modal
        body={
          <>
            {clickedRep &&
              Object.entries(clickedRep)
                .filter(([key]) => removeIgnored(key.split("_")))
                .map(([name, value]) => (
                  <FormInput
                    label={
                      <>
                        {name} (
                        <i className="small text-success">{clickedRep[name]}</i>
                        )
                      </>
                    }
                    value={pendingRep[name] ? pendingRep[name] : ""}
                    onChange={onTextInputChange}
                    placeholder={value}
                    name={name}
                    key={name}
                  ></FormInput>
                ))}
          </>
        }
        title={clickedRepId}
        active={modalActive}
        footer={modalFooter}
        close={toggleModal}
      ></Modal>
    </>
  );
}

// export default function App() {
//   const [activeUser, setActiveUser] = useState(null);

//   const [activeReport, setActiveReport] = useState(null);

//   const onReportRowClicked = ({ data: { report_id: reportId } }) => {
//     setActiveReport(reportId);

//     setActiveUser(null);
//   };

//   const onUserRowClicked = ({ data: { user_id: userId } }) => {
//     setActiveUser(userId);

//     setActiveReport(null);
//   };

//   const reset = () => {
//     setActiveReport(null);

//     setActiveUser(null);
//   };

//   const resetDisabled = !activeReport && !activeUser;

//   const reportsData = useData(reportsUrl);

//   const reportsGrid = resetDisabled && (
//     <>
//       <div>All reports</div>
//       <div style={{ height: 500 }}>
//         <AgGridReact
//           onRowClicked={onReportRowClicked}
//           columnDefs={reportColDefs}
//           rowData={reportsData}
//         />
//       </div>
//     </>
//   );

//   const activeReportUrl = getAccessUrl(activeReport);

//   const activeReportData = useData(activeReportUrl);

//   const activeReportGrid = activeReport && (
//     <>
//       <div>Users ({`Active report: ${activeReport}`})</div>
//       <div style={{ height: 500 }}>
//         <AgGridReact
//           onRowClicked={onUserRowClicked}
//           rowData={activeReportData}
//           columnDefs={userColDefs}
//         />
//       </div>
//     </>
//   );

//   const activeUserUrl = getUserUrl(activeUser);

//   const activeUserData = useData(activeUserUrl);

//   const activeUserObject = activeUserData
//     ? activeUserData
//     : { Reports: [], Groups: [], Active: "", Admin: "" };

//   const {
//     Active: userActiveStatus,
//     Admin: userAdminStatus,
//     Reports: userReports,
//     Groups: userGroups,
//   } = activeUserObject;

//   const activeUserGrid = activeUser && (
//     <>
//       <div>User: {activeUser}</div>
//       <div>Active: {userActiveStatus}</div>
//       <div>Admin: {userAdminStatus}</div>
//       <div>Groups: {userGroups.join()}</div>
//       <div>Reports ({`Active user: ${activeUser}`})</div>
//       <div style={{ height: 500 }}>
//         <AgGridReact
//           onRowClicked={onReportRowClicked}
//           columnDefs={reportColDefs}
//           rowData={userReports}
//         />
//       </div>
//     </>
//   );

//   // const groupsFound = [
//   //   ...new Set(
//   //     [reportsData]
//   //       .filter((element) => element)
//   //       .flat()
//   //       .map(({ report_groups }) =>
//   //         typeof report_groups === "string" ? report_groups.split(",") : []
//   //       )
//   //       .flat()
//   //       .sort()
//   //   ),
//   // ];

//   const [checkedGroups, setCheckedGroups] = useState(new Set());

//   const updateCheckedGroups = ({ target: { value } }) =>
//     setCheckedGroups((set) => {
//       const newSet = new Set(set);

//       newSet.has(value) ? newSet.delete(value) : newSet.add(value);

//       return newSet;
//     });

//   const groupCheckboxes = sortedFakeGroups.map((value) => (
//     <FormCheck
//       checked={checkedGroups.has(value)}
//       onChange={updateCheckedGroups}
//       value={value}
//       key={value}
//     >
//       {value}
//     </FormCheck>
//   ));

//   const [email, setEmail] = useState("");

//   const onEmailChange = ({ target: { value } }) => setEmail(value);

//   const emailInput = (
//     <div>
//       <label className="form-label" htmlFor="emailInput">
//         Email address
//       </label>
//       <input
//         placeholder="name@example.com"
//         onChange={onEmailChange}
//         className="form-control"
//         id="emailInput"
//         value={email}
//         type="email"
//       />
//     </div>
//   );

//   const [checked, setChecked] = useState(true);

//   const onCheckedChange = ({ target: { checked: nextChecked } }) =>
//     setChecked(nextChecked);

//   const checkedInput = (
//     <FormCheck onChange={onCheckedChange} checked={checked}>
//       Active
//     </FormCheck>
//   );

//   const createNewUser = () => {
//     const newUser = { groups: [...checkedGroups], active: checked, id: email };

//     setNewUsers((array) => [...array, newUser]);

//     setCheckedGroups(new Set());

//     setChecked(true);

//     setEmail("");
//   };

//   const [newUsers, setNewUsers] = useState([]);

//   const takenEmails = new Set(newUsers.map(({ id }) => id));

//   const isEmailAvailable = !takenEmails.has(email);

//   const isSubmitDisabled = !email || !isEmailAvailable;

//   const createUserBtn = (
//     <div>
//       <button
//         className="btn btn-primary"
//         disabled={isSubmitDisabled}
//         onClick={createNewUser}
//         type="button"
//       >
//         Create new user
//       </button>
//     </div>
//   );

//   const loadUser = (userId) => {
//     const userRecord = newUsers.find(({ id }) => id === userId);

//     setEmail(userRecord.id);

//     setChecked(userRecord.active);

//     setCheckedGroups(new Set(userRecord.groups));
//   };

//   const modifyUser = () => {
//     const newRecord = {
//       groups: [...checkedGroups],
//       active: checked,
//       id: email,
//     };

//     setNewUsers((arr) =>
//       arr.map((element) => (element.id === email ? newRecord : element))
//     );

//     setEmail("");

//     setChecked(true);

//     setCheckedGroups(new Set());
//   };

//   const modifyUserBtn = (
//     <div>
//       <button
//         disabled={isEmailAvailable}
//         className="btn btn-primary"
//         onClick={modifyUser}
//         type="button"
//       >
//         Modify user
//       </button>
//     </div>
//   );

//   return (
//     <>
//       <div className="d-flex flex-column gap-3 p-3 border rounded">
//         <div className="fs-3 lh-1">New user</div>
//         {emailInput}
//         {checkedInput}
//         {
//           <div className="overflow-y-scroll" style={{ height: 150 }}>
//             {groupCheckboxes}
//           </div>
//         }
//         <div className="d-flex flex-wrap gap-2">
//           {createUserBtn}
//           {modifyUserBtn}
//         </div>
//       </div>
//       <div className="p-3 border rounded">
//         {newUsers.map(({ id }) => (
//           <div onClick={() => loadUser(id)} key={id}>
//             {id}
//           </div>
//         ))}
//       </div>
//       <div>
//         <button
//           className="btn btn-primary"
//           disabled={resetDisabled}
//           onClick={reset}
//           type="button"
//         >
//           Reset
//         </button>
//       </div>
//       {reportsGrid}
//       {activeReportGrid}
//       {activeUserGrid}
//     </>
//   );
// }

// export default function App() {
//   const [reportClicked, setReportClicked] = useState();

//   const handleReportClicked = (e) => {
//     setReportClicked((row) =>
//       !row ? e : e.data.id === row.data.id ? null : e
//     );

//     setUserClicked(null);
//   };

//   const reportId = reportClicked ? reportClicked.data.id : null;

//   const handleReportId = () => {
//     const groupsSet = new Set(
//       reportGroups
//         .filter(({ report }) => report === reportId)
//         .map(({ group }) => group)
//     );

//     const usersByReport = userGroups.filter(({ group }) =>
//       groupsSet.has(group)
//     );

//     const store = {};

//     usersByReport.forEach(({ group, user }) => {
//       if (!(user in store)) {
//         store[user] = {
//           data: users.find(({ id }) => id === user),
//           groups: new Set(),
//         };
//       }

//       store[user].groups.add(group);
//     });

//     const activeReport = reports.find(({ id }) => id === reportId);

//     return {
//       rows: Object.values(store).map(({ groups: set, data }) => ({
//         ...data,
//         groups: [...set].join(", "),
//       })),
//       pinned: { ...activeReport, groups: [...groupsSet].join(", ") },
//     };
//   };

//   const activeReportTable = reportId
//     ? handleReportId()
//     : { pinned: {}, rows: [] };

//   const [userClicked, setUserClicked] = useState();

//   const handleUserClicked = (e) => {
//     setUserClicked((row) => (!row ? e : e.data.id === row.data.id ? null : e));

//     setReportClicked(null);
//   };

//   const userId = userClicked ? userClicked.data.id : null;

//   const handleUserId = () => {
//     const groupsSet = new Set(
//       userGroups.filter(({ user }) => user === userId).map(({ group }) => group)
//     );

//     const reportsByUser = reportGroups.filter(({ group }) =>
//       groupsSet.has(group)
//     );

//     const store = {};

//     reportsByUser.forEach(({ report, group }) => {
//       if (!(report in store)) {
//         store[report] = {
//           data: reports.find(({ id }) => id === report),
//           groups: new Set(),
//         };
//       }

//       store[report].groups.add(group);
//     });

//     const activeUser = users.find(({ id }) => id === userId);

//     return {
//       rows: Object.values(store).map(({ groups: set, data }) => ({
//         ...data,
//         groups: [...set].join(", "),
//       })),
//       pinned: { ...activeUser, groups: [...groupsSet].join(", ") },
//     };
//   };

//   const activeUserTable = userId ? handleUserId() : { pinned: {}, rows: [] };

//   const reset = () => {
//     setReportClicked(null);

//     setUserClicked(null);
//   };

//   const resetDisabled = !reportClicked && !userClicked;

//   // if no reportId or userId is active, show list of reports

//   // if some reportId is active, show list of users that can access said report...
//   // ...based on the groups they are in that grant them access

//   // if some userId is active, show list of reports that said user can access...
//   // ...due to the groups they are in granting them access

//   const dynamicGrids = [
//     {
//       onRowClicked: handleUserClicked,
//       clickedRow: reportClicked,
//       table: activeReportTable,
//       displays: "Users",
//     },
//     {
//       onRowClicked: handleReportClicked,
//       clickedRow: userClicked,
//       table: activeUserTable,
//       displays: "Reports",
//     },
//   ];

//   const dynamicGridElements = dynamicGrids.map(
//     ({ onRowClicked, clickedRow, displays, table }) => {
//       return (
//         clickedRow && (
//           <Fragment key={displays}>
//             {sortByValueOrder(
//               Object.entries(table.pinned).map(([field, value]) => ({
//                 field,
//                 value,
//               }))
//             ).map(({ field, value }, index, array) => {
//               const typeCol = array.find(({ field: f }) => f === "type");

//               const displayField =
//                 field === "id" && typeCol ? `${typeCol.value} ${field}` : field;

//               const contents =
//                 field === "id" ? (
//                   <b>{`${displayField}: ${value}`}</b>
//                 ) : (
//                   <>{`${displayField}: ${value}`}</>
//                 );

//               return field !== "type" && <p key={field}>{contents}</p>;
//             })}
//             <p>
//               <u>{displays}</u>
//             </p>
//             <div style={{ height: 500 }}>
//               <AgGridReact
//                 columnDefs={getColDefs(table.rows)}
//                 onRowClicked={onRowClicked}
//                 rowData={table.rows}
//               />
//             </div>
//           </Fragment>
//         )
//       );
//     }
//   );

//   return (
//     <>
//       <div>
//         <button
//           className="btn btn-primary"
//           disabled={resetDisabled}
//           onClick={reset}
//           type="button"
//         >
//           Reset
//         </button>
//       </div>
//       {resetDisabled && (
//         <>
//           <p>
//             <u>All reports</u>
//           </p>
//           <div style={{ height: 500 }}>
//             <AgGridReact
//               onRowClicked={handleReportClicked}
//               columnDefs={getColDefs(reports)}
//               rowData={reports}
//             />
//           </div>
//         </>
//       )}
//       {dynamicGridElements}
//     </>
//   );
// }
