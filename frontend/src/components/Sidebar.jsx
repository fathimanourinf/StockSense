import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/products", label: "Products" },
  { to: "/receipts", label: "Receipts" },
  { to: "/deliveries", label: "Delivery Orders" },
  { to: "/transfers", label: "Internal Transfers" },
  { to: "/adjustments", label: "Adjustments" },
  { to: "/move-history", label: "Move History" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
      isActive ? "nav-active bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-[#f1f6f3] hover:text-slate-900"
    }`;

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-[#e1e9e4] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-100 flex items-center gap-3">
        <span className="h-9 w-9 rounded-lg bg-brand-700 text-white grid place-items-center font-bold">S</span>
        <div>
          <h1 className="text-lg font-bold text-brand-800">StockSense</h1>
          <p className="text-xs text-slate-400">Inventory Management</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <span aria-hidden="true" className="nav-indicator" />
            {item.label}
          </NavLink>
        ))}

        <p className="px-3 pt-5 pb-1 text-[11px] font-semibold text-slate-400 uppercase">Settings</p>
        <NavLink to="/warehouses" className={linkClass}>
          <span aria-hidden="true" className="nav-indicator" />
          Warehouses
        </NavLink>
      </nav>

      <div className="px-3 py-4 border-t border-slate-100 space-y-1">
        <NavLink to="/profile" className={linkClass}>
          <span aria-hidden="true" className="nav-indicator" />
          My Profile
        </NavLink>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-700 hover:bg-rose-50 transition"
        >
          <span aria-hidden="true" className="nav-indicator" />
          Logout
        </button>
        {user && (
          <div className="px-3 pt-2 text-xs text-slate-400 truncate">{user.email}</div>
        )}
      </div>
    </aside>
  );
}
