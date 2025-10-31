import { useState, useMemo } from "react";

import ReportEditor from "./components/ReportEditor";
import GridsPage from "./components/GridsPage";
import usePromise from "./hooks/usePromise";

const url = "https://irserver2.eku.edu/Apps/DataPage/PROD/auth";

const tab1Props = {
  primaryDataAccessor: (data) =>
    data
      ? Object.entries(data).map(([user_id, { user_active, groups }]) => ({
          groups: !Array.isArray(groups)
            ? null
            : groups.map(({ acl_report_id }) => acl_report_id).join(),
          user_active,
          user_id,
        }))
      : null,
  secondaryColDefs: [
    { field: "report_active" },
    { field: "report_id" },
    { field: "report_title" },
    { field: "report_link" },
  ],
  secondaryUrlGetter: (rowId) => (rowId ? `${url}/user_api/${rowId}` : null),
  primaryColDefs: [{ field: "user_active" }, { field: "user_id" }],
  secondaryDataAccessor: (data) => (data ? data.Reports : null),
  primaryUrl: `${url}/all_users`,
  primaryGroupsKey: "groups",
  formRenderer: ReportEditor,
  secondaryLabel: "Reports",
  primaryIdKey: "user_id",
  primaryLabel: "Users",
};

const tab2Props = {
  secondaryColDefs: [
    { field: "user_id" },
    {
      valueFormatter: ({ value }) =>
        [value]
          .filter((el) => el)
          .flat()
          .join(", "),
      field: "Groups",
    },
  ],
  primaryColDefs: [
    { field: "report_active" },
    { field: "report_id" },
    { field: "report_title" },
    { field: "report_link" },
  ],
  secondaryUrlGetter: (rowId) =>
    rowId ? `${url}/report_access_api/${rowId}` : null,
  primaryUrl: `${url}/reports_list_api`,
  primaryGroupsKey: "report_groups",
  formRenderer: ReportEditor,
  primaryIdKey: "report_id",
  primaryLabel: "Reports",
  secondaryLabel: "Users",
};

const Tab1 = () => <GridsPage {...tab1Props}></GridsPage>;

const Tab2 = () => <GridsPage {...tab2Props}></GridsPage>;

const Tab3 = () => <></>;

const tabs = [
  { Component: Tab1, label: "Users", id: 0 },
  { label: "Reports", Component: Tab2, id: 1 },
  { label: "Groups", Component: Tab3, id: 2 },
];

// all groups from reports even on users tab
// extra edit layer
// search each grid
// https://irserver2.eku.edu/Apps/DataPage/PROD/auth/all_report_groups_api

const getJsonPromise = (url) => fetch(url).then((response) => response.json());

const promises = [
  { url: `${url}/all_users`, id: "users" },
  { url: `${url}/reports_list_api`, id: "reports" },
  { url: `${url}/all_report_groups_api`, id: "groups" },
];

const entireDataPromise = Promise.all(
  promises.map(({ url }) => getJsonPromise(url))
);

const makeArray = (param) => [param].filter((el) => el).flat();

// what should we send back?
// are we sending back the entire datasets, or individual records?
// and, if we are toggling a group on for a user, and we are sending users back in their original format,
// then what about the extra info attached to each user group?
// since the all groups route doesn't come with this info, it can't be inferred

// group
// checklist of users
// checklist of reports

// [
// {
// name:"users",
// value:"some user id",
// group:"some group id",
// checked:boolean
// },
// ...,
// ]

// need to read acl_active properly (checked only if Y)
// can still send individual records back, but will need to send user groups back with acl_active: Y, acl_flags: null, acl_group_ind: Y
// user example--
/*
{
  "CHAD.Adkins@eku.edu": {
    "groups": [
      {
        "acl_active": "Y",
        "acl_flags": null,
        "acl_group_ind": "Y",
        "acl_report_id": "CHAIRS"
      },
      {
        "acl_active": "Y",
        "acl_flags": null,
        "acl_group_ind": "Y",
        "acl_report_id": "ENROLLMENTREPORT"
      },
      {
        "acl_active": "Y",
        "acl_flags": null,
        "acl_group_ind": "Y",
        "acl_report_id": "FACULTYWORKLOAD"
      },
      {
        "acl_active": "Y",
        "acl_flags": null,
        "acl_group_ind": "Y",
        "acl_report_id": "NETREVENUE"
      },
      {
        "acl_active": "Y",
        "acl_flags": null,
        "acl_group_ind": "Y",
        "acl_report_id": "ADDED_GROUP"
      }
    ],
    "user_active": "Y"
  }
}
*/

