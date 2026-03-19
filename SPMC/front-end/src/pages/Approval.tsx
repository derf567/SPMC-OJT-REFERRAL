import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { referralsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  FileText,
  Mail,
  MapPin,
  Building2,
  Stethoscope
} from "lucide-react";

interface PendingAccount {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    date_joined: string;
  };
  first_name: string;
  middle_name?: string;
  last_name: string;
  referrer_type: string;
  age?: number;
  gender?: string;
  address?: string;
  position?: string;
  specialties?: Array<{ id: number; name: string }>;
  affiliate_hospitals?: Array<{ id: number; name: string }>;
  documents?: Array<{
    id: number;
    document_type: string;
    file: string;
    description?: string;
    uploaded_at: string;
  }>;
  approval_status: string;
  created_at: string;
}

const Approval = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<PendingAccount | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { toast } = useToast();

  // Redirect non-admin users
  useEffect(() => {
    if (user && !user.permissions?.is_admin_user) {
      toast({
        title: "Access Denied",
        description: "Only administrators can access account approval.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [user, navigate, toast]);

  const fetchPendingAccounts = async () => {
    try {
      setLoading(true);
      const data = await referralsAPI.getPendingAccounts();
      setPendingAccounts(data);
    } catch (error) {
      console.error('Error fetching pending accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load pending accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAccounts();
  }, []);

  const handleApprove = async (accountId: number) => {
    try {
      setProcessingId(accountId);
      await referralsAPI.approveAccount(accountId);
      toast({
        title: "Account Approved",
        description: "The referrer account has been approved successfully.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      fetchPendingAccounts();
      setShowDetailsModal(false);
    } catch (error: any) {
      console.error('Error approving account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (accountId: number) => {
    try {
      setProcessingId(accountId);
      await referralsAPI.rejectAccount(accountId);
      toast({
        title: "Account Rejected",
        description: "The referrer account has been rejected.",
        className: "bg-red-50 border-red-200 text-red-800",
      });
      fetchPendingAccounts();
      setShowDetailsModal(false);
    } catch (error: any) {
      console.error('Error rejecting account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const viewDetails = (account: PendingAccount) => {
    setSelectedAccount(account);
    setShowDetailsModal(true);
  };

  const getReferrerTypeDisplay = (type: string) => {
    const types: { [key: string]: string } = {
      'doctor': 'Doctor / Medical Professional',
      'hospital_employee': 'Authorized Hospital Employee',
      'other': 'Other'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Approval</h1>
            <p className="text-gray-500 dark:text-gray-400">Loading pending accounts...</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Approval</h1>
            <p className="text-gray-500 dark:text-gray-400">Review and approve referrer account registrations</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Accounts</p>
              <p className="text-2xl font-bold text-blue-600">{pendingAccounts.length}</p>
            </div>
          </div>
        </div>

        {/* Pending Accounts Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {pendingAccounts.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No pending accounts to review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Registered</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {account.first_name} {account.middle_name ? account.middle_name + ' ' : ''}{account.last_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{account.user.username}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {getReferrerTypeDisplay(account.referrer_type)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{account.user.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(account.user.date_joined).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(account.approval_status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewDetails(account)}
                            className="text-blue-600 hover:text-blue-700 border-blue-600"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {account.approval_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(account.id)}
                                disabled={processingId === account.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(account.id)}
                                disabled={processingId === account.id}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedAccount.referrer_type === 'hospital_account' ? 'Hospital Name' : 'Full Name'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedAccount.referrer_type === 'hospital_account'
                          ? (selectedAccount.first_name || selectedAccount.user.username)
                          : `${selectedAccount.first_name} ${selectedAccount.middle_name} ${selectedAccount.last_name}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Referrer Type</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getReferrerTypeDisplay(selectedAccount.referrer_type)}
                      </p>
                    </div>
                    {selectedAccount.age && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedAccount.age}</p>
                      </div>
                    )}
                    {selectedAccount.gender && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedAccount.gender}</p>
                      </div>
                    )}
                    {selectedAccount.position && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedAccount.position}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedAccount.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedAccount.user.username}</p>
                    </div>
                    {selectedAccount.address && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Address
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedAccount.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specialties (for doctors) */}
                {selectedAccount.specialties && selectedAccount.specialties.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5" />
                      Specialties
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAccount.specialties.map((specialty) => (
                        <Badge key={specialty.id} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {specialty.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affiliate Hospitals */}
                {selectedAccount.affiliate_hospitals && selectedAccount.affiliate_hospitals.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Affiliate Hospitals
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAccount.affiliate_hospitals.map((hospital) => (
                        <Badge key={hospital.id} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {hospital.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {selectedAccount.documents && selectedAccount.documents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Uploaded Documents
                    </h3>
                    <div className="space-y-2">
                      {selectedAccount.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{doc.document_type}</p>
                            {doc.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">{doc.description}</p>
                            )}
                            <p className="text-xs text-gray-400">
                              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={doc.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Button size="sm" variant="outline">
                              View File
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedAccount.approval_status === 'pending' && (
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailsModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedAccount.id)}
                      disabled={processingId === selectedAccount.id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Account
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedAccount.id)}
                      disabled={processingId === selectedAccount.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Account
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Approval;
