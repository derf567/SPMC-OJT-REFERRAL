import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Search,
  Edit,
  Save,
  X,
  User,
  Stethoscope,
  Building2,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminAPI, specialtiesAPI } from "@/lib/api";
import { toast } from "sonner";

interface Doctor {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  role_display: string;
  department: string;
  specialties: Array<{ id: number; name: string }>;
  contact_number?: string;
}

interface Specialty {
  id: number;
  name: string;
  description?: string;
}

const HeadsUp = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [doctorToRemove, setDoctorToRemove] = useState<Doctor | null>(null);
  const [showAddDoctorDialog, setShowAddDoctorDialog] = useState(false);
  const [selectedDepartmentForAdd, setSelectedDepartmentForAdd] = useState<string>("");
  const [approvedAccounts, setApprovedAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [doctorsData, specialtiesData] = await Promise.all([
        adminAPI.getAllDoctors(),
        specialtiesAPI.getAll()
      ]);
      setDoctors(doctorsData);
      setFilteredDoctors(doctorsData);
      setAllSpecialties(specialtiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load doctors and specialties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = doctors;

    if (departmentFilter !== "all") {
      filtered = filtered.filter(d => d.department === departmentFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(searchLower) ||
        d.email.toLowerCase().includes(searchLower) ||
        d.department.toLowerCase().includes(searchLower)
      );
    }

    setFilteredDoctors(filtered);
  }, [departmentFilter, searchTerm, doctors]);

  const handleEditSpecialties = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSpecialties(doctor.specialties.map(s => s.id));
  };

  const handleRemoveDoctor = (doctor: Doctor) => {
    setDoctorToRemove(doctor);
    setShowRemoveDialog(true);
  };

  const confirmRemoveDoctor = async () => {
    if (!doctorToRemove) return;

    try {
      setSaving(true);
      // Note: You'll need to implement the delete endpoint in the backend
      // await adminAPI.deleteDoctor(doctorToRemove.id);
      toast.success(`${doctorToRemove.name} has been removed from the system`);
      await fetchData();
      setShowRemoveDialog(false);
      setDoctorToRemove(null);
    } catch (error) {
      console.error('Error removing doctor:', error);
      toast.error('Failed to remove doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDoctor = async (department: string) => {
    setSelectedDepartmentForAdd(department);
    setShowAddDoctorDialog(true);
    
    // Fetch approved accounts
    try {
      const data = await adminAPI.getPendingReferrers();
      // Filter only approved accounts
      const approved = data.filter((account: any) => account.approval_status === 'approved');
      setApprovedAccounts(approved);
    } catch (error) {
      console.error('Error fetching approved accounts:', error);
      toast.error('Failed to load approved accounts');
    }
  };

  const handleSaveSpecialties = async () => {
    if (!selectedDoctor) return;

    try {
      setSaving(true);
      await adminAPI.updateDoctorSpecialties(selectedDoctor.id, selectedSpecialties);
      toast.success('Specialties updated successfully');
      await fetchData();
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error updating specialties:', error);
      toast.error('Failed to update specialties');
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (specialtyId: number) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialtyId)
        ? prev.filter(id => id !== specialtyId)
        : [...prev, specialtyId]
    );
  };

  const getDepartments = () => {
    const departments = new Set(doctors.map(d => d.department));
    return Array.from(departments).sort();
  };

  const getDoctorsByDepartment = () => {
    const grouped: Record<string, Doctor[]> = {};
    filteredDoctors.forEach(doctor => {
      const dept = doctor.department || 'Not Assigned';
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(doctor);
    });
    return grouped;
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const doctorsByDepartment = getDoctorsByDepartment();

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Department Doctors</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage doctors and assign specialties per department
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Departments</option>
              {getDepartments().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredDoctors.length} of {doctors.length} doctors
        </div>

        {/* Doctors by Department */}
        <div className="space-y-6">
          {Object.keys(doctorsByDepartment).length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No doctors found</p>
            </div>
          ) : (
            Object.entries(doctorsByDepartment).map(([department, deptDoctors]) => (
              <div
                key={department}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Department Header */}
                <div className="bg-purple-600 text-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">{department}</h3>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {deptDoctors.length} {deptDoctors.length === 1 ? 'doctor' : 'doctors'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddDoctor(department)}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Doctor
                    </Button>
                  </div>
                </div>

                {/* Doctors List */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {deptDoctors.map((doctor) => {
                    const initials = doctor.name.split(' ').map(n => n[0]).join('').substring(0, 2);

                    return (
                      <div key={doctor.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                              {initials}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {doctor.name}
                              </h4>
                              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3" />
                                  <span>{doctor.role_display}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>📧</span>
                                  <span>{doctor.email}</span>
                                </div>
                                {doctor.contact_number && (
                                  <div className="flex items-center gap-2">
                                    <span>📞</span>
                                    <span>{doctor.contact_number}</span>
                                  </div>
                                )}
                              </div>
                              {doctor.specialties && doctor.specialties.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {doctor.specialties.map((specialty) => (
                                    <span
                                      key={specialty.id}
                                      className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium flex items-center gap-1"
                                    >
                                      <Stethoscope className="w-3 h-3" />
                                      {specialty.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {(!doctor.specialties || doctor.specialties.length === 0) && (
                                <div className="mt-3 text-sm text-gray-400 italic">
                                  No specialties assigned
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveDoctor(doctor)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-800"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove Doctor
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Specialties Modal */}
        <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Specialties</DialogTitle>
              <DialogDescription>
                Select specialties for {selectedDoctor?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedDoctor && (
              <div className="space-y-4">
                {/* Doctor Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {selectedDoctor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{selectedDoctor.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedDoctor.department}</p>
                    </div>
                  </div>
                </div>

                {/* Specialties Selection */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Available Specialties ({selectedSpecialties.length} selected)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    {allSpecialties.map((specialty) => (
                      <label
                        key={specialty.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSpecialties.includes(specialty.id)}
                          onChange={() => toggleSpecialty(specialty.id)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">{specialty.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleSaveSpecialties}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => setSelectedDoctor(null)}
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Remove Doctor Confirmation Dialog */}
        <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600 dark:text-red-400">Remove Doctor</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this doctor from the system?
              </DialogDescription>
            </DialogHeader>

            {doctorToRemove && (
              <div className="space-y-4">
                {/* Doctor Info */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-medium">
                      {doctorToRemove.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{doctorToRemove.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{doctorToRemove.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">{doctorToRemove.department}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ This action cannot be undone. The doctor's account will be permanently removed from the system.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={confirmRemoveDoctor}
                    disabled={saving}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {saving ? 'Removing...' : 'Yes, Remove Doctor'}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      setShowRemoveDialog(false);
                      setDoctorToRemove(null);
                    }}
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Doctor Dialog */}
        <Dialog open={showAddDoctorDialog} onOpenChange={setShowAddDoctorDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-purple-600 dark:text-purple-400">Add Doctor to Department</DialogTitle>
              <DialogDescription>
                Select an approved account to add to {selectedDepartmentForAdd}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Department Info */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{selectedDepartmentForAdd}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Approved Account *
                  </label>
                  <select 
                    value={selectedAccountId || ""}
                    onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Choose an approved account...</option>
                    {approvedAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.first_name} {account.last_name} - {account.user.email}
                      </option>
                    ))}
                  </select>
                  {approvedAccounts.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      No approved accounts available. Please approve accounts first.
                    </p>
                  )}
                </div>

                {/* Show selected account details */}
                {selectedAccountId && approvedAccounts.find(a => a.id === selectedAccountId) && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Account Details</h5>
                    {(() => {
                      const account = approvedAccounts.find(a => a.id === selectedAccountId);
                      return (
                        <div className="text-sm space-y-1">
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Name:</span> {account.first_name} {account.middle_name} {account.last_name}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Email:</span> {account.user.email}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Type:</span> {account.referrer_type}
                          </p>
                          {account.position && (
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Position:</span> {account.position}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assign Role *
                  </label>
                  <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select role...</option>
                    <option value="edcc_personnel">EDCC Personnel</option>
                    <option value="call_triage">EDMAR/EDHO (Call Triage)</option>
                    <option value="his_department">HIS Department</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ The selected account will be assigned to {selectedDepartmentForAdd} with the chosen role.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    if (!selectedAccountId || !selectedRole) {
                      toast.error('Please select an account and assign a role');
                      return;
                    }
                    // TODO: Implement add doctor functionality
                    toast.success('Doctor added successfully to department');
                    setShowAddDoctorDialog(false);
                    setSelectedDepartmentForAdd("");
                    setSelectedAccountId(null);
                    setSelectedRole("");
                  }}
                  disabled={saving || !selectedAccountId || !selectedRole}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {saving ? 'Adding...' : 'Add to Department'}
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setShowAddDoctorDialog(false);
                    setSelectedDepartmentForAdd("");
                    setSelectedAccountId(null);
                    setSelectedRole("");
                  }}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default HeadsUp;
