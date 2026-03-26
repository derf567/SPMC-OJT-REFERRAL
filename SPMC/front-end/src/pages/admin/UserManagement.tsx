import { useState, useMemo, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Pencil, ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw, UserX, Eye, EyeOff, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminAPI } from "@/lib/api";
import { toast } from "sonner";

interface UserRecord {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_display: string;
  edcc_edma_indicator: string;
  hospital: string;
  department: string;
  created_at: string;
  is_active: 0 | 1;
}

const ROLE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Referrer", value: "referrer" },
  { label: "EDCC", value: "edcc" },
  { label: "EDMA", value: "edma" },
  { label: "Doctor", value: "doctor" },
] as const;

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  referrer:      { label: "Referrer",      className: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
  edcc:          { label: "EDCC",          className: "bg-purple-500/20 text-purple-600 border-purple-500/30" },
  edma:          { label: "EDMA",          className: "bg-indigo-500/20 text-indigo-600 border-indigo-500/30" },
  doctor:        { label: "Doctor",        className: "bg-green-500/20 text-green-600 border-green-500/30" },
  unknown:       { label: "Unknown",       className: "bg-gray-500/20 text-gray-600 border-gray-500/30" },
};

const DEPARTMENT_LABELS: Record<string, string> = {
  emergency: "Emergency Department",
  internal_medicine: "Internal Medicine",
  surgery: "Surgery Department",
  obstetrics_gynecology: "Obstetrics and Gynecology",
  pediatrics: "Pediatrics",
  orthopedics: "Orthopedics",
  cardiology: "Cardiology",
  neurology: "Neurology",
  anesthesiology: "Anesthesiology",
  radiology: "Radiology",
  pathology: "Pathology",
  other: "Other Department",
};

type SortField = "username" | "email" | "full_name" | "role" | "department" | "is_active";
type SortDir = "asc" | "desc";

