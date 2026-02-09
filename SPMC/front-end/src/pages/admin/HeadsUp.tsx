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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Heads Up</h1>
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
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">{department}</h3>
                    <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
                      {deptDoctors.length} {deptDoctors.length === 1 ? 'doctor' : 'doctors'}
                    </span>
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
                            onClick={() => handleEditSpecialties(doctor)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit Specialties
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
      </div>
    </AdminDashboardLayout>
  );
};

export default HeadsUp;
