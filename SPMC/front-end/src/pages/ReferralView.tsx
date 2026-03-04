import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { referralsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { TransitFormDialog } from "@/components/ui/TransitFormDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  User, 
  Activity, 
  MapPin,
  Edit,
  Building2,
  Truck,
  XCircle,
  Download,
  Phone
} from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const ReferralView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [referral, setReferral] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTransitDialog, setShowTransitDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadReferral = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await referralsAPI.getById(id);
      setReferral(data);
    } catch (error: any) {
      console.error('Error loading referral:', error);
      toast({
        title: "Error",
        description: "Failed to load referral details.",
        variant: "destructive",
      });
      navigate('/referrer/referred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReferral = async () => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a cancellation reason.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCancelling(true);
      await referralsAPI.cancelReferral(id!, cancellationReason);
      
      toast({
        title: "Success! ✅",
        description: "Referral cancelled successfully.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      setShowCancelDialog(false);
      loadReferral(); // Reload to show updated status
    } catch (error: any) {
      console.error('Error cancelling referral:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel referral.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      
      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SPMC Referral System', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
      
      doc.setFontSize(14);
      doc.text('Patient Referral Details', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Referral ID: ${referral.referral_id}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Patient Information Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235); // Blue color
      doc.text('Patient Information', 14, yPos);
      yPos += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      const patientInfo = [
        ['Patient Name:', referral.patient_full_name],
        ['Category:', referral.patient_category?.replace('_', ' ') || 'N/A'],
        ['Birthday:', referral.birthday || 'N/A'],
        ['Age:', `${referral.age} years`],
        ['Gender:', referral.gender || 'N/A'],
        ['Address:', referral.current_address || 'N/A'],
        ['Admission Status:', referral.admission_status?.replace('_', ' ') || 'N/A']
      ];

      patientInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 14, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value, pageWidth - 70);
        doc.text(lines, 70, yPos);
        yPos += 6 * lines.length;
      });

      yPos += 4;

      // Patient Status Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Patient Status', 14, yPos);
      yPos += 2;
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      const statusInfo = [
        ['Chief Complaint:', referral.chief_complaint],
        ['Working Impression:', referral.working_impression],
        ...(referral.pertinent_history ? [['Pertinent History:', referral.pertinent_history]] : []),
        ...(referral.pertinent_physical_exam ? [['Physical Examination:', referral.pertinent_physical_exam]] : []),
        ...(referral.management_done ? [['Management Done:', referral.management_done]] : [])
      ];

      statusInfo.forEach(([label, value]) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(label, 14, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value || 'N/A', pageWidth - 70);
        doc.text(lines, 70, yPos);
        yPos += 6 * lines.length;
      });

      yPos += 4;

      // Vital Signs Section
      if (referral.bp || referral.hr || referral.rr || referral.temp || referral.o2_sat) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text('Latest Vital Signs', 14, yPos);
        yPos += 2;
        doc.line(14, yPos, pageWidth - 14, yPos);
        yPos += 8;

        const vitalSigns = [];
        if (referral.bp) vitalSigns.push(['Blood Pressure', referral.bp]);
        if (referral.hr) vitalSigns.push(['Heart Rate', `${referral.hr} bpm`]);
        if (referral.rr) vitalSigns.push(['Respiratory Rate', `${referral.rr} /min`]);
        if (referral.temp) vitalSigns.push(['Temperature', `${referral.temp}°C`]);
        if (referral.o2_sat) vitalSigns.push(['O2 Saturation', `${referral.o2_sat}%`]);
        if (referral.gcs_score) vitalSigns.push(['GCS Score', referral.gcs_score]);
        if (referral.o2_support) vitalSigns.push(['O2 Support', referral.o2_support]);
        if (referral.rtpcr_result) vitalSigns.push(['RTPCR Result', referral.rtpcr_result.toUpperCase()]);

        (doc as any).autoTable({
          startY: yPos,
          head: [['Vital Sign', 'Value']],
          body: vitalSigns,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235], textColor: 255 },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 9 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
      }

      // Referring Hospital Section
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Referring Hospital & Referrer Information', 14, yPos);
      yPos += 2;
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      const hospitalInfo = [
        ['Facility Name:', referral.referring_hospital_name],
        ...(referral.hospital_doh_level ? [['DOH Level:', referral.hospital_doh_level]] : []),
        ['Referrer Name:', referral.referrer_name],
        ...(referral.referrer_profession ? [['Profession:', referral.referrer_profession.replace(/_/g, ' ')]] : []),
        ...(referral.referrer_contact_numbers && referral.referrer_contact_numbers.length > 0 
          ? [['Referrer Contacts:', referral.referrer_contact_numbers.join(', ')]] : []),
        ...(referral.mode_of_transportation ? [['Transportation:', referral.mode_of_transportation.replace(/_/g, ' ')]] : []),
        ...(referral.patient_watcher_name ? [['Patient/Watcher:', referral.patient_watcher_name]] : []),
        ...(referral.patient_watcher_contact_numbers && referral.patient_watcher_contact_numbers.length > 0 
          ? [['Watcher Contacts:', referral.patient_watcher_contact_numbers.join(', ')]] : [])
      ];

      hospitalInfo.forEach(([label, value]) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(label, 14, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value || 'N/A', pageWidth - 70);
        doc.text(lines, 70, yPos);
        yPos += 6 * lines.length;
      });

      yPos += 4;

      // Referral Information Section
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Referral Information', 14, yPos);
      yPos += 2;
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      const referralInfo = [
        ['Status:', referral.status.replace('_', ' ').toUpperCase()],
        ['Priority:', referral.priority || 'N/A'],
        ['Specialty Needed:', referral.specialty_needed_name || 'N/A'],
        ['Reason for Referral:', referral.reason_for_referral],
        ['Created:', new Date(referral.created_at).toLocaleString()]
      ];

      referralInfo.forEach(([label, value]) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(label, 14, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value || 'N/A', pageWidth - 70);
        doc.text(lines, 70, yPos);
        yPos += 6 * lines.length;
      });

      // Save the PDF
      const fileName = `Referral_${referral.referral_id}_${referral.patient_full_name.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);

      toast({
        title: "Success! ✅",
        description: "PDF downloaded successfully.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    loadReferral();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading referral...</p>
        </div>
      </div>
    );
  }

  if (!referral) {
    return null;
  }

  // Referrers can only edit pending referrals they created
  // EDCC and Triage can edit any referral
  const isEDCCorTriage = user?.role === 'edcc_personnel' || user?.role === 'call_triage' || user?.permissions?.can_triage_referrals;
  const canEdit = isEDCCorTriage || (referral.status === 'pending' && referral.created_by === user?.id);
  const canFillTransit = referral.status === 'dispositioned' && referral.created_by === user?.id;
  // Anyone can cancel except if already cancelled or completed
  const canCancel = referral.status !== 'cancelled' && referral.status !== 'completed';
  // EDCC and EDMA can download PDF
  const canDownloadPDF = isEDCCorTriage;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">SPMC Referral System</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Referral Details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          {/* Header with actions */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              <div className="flex gap-2">
                {canDownloadPDF && (
                  <Button 
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    {downloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                )}

                {canEdit && (
                  <Link to={`/referral/edit/${id}`}>
                    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                      <Edit className="w-4 h-4" />
                      Edit Referral
                    </Button>
                  </Link>
                )}
                
                {canFillTransit && (
                  <Button 
                    onClick={() => setShowTransitDialog(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 animate-pulse shadow-lg shadow-green-500/50"
                  >
                    <Truck className="w-4 h-4" />
                    Fill In-Transit Form
                  </Button>
                )}

                {canCancel && (
                  <Button 
                    onClick={() => setShowCancelDialog(true)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Referral
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {referral.patient_full_name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Referral ID: {referral.referral_id}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  referral.status === 'waiting' ? 'bg-blue-100 text-blue-800' :
                  referral.status === 'emergent' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {referral.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Patient Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Patient Category</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {referral.patient_category?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Birthday</p>
                <p className="font-medium text-gray-900 dark:text-white">{referral.birthday}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admission Status</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {referral.admission_status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </p>
              </div>
              
              {referral.contact_numbers && referral.contact_numbers.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Patient/Watcher Contact Numbers</p>
                  <div className="space-y-1">
                    {referral.contact_numbers.map((number: string, index: number) => (
                      <p key={index} className="font-medium text-gray-900 dark:text-white">
                        {number}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Address</p>
                <p className="font-medium text-gray-900 dark:text-white">{referral.current_address}</p>
              </div>
            </div>
          </div>

          {/* Patient Status */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Patient Status</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Chief Complaint</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.chief_complaint}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Working Impression</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.working_impression}</p>
                </div>
              </div>
              
              {referral.pertinent_history && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pertinent History</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.pertinent_history}</p>
                </div>
              )}
              
              {referral.pertinent_physical_exam && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Physical Examination</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.pertinent_physical_exam}</p>
                </div>
              )}
            </div>
          </div>

          {/* Latest Vital Signs */}
          {(referral.bp || referral.hr || referral.temp || referral.o2_sat) && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Latest Vital Signs</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                {referral.bp && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Blood Pressure</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{referral.bp}</p>
                  </div>
                )}
                
                {referral.hr && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Heart Rate</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{referral.hr} bpm</p>
                  </div>
                )}
                
                {referral.rr && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Respiratory Rate</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{referral.rr} /min</p>
                  </div>
                )}
                
                {referral.temp && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Temperature</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{referral.temp}°C</p>
                  </div>
                )}
                
                {referral.o2_sat && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">O2 Saturation</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{referral.o2_sat}%</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {referral.gcs_score && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">GCS Score</p>
                    <p className="font-bold text-gray-900 dark:text-white">{referral.gcs_score}</p>
                  </div>
                )}
                
                {referral.o2_support && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">O2 Support</p>
                    <p className="font-medium text-gray-900 dark:text-white">{referral.o2_support}</p>
                  </div>
                )}
                
                {referral.rtpcr_result && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">RTPCR Result</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                      referral.rtpcr_result === 'positive' ? 'bg-red-100 text-red-800' :
                      referral.rtpcr_result === 'negative' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {referral.rtpcr_result.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Referring Hospital */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Referring Hospital</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Facility Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{referral.referring_hospital_name}</p>
              </div>
              
              {referral.hospital_doh_level && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">DOH Level</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{referral.hospital_doh_level}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Referrer Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{referral.referrer_name}</p>
              </div>
              
              {referral.referrer_profession && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Profession</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{referral.referrer_profession.replace(/_/g, ' ')}</p>
                </div>
              )}

              {referral.referrer_contact_numbers && referral.referrer_contact_numbers.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Referrer Contact Numbers</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {referral.referrer_contact_numbers.map((number: string, index: number) => (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                        <Phone className="w-3 h-3" />
                        {number}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {referral.mode_of_transportation && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mode of Transportation</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{referral.mode_of_transportation.replace(/_/g, ' ')}</p>
                </div>
              )}

              {referral.patient_watcher_name && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Patient/Watcher Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.patient_watcher_name}</p>
                </div>
              )}

              {referral.patient_watcher_contact_numbers && referral.patient_watcher_contact_numbers.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Patient/Watcher Contact Numbers</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {referral.patient_watcher_contact_numbers.map((number: string, index: number) => (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                        <Phone className="w-3 h-3" />
                        {number}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transit Information (Watcher Details) */}
          {referral.transit_info && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Watcher & Transit Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Watcher Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.watcher_name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Age</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.watcher_age} years</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Relation to Patient</p>
                  <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.relation_to_patient}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Watcher Contact Number</p>
                  <p className="font-medium text-gray-900 dark:text-white text-lg">{referral.transit_info.contact_number}</p>
                </div>
                
                {referral.transit_info.escort_nurse && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Escort Nurse</p>
                    <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.escort_nurse}</p>
                  </div>
                )}
                
                {referral.transit_info.driver && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Driver</p>
                    <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.driver}</p>
                  </div>
                )}
                
                {referral.transit_info.time_ambulance_left && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Time Ambulance Left</p>
                    <p className="font-medium text-gray-900 dark:text-white">{referral.transit_info.time_ambulance_left}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transit Form Dialog */}
      <TransitFormDialog
        open={showTransitDialog}
        onOpenChange={setShowTransitDialog}
        referralId={id!}
        patientName={referral.patient_full_name}
        onSuccess={() => {
          setShowTransitDialog(false);
          loadReferral(); // Reload referral data
        }}
      />

      {/* Cancel Referral Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Cancel Referral
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this referral? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Info */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {referral.patient_full_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Referral ID: {referral.referral_id}
              </p>
            </div>

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this referral..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-none"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelling}
              >
                Keep Referral
              </Button>
              <Button
                onClick={handleCancelReferral}
                disabled={cancelling || !cancellationReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Referral
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
