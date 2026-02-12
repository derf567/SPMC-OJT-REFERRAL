import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Search,
  User,
  Building2,
  GripVertical,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { adminAPI } from "@/lib/api";
import { toast } from "sonner";

interface Doctor {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  role_display: string;
  department: string | null;
  specialties: Array<{ id: number; name: string }>;
  contact_number?: string;
}

const DEPARTMENTS = [
  { key: "emergency", name: "Emergency Department" },
  { key: "internal_medicine", name: "Internal Medicine" },
  { key: "surgery", name: "Surgery Department" },
  { key: "obstetrics_gynecology", name: "Obstetrics and Gynecology" },
  { key: "pediatrics", name: "Pediatrics" },
  { key: "orthopedics", name: "Orthopedics" },
  { key: "cardiology", name: "Cardiology" },
  { key: "neurology", name: "Neurology" },
  { key: "anesthesiology", name: "Anesthesiology" },
  { key: "radiology", name: "Radiology" },
  { key: "pathology", name: "Pathology" },
  { key: "other", name: "Other Department" },
];

const ROLES = [
  { key: "edcc_personnel", name: "EDCC Personnel" },
  { key: "call_triage", name: "EDMAR/EDHO (Call Triage)" },
  { key: "his_department", name: "HIS Department" },
  { key: "view_only", name: "View Only (Department Doctor)" },
];

const HeadsUpDragDrop = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [unassignedDoctors, setUnassignedDoctors] = useState<Doctor[]>([]);
  const [assignedDoctors, setAssignedDoctors] = useState<Record<string, Doctor[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [draggedDoctor, setDraggedDoctor] = useState<Doctor | null>(null);
  const [dragOverDepartment, setDragOverDepartment] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("edcc_personnel");

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllDoctors();
      setDoctors(data);
      
      // Separate unassigned and assigned doctors
      const unassigned = data.filter((d: Doctor) => !d.department);
      const assigned: Record<string, Doctor[]> = {};
      
      DEPARTMENTS.forEach(dept => {
        assigned[dept.key] = data.filter((d: Doctor) => d.department === dept.key);
      });
      
      setUnassignedDoctors(unassigned);
      setAssignedDoctors(assigned);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (doctor: Doctor) => {
    setDraggedDoctor(doctor);
  };

  const handleDragEnd = () => {
    setDraggedDoctor(null);
    setDragOverDepartment(null);
  };

  const handleDragOver = (e: React.DragEvent, departmentKey: string) => {
    e.preventDefault();
    setDragOverDepartment(departmentKey);
  };

  const handleDragLeave = () => {
    setDragOverDepartment(null);
  };

  const handleDrop = async (e: React.DragEvent, departmentKey: string) => {
    e.preventDefault();
    setDragOverDepartment(null);

    if (!draggedDoctor) return;

    try {
      // Assign doctor to department
      await adminAPI.assignDoctorToDepartment(
        draggedDoctor.id,
        departmentKey,
        selectedRole
      );

      toast.success(`${draggedDoctor.name} assigned to ${DEPARTMENTS.find(d => d.key === departmentKey)?.name}`);
      
      // Refresh the list
      await fetchDoctors();
    } catch (error) {
      console.error('Error assigning doctor:', error);
      toast.error('Failed to assign doctor');
    }
  };

  const handleUnassign = async (doctor: Doctor) => {
    try {
      await adminAPI.unassignDoctorFromDepartment(doctor.id);
      toast.success(`${doctor.name} unassigned from department`);
      await fetchDoctors();
    } catch (error) {
      console.error('Error unassigning doctor:', error);
      toast.error('Failed to unassign doctor');
    }
  };

  const filteredUnassigned = unassignedDoctors.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Assign Doctors to Departments
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Drag doctors from the left to assign them to departments
            </p>
          </div>
          <Button
            onClick={fetchDoctors}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Role Selection */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Role for Assignment
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {ROLES.map(role => (
              <option key={role.key} value={role.key}>
                {role.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This role will be assigned when you drag a doctor to a department
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Unassigned Doctors */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden sticky top-4">
              {/* Header */}
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Unassigned Doctors
                  <span className="ml-auto bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full text-xs">
                    {filteredUnassigned.length}
                  </span>
                </h3>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search doctors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Doctors List */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredUnassigned.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No unassigned doctors</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUnassigned.map((doctor) => (
                      <div
                        key={doctor.id}
                        draggable
                        onDragStart={() => handleDragStart(doctor)}
                        onDragEnd={handleDragEnd}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-move transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-purple-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {doctor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {doctor.name}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {doctor.email}
                                </p>
                              </div>
                            </div>
                            {doctor.specialties && doctor.specialties.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {doctor.specialties.slice(0, 2).map((specialty) => (
                                  <span
                                    key={specialty.id}
                                    className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
                                  >
                                    {specialty.name}
                                  </span>
                                ))}
                                {doctor.specialties.length > 2 && (
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                                    +{doctor.specialties.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Departments */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {DEPARTMENTS.map((department) => {
                const deptDoctors = assignedDoctors[department.key] || [];
                const isDragOver = dragOverDepartment === department.key;

                return (
                  <div
                    key={department.key}
                    onDragOver={(e) => handleDragOver(e, department.key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, department.key)}
                    className={`bg-white dark:bg-gray-800 border-2 rounded-lg overflow-hidden transition-all ${
                      isDragOver
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-[1.02]'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Department Header */}
                    <div className={`px-4 py-3 flex items-center justify-between ${
                      isDragOver
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-600 text-white'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5" />
                        <h3 className="font-semibold">{department.name}</h3>
                        <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                          {deptDoctors.length}
                        </span>
                      </div>
                      {isDragOver && (
                        <ArrowRight className="w-5 h-5 animate-pulse" />
                      )}
                    </div>

                    {/* Doctors in Department */}
                    <div className="p-4">
                      {deptDoctors.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            {isDragOver ? 'Drop doctor here' : 'No doctors assigned'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {deptDoctors.map((doctor) => (
                            <div
                              key={doctor.id}
                              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                    {doctor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                      {doctor.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {doctor.role_display}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUnassign(doctor)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
                                >
                                  <span className="text-xs">Remove</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default HeadsUpDragDrop;
