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
  MessageSquare,
  Clock
} from "lucide-react";
import jsPDF from 'jspdf';

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
  const [fraudNotes, setFraudNotes] = useState('');
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [fraudActionLoading, setFraudActionLoading] = useState(false);

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

  const handleFraudReviewAction = async (action: 'mark_safe' | 'keep_flagged' | 'suspend_referrer') => {
    if (!id) return;

    try {
      setFraudActionLoading(true);
      await referralsAPI.reviewFraud(id, action, fraudNotes, suspensionDays);
      toast({
        title: "Success",
        description: "Fraud review action applied.",
      });
      setFraudNotes('');
      await loadReferral();
    } catch (error: any) {
      console.error('Error applying fraud review action:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to apply fraud review action.",
        variant: "destructive",
      });
    } finally {
      setFraudActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      const checkPageBreak = (spaceNeeded: number) => {
        if (yPos + spaceNeeded > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
      };

      const addSection = (title: string) => {
        checkPageBreak(12);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text(title, margin, yPos);
        yPos += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
      };

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('SPMC Referral System', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
      
      doc.setFontSize(12);
      doc.text('Patient Referral Details', pageWidth / 2, yPos, { align: 'center' });
      yPos += 4;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Referral ID: ${referral.referral_id}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 3;
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      // Patient Information
      addSection('Patient Information');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      const patientData = [
        ['Patient Name:', referral.patient_full_name],
        ['Category:', referral.patient_category?.replace('_', ' ') || 'N/A'],
        ['Birthday:', referral.birthday || 'N/A'],
        ['Age:', `${referral.age} years`],
        ['Gender:', referral.gender || 'N/A'],
        ['Address:', referral.current_address || 'N/A'],
        ['Admission Status:', referral.admission_status?.replace('_', ' ') || 'N/A']
      ];

      patientData.forEach(([label, value]) => {
        checkPageBreak(5);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(String(value), contentWidth - 50);
        doc.text(lines, margin + 50, yPos);
        yPos += Math.max(4, lines.length * 3.5);
      });

      yPos += 2;

      // Patient Status
      addSection('Patient Status');
      
      const statusData = [
        ['Chief Complaint:', referral.chief_complaint],
        ['Working Impression:', referral.working_impression],
        ...(referral.pertinent_history ? [['Pertinent History:', referral.pertinent_history]] : []),
        ...(referral.pertinent_physical_exam ? [['Physical Examination:', referral.pertinent_physical_exam]] : []),
        ...(referral.management_done ? [['Management Done:', referral.management_done]] : [])
      ];

      statusData.forEach(([label, value]) => {
        checkPageBreak(5);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(String(value) || 'N/A', contentWidth - 50);
        doc.text(lines, margin + 50, yPos);
        yPos += Math.max(4, lines.length * 3.5);
      });

      yPos += 2;

      // Vital Signs
      if (referral.bp || referral.hr || referral.rr || referral.temp || referral.o2_sat) {
        addSection('Latest Vital Signs');

        const vitalSigns = [];
        if (referral.bp) vitalSigns.push(['Blood Pressure', referral.bp]);
        if (referral.hr) vitalSigns.push(['Heart Rate', `${referral.hr} bpm`]);
        if (referral.rr) vitalSigns.push(['Respiratory Rate', `${referral.rr} /min`]);
        if (referral.temp) vitalSigns.push(['Temperature', `${referral.temp}°C`]);
        if (referral.o2_sat) vitalSigns.push(['O2 Saturation', `${referral.o2_sat}%`]);
        if (referral.gcs_score) vitalSigns.push(['GCS Score', referral.gcs_score]);
        if (referral.o2_support) vitalSigns.push(['O2 Support', referral.o2_support]);
        if (referral.rtpcr_result) vitalSigns.push(['RTPCR Result', referral.rtpcr_result.toUpperCase()]);

        checkPageBreak(vitalSigns.length * 4 + 8);

        // Table header
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(37, 99, 235);
        doc.setTextColor(255, 255, 255);
        doc.rect(margin, yPos - 2, contentWidth, 4, 'F');
        doc.text('Vital Sign', margin + 2, yPos + 1);
        doc.text('Value', margin + contentWidth - 20, yPos + 1);
        yPos += 5;

        // Table rows
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        vitalSigns.forEach((row, index) => {
          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPos - 2, contentWidth, 4, 'F');
          }
          doc.text(row[0], margin + 2, yPos + 1);
          doc.text(String(row[1]), margin + contentWidth - 20, yPos + 1);
          yPos += 4;
        });

        yPos += 2;
      }

      // Referring Hospital
      addSection('Referring Hospital & Referrer Information');

      const hospitalData = [
        ['Facility Name:', referral.referring_hospital_name],
        ...(referral.hospital_doh_level ? [['DOH Level:', referral.hospital_doh_level]] : []),
        ['Referrer Name:', referral.referrer_name],
        ...(referral.referrer_profession ? [['Profession:', referral.referrer_profession.replace(/_/g, ' ')]] : []),
        ...(referral.mode_of_transportation ? [['Transportation:', referral.mode_of_transportation.replace(/_/g, ' ')]] : [])
      ];

      hospitalData.forEach(([label, value]) => {
        checkPageBreak(5);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(String(value) || 'N/A', contentWidth - 50);
        doc.text(lines, margin + 50, yPos);
        yPos += Math.max(4, lines.length * 3.5);
      });

      yPos += 2;

      // Referral Information
      addSection('Referral Information');

      const referralData = [
        ['Status:', referral.status.replace('_', ' ').toUpperCase()],
        ['Priority:', referral.priority || 'N/A'],
        ['Specialty Needed:', referral.specialty_needed_name || 'N/A'],
        ['Reason for Referral:', referral.reason_for_referral],
        ['Created:', new Date(referral.created_at).toLocaleString()]
      ];

      referralData.forEach(([label, value]) => {
        checkPageBreak(5);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(String(value) || 'N/A', contentWidth - 50);
        doc.text(lines, margin + 50, yPos);
        yPos += Math.max(4, lines.length * 3.5);
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
  const riskBadgeClass =
    referral.fraud_risk_level === 'high'
      ? 'bg-red-100 text-red-800 border-red-300'
      : referral.fraud_risk_level === 'medium'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : 'bg-emerald-100 text-emerald-800 border-emerald-300';

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

          {/* Notes from EDCC/Triage - visible to referrer */}
          {(referral.triage_verification_notes || referral.triage_remarks || referral.triage_notes) && (
            <div className="mx-6 mt-4 mb-0 rounded-lg border-2 border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Notes from EDCC / Triage</p>
              </div>
              <div className="space-y-2">
                {referral.triage_verification_notes && (
                  <div>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Verification Notes (Transit Template)</p>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-sm">{referral.triage_verification_notes}</p>
                  </div>
                )}
                {referral.triage_remarks && (
                  <div>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Endorsement Remarks</p>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-sm">{referral.triage_remarks}</p>
                  </div>
                )}
                {referral.triage_notes && (
                  <div>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-0.5">Triage Notes</p>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-sm">{referral.triage_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fraud Flags Panel (EDCC/EDMA only) */}
          {isEDCCorTriage && (
            <div className="mx-6 mt-4 rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">Fraud Flags Panel</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Rule-based spam/fraud screening for EDCC/EDMA review</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${riskBadgeClass}`}>
                  {(referral.fraud_risk_level || 'low').toUpperCase()} POSSIBILITY
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="bg-white/70 dark:bg-gray-800/50 rounded p-3">
                  <p className="text-xs text-gray-500">Risk Score</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{referral.fraud_risk_score ?? 0}/100</p>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/50 rounded p-3">
                  <p className="text-xs text-gray-500">Manual Review</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{referral.fraud_requires_manual_review ? 'Required' : 'Not Required'}</p>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/50 rounded p-3">
                  <p className="text-xs text-gray-500">Last Evaluated</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {referral.fraud_last_evaluated_at ? new Date(referral.fraud_last_evaluated_at).toLocaleString() : 'Not yet evaluated'}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300 mb-2">Triggered Flags</p>
                {referral.fraud_risk_flags?.length ? (
                  <div className="space-y-2">
                    {referral.fraud_risk_flags.map((flag: any, idx: number) => (
                      <div key={idx} className="p-3 rounded border border-red-200 dark:border-red-700 bg-white/70 dark:bg-gray-800/40">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{flag.code?.replace(/_/g, ' ') || 'flag'}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200">{flag.message || 'Triggered by fraud rule.'}</p>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">+{flag.points || 0} points</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-200">No fraud flags triggered for this referral.</p>
                )}
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300 mb-2">
                  Review Notes
                </label>
                <textarea
                  value={fraudNotes}
                  onChange={(e) => setFraudNotes(e.target.value)}
                  placeholder="Add notes for your manual review decision..."
                  className="w-full px-3 py-2 border border-red-200 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white resize-none"
                  rows={3}
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300 mb-2">
                  Suspension Days
                </label>
                <input
                  type="number"
                  min={1}
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(Number(e.target.value || 1))}
                  className="w-32 px-3 py-2 border border-red-200 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button disabled={fraudActionLoading} onClick={() => handleFraudReviewAction('mark_safe')} className="bg-emerald-600 hover:bg-emerald-700">
                  Mark Safe
                </Button>
                <Button disabled={fraudActionLoading} onClick={() => handleFraudReviewAction('keep_flagged')} className="bg-amber-600 hover:bg-amber-700">
                  Keep Flagged
                </Button>
                <Button disabled={fraudActionLoading} onClick={() => handleFraudReviewAction('suspend_referrer')} className="bg-red-600 hover:bg-red-700">
                  Suspend Referrer
                </Button>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300 mb-2">Audit Trail</p>
                {referral.fraud_audit_logs?.length ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {referral.fraud_audit_logs.map((log: any) => (
                      <div key={log.id} className="p-3 rounded border border-red-200 dark:border-red-700 bg-white/70 dark:bg-gray-800/40">
                        <p className="text-xs font-semibold uppercase text-red-700 dark:text-red-300">
                          {log.action?.replace(/_/g, ' ')} · {log.acted_by_name || 'System'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          Risk: {(log.previous_risk_level || 'n/a').toUpperCase()} → {(log.new_risk_level || 'n/a').toUpperCase()} ({log.risk_score ?? 0}/100)
                        </p>
                        {log.notes && <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">{log.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-200">No fraud review logs yet.</p>
                )}
              </div>
            </div>
          )}

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
              
              <div className="grid grid-cols-3 gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                {/* First Row */}
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
                
                {/* Second Row */}
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

                {(referral.vital_signs_time || referral.vital_signs_date) && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Time Taken</p>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {referral.vital_signs_date && (
                        <p className="text-sm">{new Date(referral.vital_signs_date).toLocaleDateString()}</p>
                      )}
                      {referral.vital_signs_time && (
                        <p className="text-lg">{referral.vital_signs_time}</p>
                      )}
                    </div>
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

              {referral.mode_of_transportation && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mode of Transportation</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{referral.mode_of_transportation.replace(/_/g, ' ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Transit Information (Watcher Details) */}
          {referral.transit_info && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
              {referral.transit_info.remarks && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-1">Transit Remarks</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{referral.transit_info.remarks}</p>
                </div>
              )}
            </div>
          )}

          {/* Remarks Tab */}
          {(() => {
            const hasRemarks =
              referral.triage_notes ||
              referral.triage_remarks ||
              referral.triage_verification_notes ||
              referral.delay_reason ||
              (referral.transit_info?.remarks) ||
              (referral.status_history && referral.status_history.some((h: any) => h.notes));
            if (!hasRemarks) return null;
            return (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Remarks</h3>
                </div>
                <div className="space-y-3">
                  {referral.triage_notes && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">Triage Notes</p>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{referral.triage_notes}</p>
                    </div>
                  )}
                  {referral.triage_remarks && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg">
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400 mb-1">Triage Remarks (Department Assignment)</p>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{referral.triage_remarks}</p>
                    </div>
                  )}
                  {referral.triage_verification_notes && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50 rounded-lg">
                      <p className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400 mb-1">Triage Verification Notes</p>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{referral.triage_verification_notes}</p>
                    </div>
                  )}
                  {referral.transit_info?.remarks && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">Transit Remarks (from Referrer)</p>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{referral.transit_info.remarks}</p>
                    </div>
                  )}
                  {referral.delay_reason && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-1">Delay Reason</p>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{referral.delay_reason}</p>
                    </div>
                  )}
                  {referral.status_history && referral.status_history.filter((h: any) => h.notes).map((h: any) => (
                    <div key={h.id} className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {h.old_status?.replace(/_/g, ' ')} → {h.new_status?.replace(/_/g, ' ')}
                          {h.changed_by_name && ` · ${h.changed_by_name}`}
                          {h.changed_at && ` · ${new Date(h.changed_at).toLocaleString()}`}
                        </p>
                      </div>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{h.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
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
