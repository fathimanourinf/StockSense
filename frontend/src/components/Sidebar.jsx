import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Nav structure matches the spec exactly: Dashboard, Products, the four
// operation types, Move History, Settings > Warehouses, Profile menu.
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/products", label: "Products", icon: "📦" },
  { to: "/receipts", label: "Receipts", icon: "📥" },
  { to: "/deliveries", label: "Delivery Orders", icon: "📤" },
  { to: "/transfers", label: "Internal Transfers", icon: "🔁" },
  { to: "/adjustments", label: "Adjustments", icon: "⚖️" },
  { to: "/move-history", label: "Move History", icon: "📜" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
      isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-100">
        <h1 className="text-lg font-bold text-brand-700">StockSense</h1>
        <p className="text-xs text-slate-400">Inventory Management</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <p className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-400 uppercase">Settings</p>
        <NavLink to="/warehouses" className={linkClass}>
          <span>🏬</span>
          Warehouses
        </NavLink>
      </nav>

      <div className="px-3 py-4 border-t border-slate-100 space-y-1">
        <NavLink to="/profile" className={linkClass}>
          <span>👤</span>
          My Profile
        </NavLink>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <span>🚪</span>
          Logout
        </button>
        {user && (
          <div className="px-3 pt-2 text-xs text-slate-400 truncate">{user.email}</div>
        )}
      </div>
    </aside>
  );
}
