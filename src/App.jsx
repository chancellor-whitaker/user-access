import { AgGridReact } from "ag-grid-react";
import { useState } from "react";

import useData from "./hooks/useData";
// import reports from "./data/reports";
// import groups from "./data/groups";
// import users from "./data/users";

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

export default function App() {
  const [activeUser, setActiveUser] = useState(null);

  const [activeReport, setActiveReport] = useState(null);

  const onReportRowClicked = ({ data: { report_id: reportId } }) => {
    setActiveReport(reportId);

    setActiveUser(null);
  };

  const onUserRowClicked = ({ data: { user_id: userId } }) => {
    setActiveUser(userId);

    setActiveReport(null);
  };

  const reset = () => {
    setActiveReport(null);

    setActiveUser(null);
  };

  const resetDisabled = !activeReport && !activeUser;

  const reportsData = useData(reportsUrl);

  const reportsGrid = resetDisabled && (
    <>
      <div>All reports</div>
      <div style={{ height: 500 }}>
        <AgGridReact
          onRowClicked={onReportRowClicked}
          columnDefs={reportColDefs}
          rowData={reportsData}
        />
      </div>
    </>
  );

  const activeReportUrl = getAccessUrl(activeReport);

  const activeReportData = useData(activeReportUrl);

  const activeReportGrid = activeReport && (
    <>
      <div>Users ({`Active report: ${activeReport}`})</div>
      <div style={{ height: 500 }}>
        <AgGridReact
          onRowClicked={onUserRowClicked}
          rowData={activeReportData}
          columnDefs={userColDefs}
        />
      </div>
    </>
  );

  const activeUserUrl = getUserUrl(activeUser);

  const activeUserData = useData(activeUserUrl);

  const activeUserObject = activeUserData
    ? activeUserData
    : { Reports: [], Groups: [], Active: "", Admin: "" };

  const {
    Active: userActiveStatus,
    Admin: userAdminStatus,
    Reports: userReports,
    Groups: userGroups,
  } = activeUserObject;

  const activeUserGrid = activeUser && (
    <>
      <div>User: {activeUser}</div>
      <div>Active: {userActiveStatus}</div>
      <div>Admin: {userAdminStatus}</div>
      <div>Groups: {userGroups.join()}</div>
      <div>Reports ({`Active user: ${activeUser}`})</div>
      <div style={{ height: 500 }}>
        <AgGridReact
          onRowClicked={onReportRowClicked}
          columnDefs={reportColDefs}
          rowData={userReports}
        />
      </div>
    </>
  );

  return (
    <>
      <div>
        <button
          className="btn btn-primary"
          disabled={resetDisabled}
          onClick={reset}
          type="button"
        >
          Reset
        </button>
      </div>
      {reportsGrid}
      {activeReportGrid}
      {activeUserGrid}
    </>
  );
}

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
