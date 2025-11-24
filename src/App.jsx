import useAdmin from "./AdminContext/useAdmin";

// all groups from reports even on users tab
// extra edit layer
// search each grid
// https://irserver2.eku.edu/Apps/DataPage/PROD/auth/all_report_groups_api

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

// don't display
// -- data_moved

export default function App() {
  const { quickFilter, btnGroup, dataGrid, modal } = useAdmin();

  return (
    <>
      <div className="d-flex gap-3 flex-wrap">
        {btnGroup}
        {quickFilter}
      </div>
      {dataGrid}
      {modal}
    </>
  );
}
