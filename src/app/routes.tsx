import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { AttendanceList } from "./pages/AttendanceList";
import { ProfileDetails } from "./pages/ProfileDetails";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "attendance", Component: AttendanceList },
      { path: "profile/:id", Component: ProfileDetails },
    ],
  },
]);
