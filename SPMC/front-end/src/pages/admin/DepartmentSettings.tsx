import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Building2, Phone, Save, X, Edit2, CheckCircle } from "lucide-react";
import { adminAPI } from "@/lib/api";
import { toast } from "sonner";

interface Department {
  id: number;
  code: string;
  name: string;
  contact_number: string;
  is_active: boolean;
}

const DepartmentSettings = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setEditValue(dept.contact_number || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveContactNumber = async (deptId: number) => {
    try {
      setSaving(true);
      await adminAPI.updateDepartmentContact(deptId, editValue);
      
      // Update local state
      setDepartments(departments.map(dept => 
        dept.id === deptId 
          ? { ...dept, contact_number: editValue }
          : dept
      ));
      
      toast.success('Contact number updated successfully');
      setEditingId(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating contact number:', error);
      toast.error('Failed to update contact number');
    } finally {
      setSaving(false);
    }
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

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Department Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage department contact numbers for referral coordination
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Building2 className="w-4 h-4" />
            <span>{departments.length} Departments</span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Department Contact Numbers</p>
              <p className="text-blue-700 dark:text-blue-300">
                These contact numbers are used when EDCC staff need to coordinate with departments about referrals. 
                Make sure each department has an accurate contact number.
              </p>
            </div>
          </div>
        </div>

        {/* Departments Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {dept.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {dept.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === dept.id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="e.g., 082-227-2731"
                          className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {dept.contact_number || '(not set)'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dept.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {editingId === dept.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveContactNumber(dept.id)}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(dept)}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            How to update contact numbers:
          </h3>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
            <li>Click the "Edit" button next to the department you want to update</li>
            <li>Enter the new contact number (e.g., 082-227-2731)</li>
            <li>Click "Save" to apply the changes</li>
            <li>The contact number will be used when coordinating referrals with that department</li>
          </ol>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default DepartmentSettings;
