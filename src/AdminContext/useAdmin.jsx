import { useContext } from "react";

import AdminContext from "./AdminContext";

const useAdmin = () => useContext(AdminContext);

export default useAdmin;
