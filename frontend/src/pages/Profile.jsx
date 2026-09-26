import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
      <div className="card space-y-4">
        <div>
          <p className="label">Name</p>
          <p className="text-slate-800">{user?.name}</p>
        </div>
        <div>
          <p className="label">Email</p>
          <p className="text-slate-800">{user?.email}</p>
        </div>
        <div>
          <p className="label">Role</p>
          <p className="text-slate-800 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
      </div>
    </div>
  );
}
