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

// update formRenderer, primaryColDefs, secondaryColDefs, primaryDataAccessor, & secondaryDataAccessor

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
  secondaryUrlGetter: (rowId) => (rowId ? `${url}/user_api/${rowId}` : null),
  primaryUrl: `${url}/all_users`,
  primaryGroupsKey: "groups",
  formRenderer: ReportEditor,
  secondaryLabel: "Reports",
  primaryIdKey: "user_id",
  primaryLabel: "Users",
};

export default function App() {
  return <GridsPage {...tab1Props}></GridsPage>;
}
