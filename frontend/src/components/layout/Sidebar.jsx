import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  WalletCards,
  Tags,
  User,
  LogOut,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">P</div>

        <span>Pennywise</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <ArrowLeftRight size={20} />
          <span>Transactions</span>
        </NavLink>

        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <WalletCards size={20} />
          <span>Budgets</span>
        </NavLink>

        <NavLink
          to="/categories"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <Tags size={20} />
          <span>Categories</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Logout */}
      <button className="logout-button">
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;
