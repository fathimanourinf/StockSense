// Reused on Dashboard, Receipts, Deliveries, Transfers, Adjustments —
// one component keeps the status colors consistent everywhere.
export default function StatusBadge({ status }) {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
  return <span className={`badge badge-${status}`}>{label}</span>;
}
