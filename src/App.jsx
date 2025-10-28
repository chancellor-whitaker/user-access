import { useState } from "react";

import ReportEditor from "./components/ReportEditor";
import GridsPage from "./components/GridsPage";

const url = "https://irserver2.eku.edu/Apps/DataPage/PROD/auth";

const tab1Props = {
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

const tab2Props = {
  primaryDataAccessor: (data) =>
    data
      ? Object.entries(data).map(([user_id, object]) => ({
          user_id,
          ...object,
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
  secondaryLabel: "Reports",
  primaryIdKey: "user_id",
  primaryLabel: "Users",
};

const tabs = [
  { label: "Reports", props: tab1Props, id: 0 },
  { props: tab2Props, label: "Users", id: 1 },
];

export default function App() {
  const [tabId, setTabId] = useState(0);

  const selectedTab = tabs.find(({ id }) => id === tabId);

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
      <GridsPage {...selectedTab.props}></GridsPage>
    </>
  );
}
