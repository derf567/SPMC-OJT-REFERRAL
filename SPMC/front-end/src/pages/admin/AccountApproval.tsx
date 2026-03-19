import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  Check,
  X,
  Clock,
  User,
  Building2,
  Mail,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminAPI } from "@/lib/api";
import { toast } from "sonner";

interface PendingReferrer {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    date_joined: string;
  };
  first_name: string;
  middle_name: string;
  last_name: string;
  referrer_type: string;
  approval_status: string;
  specialties: any[];
  affiliate_hospitals: any[];
  position?: string;
  age?: number;
  address?: string;
  gender?: string;
  created_at: string;
  documents: any[];
}

interface PendingDoctor {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  department: string;
  department_display: string;
  created_at: string;
  is_active: boolean;
  approval_status: string;
}

const AccountApproval = () => {
  const [allReferrers, setAllReferrers] = useState<PendingReferrer[]>([]);
  const [allDoctors, setAllDoctors] = useState<PendingDoctor[]>([]);
  const [filteredReferrers, setFilteredReferrers] = useState<PendingReferrer[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<PendingDoctor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReferrer, setSelectedReferrer] = useState<PendingReferrer | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<PendingDoctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      console.log('Fetching accounts...');
      
      const [referrersData, doctorsData] = await Promise.all([
        adminAPI.getPendingReferrers().catch(err => {
          console.error('Error fetching referrers:', err);
          return [];
        }),
        adminAPI.getPendingDoctors().catch(err => {
          console.error('Error fetching doctors:', err);
          return [];
        })
      ]);
      
      console.log('Referrers data:', referrersData);
      console.log('Doctors data:', doctorsData);
      
      setAllReferrers(referrersData);
      setAllDoctors(doctorsData);
      applyFilters(referrersData, doctorsData, statusFilter, filterType, searchTerm);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error(`Failed to load accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (
    referrers: PendingReferrer[], 
    doctors: PendingDoctor[],
    status: string, 
    type: string, 
    search: string
  ) => {
    let filteredRefs = referrers;
    let filteredDocs = doctors;

    // Filter referrers by status
    if (status !== "all") {
      filteredRefs = filteredRefs.filter(r => r.approval_status === status);
    }

    // Filter doctors by status
    if (status !== "all") {
      filteredDocs = filteredDocs.filter(d => d.approval_status === status);
    }

    // Filter by type
    if (type === "doctor") {
      filteredRefs = []; // Show only doctors
    } else if (type !== "all") {
      filteredRefs = filteredRefs.filter(r => r.referrer_type === type);
      filteredDocs = []; // Hide doctors if specific referrer type selected
    }

    // Filter referrers by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRefs = filteredRefs.filter(r =>
        r.first_name.toLowerCase().includes(searchLower) ||
        r.last_name.toLowerCase().includes(searchLower) ||
        r.user.email.toLowerCase().includes(searchLower) ||
        r.user.username.toLowerCase().includes(searchLower)
      );
    }

    // Filter doctors by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocs = filteredDocs.filter(d =>
        d.first_name.toLowerCase().includes(searchLower) ||
        d.last_name.toLowerCase().includes(searchLower) ||
        d.email.toLowerCase().includes(searchLower) ||
        d.username.toLowerCase().includes(searchLower)
      );
    }

    setFilteredReferrers(filteredRefs);
    setFilteredDoctors(filteredDocs);
  };

  useEffect(() => {
    applyFilters(allReferrers, allDoctors, statusFilter, filterType, searchTerm);
  }, [statusFilter, filterType, searchTerm, allReferrers, allDoctors]);

  const handleApproveReferrer = async (id: number) => {
    if (!confirm('Are you sure you want to approve this referrer account?')) return;

    try {
      setActionLoading(true);
      await adminAPI.approveReferrer(id);
      toast.success('Referrer account approved successfully');
      await fetchAccounts();
      setSelectedReferrer(null);
    } catch (error) {
      console.error('Error approving referrer account:', error);
      toast.error('Failed to approve referrer account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReferrer = async (id: number) => {
    if (!confirm('Are you sure you want to reject this referrer account?')) return;

    try {
      setActionLoading(true);
      await adminAPI.rejectReferrer(id);
      toast.success('Referrer account rejected successfully');
      await fetchAccounts();
      setSelectedReferrer(null);
    } catch (error) {
      console.error('Error rejecting referrer account:', error);
      toast.error('Failed to reject referrer account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveDoctor = async (id: number) => {
    if (!confirm('Are you sure you want to approve this doctor account?')) return;

    try {
      setActionLoading(true);
      await adminAPI.approveDoctor(id);
      toast.success('Doctor account approved successfully');
      await fetchAccounts();
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error approving doctor account:', error);
      toast.error('Failed to approve doctor account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDoctor = async (id: number) => {
    if (!confirm('Are you sure you want to reject this doctor account?')) return;

    try {
      setActionLoading(true);
      await adminAPI.rejectDoctor(id);
      toast.success('Doctor account rejected successfully');
      await fetchAccounts();
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error rejecting doctor account:', error);
      toast.error('Failed to reject doctor account');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReferrerTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      'doctor': 'Doctor / Medical Professional',
      'hospital_employee': 'Authorized Hospital Employee',
      'other': 'Other'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'pending': { label: 'Pending', className: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
      'approved': { label: 'Approved', className: 'bg-green-500/20 text-green-600 border-green-500/30' },
      'rejected': { label: 'Rejected', className: 'bg-red-500/20 text-red-600 border-red-500/30' }
    };
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <Badge className={`${config.className} border`}>
        {config.label}
      </Badge>
    );
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Approval</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Review and manage referrer account registrations
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="doctor">Doctors</option>
              <option value="hospital_employee">Hospital Employees (Referrers)</option>
              <option value="other">Other (Referrers)</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredReferrers.length + filteredDoctors.length} of {allReferrers.length + allDoctors.length} accounts
          {filteredReferrers.length > 0 && ` (${filteredReferrers.length} referrers)`}
          {filteredDoctors.length > 0 && ` (${filteredDoctors.length} doctors)`}
        </div>

        {/* Accounts List */}
        <div className="space-y-4">
          {filteredReferrers.length === 0 && filteredDoctors.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No accounts found</p>
            </div>
          ) : (
            <>
              {/* Doctors List */}
              {filteredDoctors.map((doctor) => {
                const initials = `${doctor.first_name[0]}${doctor.last_name[0]}`;

                return (
                  <div
                    key={`doctor-${doctor.id}`}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                          {initials}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {doctor.full_name}
                            </h3>
                            <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 border">
                              Doctor
                            </Badge>
                            {getStatusBadge(doctor.approval_status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span>{doctor.department_display || doctor.department}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{doctor.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>Submitted {formatDate(doctor.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDoctor(doctor)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {doctor.approval_status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApproveDoctor(doctor.id)}
                              disabled={actionLoading}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectDoctor(doctor.id)}
                              disabled={actionLoading}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Referrers List */}
              {filteredReferrers.map((referrer) => {
                const fullName = `${referrer.first_name} ${referrer.middle_name ? referrer.middle_name + ' ' : ''}${referrer.last_name}`;
                const initials = `${referrer.first_name[0]}${referrer.last_name[0]}`;

                return (
                  <div
                    key={`referrer-${referrer.id}`}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                          {initials}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {fullName}
                            </h3>
                            {getStatusBadge(referrer.approval_status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div key="type" className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{getReferrerTypeDisplay(referrer.referrer_type)}</span>
                            </div>
                            <div key="email" className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{referrer.user.email}</span>
                            </div>
                            {referrer.affiliate_hospitals && referrer.affiliate_hospitals.length > 0 && (
                              <div key="hospital" className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                <span>{referrer.affiliate_hospitals[0].name}</span>
                              </div>
                            )}
                            <div key="submitted" className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>Submitted {formatDate(referrer.created_at)}</span>
                            </div>
                          </div>
                          {referrer.specialties && referrer.specialties.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {referrer.specialties.map((specialty: any, index: number) => (
                                <span
                                  key={`${referrer.id}-specialty-${specialty.id || index}`}
                                  className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-xs"
                                >
                                  {specialty.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReferrer(referrer)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {referrer.approval_status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApproveReferrer(referrer.id)}
                              disabled={actionLoading}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectReferrer(referrer.id)}
                              disabled={actionLoading}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Referrer Detail Modal */}
        <Dialog open={!!selectedReferrer} onOpenChange={() => setSelectedReferrer(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Referrer Account Details</DialogTitle>
              <DialogDescription>
                Review complete information for this referrer account
              </DialogDescription>
            </DialogHeader>

            {selectedReferrer && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {selectedReferrer.referrer_type === 'hospital_account' ? 'Hospital Name:' : 'Full Name:'}
                      </span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedReferrer.referrer_type === 'hospital_account'
                          ? (selectedReferrer.first_name || selectedReferrer.user.username)
                          : `${selectedReferrer.first_name} ${selectedReferrer.middle_name || ''} ${selectedReferrer.last_name}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Type:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getReferrerTypeDisplay(selectedReferrer.referrer_type)}
                      </p>
                    </div>
                    {selectedReferrer.age && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Age:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedReferrer.age}</p>
                      </div>
                    )}
                    {selectedReferrer.gender && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Gender:</span>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedReferrer.gender}</p>
                      </div>
                    )}
                    {selectedReferrer.position && (
                      <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">Position:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedReferrer.position}</p>
                      </div>
                    )}
                    {selectedReferrer.address && (
                      <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">Address:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedReferrer.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedReferrer.user.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Username:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedReferrer.user.username}</p>
                    </div>
                  </div>
                </div>

                {/* Specialties */}
                {selectedReferrer.specialties && selectedReferrer.specialties.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedReferrer.specialties.map((specialty: any, index: number) => (
                        <span
                          key={`modal-specialty-${specialty.id || index}`}
                          className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm"
                        >
                          {specialty.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affiliate Hospitals */}
                {selectedReferrer.affiliate_hospitals && selectedReferrer.affiliate_hospitals.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Affiliate Hospitals</h4>
                    <div className="space-y-2">
                      {selectedReferrer.affiliate_hospitals.map((hospital: any) => (
                        <div key={hospital.id} className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span key={`name-${hospital.id}`} className="text-gray-900 dark:text-white">{hospital.name}</span>
                          {hospital.location && (
                            <span key={`loc-${hospital.id}`} className="text-gray-500 dark:text-gray-400">• {hospital.location}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {selectedReferrer.documents && selectedReferrer.documents.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Uploaded Documents</h4>
                    <div className="space-y-2">
                      {selectedReferrer.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <a
                            href={doc.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 underline"
                          >
                            {doc.document_type} - {doc.description || 'View Document'}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedReferrer.approval_status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApproveReferrer(selectedReferrer.id)}
                      disabled={actionLoading}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve Account
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => handleRejectReferrer(selectedReferrer.id)}
                      disabled={actionLoading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject Account
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Doctor Detail Modal */}
        <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Doctor Account Details</DialogTitle>
              <DialogDescription>
                Review complete information for this doctor account
              </DialogDescription>
            </DialogHeader>

            {selectedDoctor && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Full Name:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedDoctor.full_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Role:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Doctor
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Department:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedDoctor.department_display || selectedDoctor.department}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedDoctor.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Username:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedDoctor.username}</p>
                    </div>
                  </div>
                </div>

                {/* Registration Date */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Registration Information</h4>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedDoctor.created_at)}</p>
                  </div>
                </div>

                {/* Actions */}
                {selectedDoctor.approval_status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApproveDoctor(selectedDoctor.id)}
                      disabled={actionLoading}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve Account
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => handleRejectDoctor(selectedDoctor.id)}
                      disabled={actionLoading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject Account
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AccountApproval;