const UserManagement = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({ username: "", email: "", first_name: "", last_name: "", role: "", password: "", confirm_password: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("username");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchUsers = async (inactive = showInactive) => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllUsers(!inactive);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(showInactive); }, [showInactive]);

  const handleDelete = async (user: UserRecord) => {
    if (!confirm(`Remove "${user.full_name || user.username}" from the list? Their account will be deactivated.`)) return;
    try {
      setActionLoading(user.id);
      await adminAPI.deactivateUser(user.id);
      toast.success(`${user.full_name || user.username}'s account has been deactivated`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      toast.error(err?.message || "Failed to deactivate account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (user: UserRecord) => {
    try {
      setActionLoading(user.id);
      await adminAPI.reactivateUser(user.id);
      toast.success(`${user.full_name || user.username}'s account has been reactivated`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      toast.error(err?.message || "Failed to reactivate account");
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (user: UserRecord) => {
    setIsCreating(false);
    setEditUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      password: "",
      confirm_password: "",
    });
    setShowPassword(false);
    setShowConfirm(false);
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditUser({ id: 0 } as UserRecord);
    setEditForm({ username: "", email: "", first_name: "", last_name: "", role: "referrer", password: "", confirm_password: "" });
    setShowPassword(false);
    setShowConfirm(false);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    if (editForm.password && editForm.password !== editForm.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setEditLoading(true);

      if (isCreating) {
        if (!editForm.password) { toast.error("Password is required"); return; }
        const res = await adminAPI.createUser({
          username: editForm.username,
          email: editForm.email,
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          role: editForm.role,
          password: editForm.password,
          confirm_password: editForm.confirm_password,
        });
        toast.success(res.message || "Account created successfully");
        setUsers((prev) => [res.user, ...prev]);
      } else {
        const payload: Record<string, string> = {
          username: editForm.username,
          email: editForm.email,
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          role: editForm.role,
        };
        if (editForm.password) {
          payload.password = editForm.password;
          payload.confirm_password = editForm.confirm_password;
        }
        const res = await adminAPI.updateUser(editUser.id, payload);
        toast.success(res.message || "User updated successfully");
        setUsers((prev) => prev.map((u) => u.id === editUser.id ? {
          ...u,
          username: res.user.username,
          email: res.user.email,
          first_name: res.user.first_name,
          last_name: res.user.last_name,
          full_name: res.user.full_name,
          role: editForm.role,
          role_display: ROLE_BADGE[editForm.role]?.label ?? editForm.role,
        } : u));
      }

      setEditUser(null);
    } catch (err: any) {
      toast.error(err?.message || (isCreating ? "Failed to create account" : "Failed to update user"));
    } finally {
      setEditLoading(false);
    }
  };
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => {
        const roleMatch = roleFilter === "all" || u.role === roleFilter;
        if (!roleMatch) return false;
        if (!q) return true;
        return (
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.full_name.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === "username")   cmp = a.username.localeCompare(b.username);
        else if (sortField === "email") cmp = a.email.localeCompare(b.email);
        else if (sortField === "full_name") cmp = a.full_name.localeCompare(b.full_name);
        else if (sortField === "role")  cmp = a.role.localeCompare(b.role);
        else if (sortField === "department") cmp = a.department.localeCompare(b.department);
        else if (sortField === "is_active")  cmp = b.is_active - a.is_active;
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [users, search, roleFilter, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 text-purple-500" />
      : <ChevronDown className="w-3.5 h-3.5 text-purple-500" />;
  };

  const ThBtn = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors whitespace-nowrap"
    >
      {children}
      <SortIcon field={field} />
    </button>
  );

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-500 dark:text-gray-400">View and manage all system accounts</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={openCreate}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <UserPlus className="w-4 h-4" />
              Add Account
            </Button>
            <Button
              variant={showInactive ? "default" : "outline"}
              size="sm"
              onClick={() => { setShowInactive(!showInactive); setSearch(""); setRoleFilter("all"); }}
              className={`flex items-center gap-2 ${showInactive ? "bg-red-600 hover:bg-red-700 text-white border-red-600" : ""}`}
            >
              <UserX className="w-4 h-4" />
              Inactive Accounts
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchUsers(showInactive)} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by username, email, name, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setRoleFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === f.value
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          {showInactive ? "Inactive accounts — " : "Active accounts — "}
          Showing {filtered.length} of {users.length} users
        </p>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="px-4 py-3 text-left"><ThBtn field="username">Username</ThBtn></th>
                  <th className="px-4 py-3 text-left"><ThBtn field="email">Email Address</ThBtn></th>
                  <th className="px-4 py-3 text-left"><ThBtn field="full_name">Name</ThBtn></th>
                  <th className="px-4 py-3 text-left"><ThBtn field="role">Role</ThBtn></th>
                  <th className="px-4 py-3 text-left"><ThBtn field="department">Department</ThBtn></th>
                  <th className="px-4 py-3 text-left"><ThBtn field="is_active">Status</ThBtn></th>
                  <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => {
                    const badge = ROLE_BADGE[user.role] ?? ROLE_BADGE.unknown;
                    const deptLabel = DEPARTMENT_LABELS[user.department] || user.department || null;

                    return (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">

                        {/* Username */}
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {user.username}
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {user.email || <span className="italic text-gray-400">—</span>}
                        </td>

                        {/* Name */}
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          {user.full_name || <span className="italic text-gray-400">—</span>}
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <Badge className={`${badge.className} border text-xs`}>{badge.label}</Badge>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {deptLabel || <span className="italic text-gray-400">—</span>}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.is_active === 1
                              ? "bg-green-500/15 text-green-600 dark:text-green-400"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.is_active === 1 ? "bg-green-500" : "bg-gray-400"}`} />
                            {user.is_active === 1 ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {showInactive ? (
                              <Button
                                size="sm"
                                className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleReactivate(user)}
                                disabled={actionLoading === user.id}
                              >
                                {actionLoading === user.id ? "..." : "Activate Account"}
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-xs border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:text-purple-600"
                                  onClick={() => openEdit(user)}
                                >
                                  <Pencil className="w-3.5 h-3.5 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-xs border-gray-300 dark:border-gray-600 hover:border-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                  onClick={() => handleDelete(user)}
                                  disabled={actionLoading === user.id}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  {actionLoading === user.id ? "..." : "Delete"}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Add Account" : "Edit User"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role <span className="text-red-500">*</span></label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="referrer">Referrer</option>
                <option value="edcc">EDCC</option>
                <option value="edma">EDMA</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password{" "}
                {isCreating
                  ? <span className="text-red-500">*</span>
                  : <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={editForm.password}
                  onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={editForm.confirm_password}
                  onChange={(e) => setEditForm((f) => ({ ...f, confirm_password: e.target.value }))}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditUser(null)} disabled={editLoading}>Cancel</Button>
              <Button onClick={handleEditSave} disabled={editLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
                {editLoading ? (isCreating ? "Creating..." : "Saving...") : (isCreating ? "Create Account" : "Save Changes")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
};

export default UserManagement;
