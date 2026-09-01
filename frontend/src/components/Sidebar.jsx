import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  ChartNoAxesCombined,
  NotebookPen,
  Flame,
  Settings,
  LogOut,
} from "lucide-react";

function Sidebar() {
  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Activities",
      path: "/activities",
      icon: ListChecks,
    },
    {
      name: "Calendar",
      path: "/calendar",
      icon: CalendarDays,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: ChartNoAxesCombined,
    },
    {
      name: "Daily Notes",
      path: "/notes",
      icon: NotebookPen,
    },
  ];

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Flame size={22} />
        </div>

        <div>
          <h2>Life Tracker</h2>
          <p>BUILD BETTER HABITS</p>
        </div>
      </div>


      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="nav-label">
          MENU
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <Icon size={20} />

              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>


      {/* Bottom navigation */}
      <div className="sidebar-bottom">

        <NavLink
          to="/settings"
          className="sidebar-link"
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>


        <button
          className="logout-button"
          type="button"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;