// updated user with id
// send back user with id in it's updated form

// updated report with id
// send back report with id in it's updated form

export default function App() {
  const datasets = usePromise(entireDataPromise);

  const allData = useMemo(() => {
    if (Array.isArray(datasets)) {
      const groupsTable = {};

      // const payload = datasets.map((data, i) => {
      //   const id = promises[i].id;

      //   if (id === "users") {
      //     const rowData = Object.entries(data).map(([user_id, row]) => ({
      //       user_id,
      //       ...row,
      //     }));

      //     const list = Object.keys(data);

      //     const set = new Set(list);

      //     return { data: rowData, table: data, list, set, id };
      //   }

      //   if (id === "reports") {
      //     const table = Object.fromEntries(
      //       data.map(({ report_id, ...rest }) => [report_id, rest])
      //     );

      //     const list = Object.keys(table);

      //     const set = new Set(list);

      //     return { table, data, list, set, id };
      //   }

      //   if (id === "groups") {
      //     return { set: new Set(data), list: data, id };
      //   }
      // });

      const usersDataset =
        datasets[promises.findIndex(({ id }) => id === "users")];

      const usersTable = Object.fromEntries(
        Object.entries(usersDataset).map(([id, original]) => [
          id,
          {
            groups: new Set(
              makeArray(original.groups).map(
                ({ acl_report_id }) => acl_report_id
              )
            ),
            original,
            id,
          },
        ])
      );

      Object.values(usersTable).forEach(({ groups, id }) => {
        groups.forEach((group) => {
          if (!(group in groupsTable)) {
            groupsTable[group] = {
              reports: new Set(),
              users: new Set(),
              id: group,
            };
          }

          groupsTable[group].users.add(id);
        });
      });

      const reportsDataset =
        datasets[promises.findIndex(({ id }) => id === "reports")];

      const reportsTable = Object.fromEntries(
        reportsDataset.map((original) => [
          original.report_id,
          {
            groups: new Set(
              typeof original.report_groups === "string"
                ? original.report_groups.split(",")
                : []
            ),
            id: original.report_id,
            original,
          },
        ])
      );

      Object.values(reportsTable).forEach(({ groups, id }) => {
        groups.forEach((group) => {
          if (!(group in groupsTable)) {
            groupsTable[group] = {
              reports: new Set(),
              users: new Set(),
              id: group,
            };
          }

          groupsTable[group].reports.add(id);
        });
      });

      return { reportsTable, groupsTable, usersTable };
      // return payload;
    }

    return { reportsTable: {}, groupsTable: {}, usersTable: {} };
  }, [datasets]);

  const [selectedGroup, setSelectedGroup] = useState(null);

  const [checkboxQueue, setCheckboxQueue] = useState([]);

  const groupRecord = allData.groupsTable[selectedGroup];

  const groupRecordState = useMemo(() => {
    const state = { ...groupRecord };

    state.users = new Set(state.users);

    state.reports = new Set(state.reports);

    checkboxQueue.forEach(({ checked, value, name }) => {
      if (checked) {
        state[name].add(value);
      } else {
        state[name].delete(value);
      }
    });

    return state;
  }, [checkboxQueue, groupRecord]);

  const handleCheck = (e) =>
    setCheckboxQueue((arr) => {
      const caught = arr.find(
        ({ value, name }) => name === e.name && value === e.value
      );

      if (caught) {
        return arr.filter((el) => el !== caught);
      }

      return [...arr, e];
    });

  const isChecked = ({ value, name }) => groupRecordState[name].has(value);

  const locateUpdatedRecords = () => {
    const name2Table = {
      reports: allData.reportsTable,
      users: allData.usersTable,
    };

    return checkboxQueue.map((payload) => {
      const record = name2Table[payload.name][payload.value].original;

      const { original } = record;

      const updated = { ...original };

      if (payload.name === "users") {
      }

      return {
        payload,
        record,
      };
    });
  };

  // const propagateGroup = ({ reports, users, id }) => {};

  console.log(allData);

  const [tabId, setTabId] = useState(0);

  const selectedTab = tabs.find(({ id }) => id === tabId);

  const { Component } = selectedTab;

  return (
    <>
      <div>
        <div className="btn-group" role="group">
          {tabs.map(({ label, id }) => (
            <button
              className={["btn btn-primary", tabId === id && "active"]
                .filter((el) => el)
                .join(" ")}
              onClick={() => setTabId(id)}
              type="button"
              key={id}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <Component></Component>
    </>
  );
}
