import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { referralsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  PieChart, 
  TrendingUp,
  Building2,
  Users,
  Filter,
  Download,
  FileText,
  Image,
  ChevronDown,
  Info
} from "lucide-react";

interface ReportsData {
  summary: {
    total_referrals: number;
    successful_referrals: number;
    pending_referrals: number;
    cancelled_referrals: number;
    coordination_rate: number;
    cancellation_rate: number;
    recent_referrals: number;
    avg_processing_time_hours: number;
  };
  monthly_trends: Array<{
    month: string;
    count: number;
  }>;
  top_hospitals: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  status_distribution: Array<{
    status: string;
    count: number;
  }>;
  priority_distribution: Array<{
    priority: string;
    count: number;
  }>;
  specialty_distribution: Array<{
    name: string;
    count: number;
  }>;
}

type TimeFilter = 'week' | 'month';

const Reports = () => {
  const { user } = useAuth();
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Global filter that controls all sections
  const [globalFilter, setGlobalFilter] = useState<TimeFilter>('month');
  const [globalYear, setGlobalYear] = useState(new Date().getFullYear());
  const [globalMonth, setGlobalMonth] = useState(new Date().getMonth() + 1); // Default to current month for week filter
  
  const [referralsByTime, setReferralsByTime] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [loadingTimeData, setLoadingTimeData] = useState(false);
  
  // Data states
  const [hospitalsData, setHospitalsData] = useState<any[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  
  // Specialty data states
  const [specialtyData, setSpecialtyData] = useState<any[]>([]);
  const [loadingSpecialtyData, setLoadingSpecialtyData] = useState(false);
  
  // Regional data states
  const [regionalData, setRegionalData] = useState({
    coordinatedOverall: 0,
    uncoordinatedOverall: 0,
    coordinatedInsideDavao: 0,
    uncoordinatedInsideDavao: 0,
    coordinatedOutsideDavao: 0,
    uncoordinatedOutsideDavao: 0,
    delayDepartmentCount: 0
  });
  const [loadingRegionalData, setLoadingRegionalData] = useState(false);
  
  // Cancellation reasons state
  const [cancellationReasonsData, setCancellationReasonsData] = useState<{ reason: string; name: string; count: number; percentage: number }[]>([]);
  const [totalCancelled, setTotalCancelled] = useState(0);
  const [loadingCancellationReasons, setLoadingCancellationReasons] = useState(false);
  const [tatData, setTatData] = useState<any>(null);
  const [loadingTAT, setLoadingTAT] = useState(false);

  const { toast } = useToast();

  // Generate years for dropdown (current year and 4 years back)
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Fetch all filtered data using global filter
  const fetchAllFilteredData = async () => {
    try {
      setLoadingTimeData(true);
      setLoadingHospitals(true);
      setLoadingSpecialtyData(true);
      setLoadingRegionalData(true);

      // Determine the correct parameters based on filter type
      let apiMonth: number | undefined = 0;
      let apiWeek: number | undefined = 0;
      let apiYear = globalYear;
      
      if (globalFilter === 'week') {
        // Week filter: show weeks within the selected month
        // Use globalYear (now user-selectable) and the selected month
        apiYear = globalYear;
        apiMonth = globalMonth; // Pass the specific month to filter weeks within it
        apiWeek = undefined; // Don't pass week parameter to get all weeks in the month
      } else if (globalFilter === 'month') {
        // Month filter: show months within the selected year
        apiYear = globalYear;
        apiMonth = 0; // 0 means show all months in the year
        apiWeek = 0;
      }

      const [
        referralsByTimeData,
        departmentsData,
        hospitalsData,
        specialtiesData
      ] = await Promise.all([
        referralsAPI.getReferralsByTimePeriod(
          globalFilter, 
          apiYear, 
          apiMonth, 
          apiWeek
        ),
        referralsAPI.getTopDepartments(globalFilter, apiYear, apiMonth, apiWeek),
        referralsAPI.getTopHospitals(globalFilter, apiYear, apiMonth, apiWeek),
        referralsAPI.getTopSpecialties(globalFilter, apiYear, apiMonth, apiWeek)
      ]);

      setReferralsByTime(referralsByTimeData);
      setDepartmentData(departmentsData);
      setHospitalsData(hospitalsData);
      setSpecialtyData(specialtiesData);

      // Fetch cancellation reasons
      try {
        setLoadingCancellationReasons(true);
        const cancelData = await referralsAPI.getCancellationReasonsAnalytics(globalFilter, apiYear, apiMonth);
        setCancellationReasonsData(cancelData.reasons || []);
        setTotalCancelled(cancelData.total_cancelled || 0);
      } catch (e) {
        console.error('Error fetching cancellation reasons:', e);
      } finally {
        setLoadingCancellationReasons(false);
      }

      // Fetch TAT analytics
      try {
        setLoadingTAT(true);
        const tat = await referralsAPI.getTATAnalytics(globalFilter, apiYear, apiMonth);
        setTatData(tat);
      } catch (e) {
        console.error('Error fetching TAT analytics:', e);
      } finally {
        setLoadingTAT(false);
      }
      
      // Fetch regional data
      await fetchRegionalData();
    } catch (error: any) {
      console.error('Error fetching filtered data:', error);
      const errorMessage = error?.message || "Failed to load filtered data. Please try again.";
      toast({
        title: "Error Loading Data",
        description: errorMessage.includes('401') 
          ? "Authentication required. Please log in again." 
          : errorMessage.includes('404')
          ? "API endpoints not found. Please restart the Django backend server."
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingTimeData(false);
      setLoadingHospitals(false);
      setLoadingSpecialtyData(false);
      setLoadingRegionalData(false);
    }
  };

  // Fetch regional data
  const fetchRegionalData = async () => {
    try {
      // Determine the correct parameters based on filter type
      let apiMonth: number | undefined = 0;
      let apiWeek: number | undefined = 0;
      let apiYear = globalYear;
      
      if (globalFilter === 'week') {
        // Week filter: show weeks within the selected month
        apiYear = globalYear; // Use user-selected year
        apiMonth = globalMonth; // Pass the specific month to filter weeks within it
        apiWeek = undefined; // Don't pass week parameter to get all weeks in the month
      } else if (globalFilter === 'month') {
        // Month filter: show months within the selected year
        apiYear = globalYear;
        apiMonth = 0; // 0 means show all months in the year
        apiWeek = 0;
      }

      // For now, we'll use the existing coordinated/uncoordinated API calls
      // and calculate regional data based on hospital locations
      const [coordinatedData, uncoordinatedData] = await Promise.all([
        referralsAPI.getCoordinatedReferrals(globalFilter, apiYear, apiMonth, apiWeek),
        referralsAPI.getUncoordinatedReferrals(globalFilter, apiYear, apiMonth, apiWeek)
      ]);

      // Define Davao region hospitals/cities (this should ideally come from backend)
      const davaoRegionKeywords = [
        'davao', 'tagum', 'panabo', 'samal', 'digos', 'mati', 'malita',
        'davao city', 'davao del sur', 'davao del norte', 'davao oriental',
        'davao de oro', 'compostela valley'
      ];

      // Filter coordinated referrals by region
      const coordinatedInsideDavao = coordinatedData.filter((ref: any) => {
        const hospitalName = (ref.hospital_name || '').toLowerCase();
        const city = (ref.city || '').toLowerCase();
        return davaoRegionKeywords.some(keyword => 
          hospitalName.includes(keyword) || city.includes(keyword)
        );
      });

      const coordinatedOutsideDavao = coordinatedData.filter((ref: any) => {
        const hospitalName = (ref.hospital_name || '').toLowerCase();
        const city = (ref.city || '').toLowerCase();
        return !davaoRegionKeywords.some(keyword => 
          hospitalName.includes(keyword) || city.includes(keyword)
        );
      });

      // Filter uncoordinated referrals by region
      const uncoordinatedInsideDavao = uncoordinatedData.filter((ref: any) => {
        const hospitalName = (ref.hospital_name || '').toLowerCase();
        const city = (ref.city || '').toLowerCase();
        return davaoRegionKeywords.some(keyword => 
          hospitalName.includes(keyword) || city.includes(keyword)
        );
      });

      const uncoordinatedOutsideDavao = uncoordinatedData.filter((ref: any) => {
        const hospitalName = (ref.hospital_name || '').toLowerCase();
        const city = (ref.city || '').toLowerCase();
        return !davaoRegionKeywords.some(keyword => 
          hospitalName.includes(keyword) || city.includes(keyword)
        );
      });

      // Calculate delay department count (referrals with processing time > 24 hours)
      const delayDepartmentCount = coordinatedData.filter((ref: any) => {
        const processingTime = ref.processing_time_hours || 0;
        return processingTime > 24;
      }).length;

      setRegionalData({
        coordinatedOverall: coordinatedData.length,
        uncoordinatedOverall: uncoordinatedData.length,
        coordinatedInsideDavao: coordinatedInsideDavao.length,
        uncoordinatedInsideDavao: uncoordinatedInsideDavao.length,
        coordinatedOutsideDavao: coordinatedOutsideDavao.length,
        uncoordinatedOutsideDavao: uncoordinatedOutsideDavao.length,
        delayDepartmentCount: delayDepartmentCount
      });
    } catch (error) {
      console.error('Error fetching regional data:', error);
      // Set default values on error
      setRegionalData({
        coordinatedOverall: 0,
        uncoordinatedOverall: 0,
        coordinatedInsideDavao: 0,
        uncoordinatedInsideDavao: 0,
        coordinatedOutsideDavao: 0,
        uncoordinatedOutsideDavao: 0,
        delayDepartmentCount: 0
      });
    }
  };

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        const data = await referralsAPI.getReportsAnalytics();
        setReportsData(data);
      } catch (error) {
        console.error('Error fetching reports data:', error);
        toast({
          title: "Error",
          description: "Failed to load reports data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [toast]);



  // Fetch all filtered data when global filter or parameters change
  useEffect(() => {
    fetchAllFilteredData();
  }, [globalFilter, globalYear, globalMonth]);

  // Draw bar chart from referralsByTime data onto a canvas, return base64 PNG
  const drawBarChart = (data: any[]): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const padL = 55, padR = 20, padT = 30, padB = 60;
    const chartW = canvas.width - padL - padR;
    const chartH = canvas.height - padT - padB;
    const maxVal = Math.max(...data.map(d => d.count), 1);
    const step = Math.max(1, Math.ceil(maxVal / 4));
    const gridValues = Array.from({ length: 5 }, (_, i) => i * step);
    const actualMax = Math.max(maxVal, gridValues[gridValues.length - 1]);

    // Grid lines + Y labels
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#374151';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    gridValues.forEach(v => {
      const y = padT + chartH - (v / actualMax) * chartH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
      ctx.fillText(String(v), padL - 6, y + 4);
    });

    // Axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + chartH); ctx.lineTo(padL + chartW, padT + chartH); ctx.stroke();

    // Bars + X labels
    const barW = Math.max(16, (chartW / data.length) * 0.6);
    const spacing = chartW / data.length;
    data.forEach((item, i) => {
      const x = padL + i * spacing + (spacing - barW) / 2;
      const bh = (item.count / actualMax) * chartH;
      const y = padT + chartH - bh;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(x, y, barW, Math.max(bh, 2), 3);
      ctx.fill();
      // Value on top
      if (item.count > 0) {
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(item.count), x + barW / 2, y - 4);
      }
      // X label
      ctx.save();
      ctx.translate(x + barW / 2, padT + chartH + 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#374151';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      let label = item.period || '';
      if (label.length > 8) label = label.substring(0, 7) + '…';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    return canvas.toDataURL('image/png');
  };

  // Draw a donut/pie chart from { name, count }[] data onto a canvas, return base64 PNG
  const drawPieChart = (data: any[], colors: string[]): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 280;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = 140, cy = 140, outerR = 110, innerR = 60;
    const total = data.reduce((s, d) => s + d.count, 0) || 1;
    let startAngle = -Math.PI / 2;

    data.slice(0, 6).forEach((item, i) => {
      const slice = (item.count / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      startAngle += slice;
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Center total
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(total), cx, cy - 4);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Total', cx, cy + 14);

    // Legend
    const legendX = 295, legendStartY = 30;
    ctx.textAlign = 'left';
    data.slice(0, 6).forEach((item, i) => {
      const y = legendStartY + i * 36;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(legendX + 7, y + 7, 7, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 11px sans-serif';
      const name = item.name || item.department || '';
      const label = name.length > 22 ? name.substring(0, 21) + '…' : name;
      ctx.fillText(label, legendX + 20, y + 8);
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      const pct = ((item.count / total) * 100).toFixed(1);
      ctx.fillText(`${item.count} (${pct}%)`, legendX + 20, y + 22);
    });

    return canvas.toDataURL('image/png');
  };

  // Add a chart image to the PDF, centered, fixed 150x90mm
  const addChartImage = (pdf: jsPDF, image: string, pageWidth: number, yPosition: number): number => {
    const w = 150, h = 90;
    const x = (pageWidth - w) / 2;
    pdf.addImage(image, 'PNG', x, yPosition, w, h);
    return yPosition + h + 6;
  };

  // Download report function
  const handleDownloadReport = (includeGraphs: boolean) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Generate all three charts from data if needed
      let barChartImage: string | null = null;
      let hospitalsChartImage: string | null = null;
      let specialtyChartImage: string | null = null;
      let cancellationChartImage: string | null = null;
      if (includeGraphs) {
        if (referralsByTime.length > 0) barChartImage = drawBarChart(referralsByTime);
        if (hospitalsData.length > 0) hospitalsChartImage = drawPieChart(hospitalsData, ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']);
        if (specialtyData.length > 0) specialtyChartImage = drawPieChart(specialtyData, ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6']);
        const activeCancelReasons = cancellationReasonsData.filter(r => r.count > 0);
        if (activeCancelReasons.length > 0) cancellationChartImage = drawPieChart(activeCancelReasons, ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6']);
      }

      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text('SPMC REFERRAL SYSTEM', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.text('Comprehensive Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 12;

      // Metadata
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      pdf.text(`Filter: ${globalFilter.toUpperCase()}${globalFilter === 'month' ? ` | Year: ${globalYear}` : ''}${globalFilter === 'week' ? ` | Month: ${new Date(2024, globalMonth - 1).toLocaleString('default', { month: 'long' })}` : ''}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      pdf.text(`Report Type: ${includeGraphs ? 'With Graphs' : 'Without Graphs'}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Summary Statistics
      checkNewPage(60);
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Summary Statistics', 15, yPosition);
      yPosition += 8;

      const summaryData = [
        ['Total Referrals', String(reportsData?.summary.total_referrals || 0)],
        ['Coordinated Referrals', String(reportsData?.summary.successful_referrals || 0)],
        ['Pending Referrals', String(reportsData?.summary.pending_referrals || 0)],
        ['Cancelled Referrals', String(reportsData?.summary.cancelled_referrals || 0)],
        ['Coordination Rate', `${reportsData?.summary.coordination_rate || 0}%`],
        ['Cancellation Rate', `${reportsData?.summary.cancellation_rate || 0}%`],
        ['Recent Referrals (7 days)', String(reportsData?.summary.recent_referrals || 0)],
        ['Avg Processing Time', `${reportsData?.summary.avg_processing_time_hours || 0}h`],
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 },
      });
      yPosition = (pdf as any).lastAutoTable.finalY + 10;

      // Referrals by Time Period
      checkNewPage(barChartImage ? 110 : 40);
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Referrals by ${globalFilter.charAt(0).toUpperCase() + globalFilter.slice(1)}`, 15, yPosition);
      yPosition += 8;

      if (includeGraphs && barChartImage) {
        yPosition = addChartImage(pdf, barChartImage, pageWidth, yPosition);
      }

      const timeData = referralsByTime.map(item => [String(item.period), String(item.count)]);
      autoTable(pdf, {
        startY: yPosition,
        head: [['Period', 'Count']],
        body: timeData.length > 0 ? timeData : [['No data available', '']],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 },
      });
      yPosition = (pdf as any).lastAutoTable.finalY + 10;

      // Top Hospitals
      checkNewPage(hospitalsChartImage ? 110 : 40);
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Top Referring Hospitals', 15, yPosition);
      yPosition += 8;

      if (includeGraphs && hospitalsChartImage) {
        yPosition = addChartImage(pdf, hospitalsChartImage, pageWidth, yPosition);
      }

      const hospData = hospitalsData.map((hosp, idx) => [String(idx + 1), String(hosp.name), String(hosp.count), `${hosp.percentage}%`]);
      autoTable(pdf, {
        startY: yPosition,
        head: [['#', 'Hospital Name', 'Count', 'Percentage']],
        body: hospData.length > 0 ? hospData : [['', 'No data available', '', '']],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 },
      });
      yPosition = (pdf as any).lastAutoTable.finalY + 10;

      // Specialty Required
      checkNewPage(specialtyChartImage ? 110 : 40);
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Specialty Required', 15, yPosition);
      yPosition += 8;

      if (includeGraphs && specialtyChartImage) {
        yPosition = addChartImage(pdf, specialtyChartImage, pageWidth, yPosition);
      }

      const specData = specialtyData.map((s, idx) => {
        const total = specialtyData.reduce((sum: number, x: any) => sum + x.count, 0);
        return [String(idx + 1), String(s.name), String(s.count), `${((s.count / total) * 100).toFixed(1)}%`];
      });
      autoTable(pdf, {
        startY: yPosition,
        head: [['#', 'Specialty', 'Count', 'Percentage']],
        body: specData.length > 0 ? specData : [['', 'No data available', '', '']],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 },
      });
      yPosition = (pdf as any).lastAutoTable.finalY + 10;

      // Cancellation Reasons
      checkNewPage(cancellationChartImage ? 110 : 40);
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Cancellation Reasons', 15, yPosition);
      yPosition += 8;

      if (includeGraphs && cancellationChartImage) {
        yPosition = addChartImage(pdf, cancellationChartImage, pageWidth, yPosition);
      }

      const cancelData = cancellationReasonsData.map((r, idx) => [
        String(idx + 1),
        r.name,
        String(r.count),
        `${r.percentage}%`,
      ]);
      autoTable(pdf, {
        startY: yPosition,
        head: [['#', 'Reason', 'Count', 'Percentage']],
        body: cancelData.length > 0 ? cancelData : [['', 'No data available', '', '']],
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 },
      });
      yPosition = (pdf as any).lastAutoTable.finalY + 10;

      // Status Distribution
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Status Distribution', 15, yPosition);
      yPosition += 8;

      const statusData = reportsData?.status_distribution.map(status => [String(status.status), String(status.count)]) || [];
      autoTable(pdf, {
        startY: yPosition,
        head: [['Status', 'Count']],
        body: statusData.length > 0 ? statusData : [['No data available', '']],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 },
      });
      yPosition = (pdf as any).lastAutoTable.finalY + 10;

      // Priority Distribution
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Priority Distribution', 15, yPosition);
      yPosition += 8;

      const priorityData = reportsData?.priority_distribution.map(priority => [String(priority.priority), String(priority.count)]) || [];
      autoTable(pdf, {
        startY: yPosition,
        head: [['Priority', 'Count']],
        body: priorityData.length > 0 ? priorityData : [['No data available', '']],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        margin: { left: 15, right: 15 },
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const graphType = includeGraphs ? 'WithGraphs' : 'WithoutGraphs';
      const filename = `SPMC_Report_${graphType}_${timestamp}.pdf`;
      pdf.save(filename);

      toast({
        title: "Success",
        description: `Report downloaded as ${filename}`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Determine which layout to use based on user role
  const Layout = user?.permissions?.is_admin_user ? AdminDashboardLayout : DashboardLayout;

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">Loading reports data...</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!reportsData) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">Failed to load reports data</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Destructure data after null checks
  const { summary } = reportsData;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">Comprehensive referral system analytics and insights</p>
          </div>
          
          {/* Global Filter */}
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Global Filter:</span>
              </div>
              <div className="flex gap-2">
                {(['week', 'month'] as TimeFilter[]).map((filter) => (
                  <Button
                    key={filter}
                    variant={globalFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setGlobalFilter(filter);
                      // Set appropriate defaults when switching filter type
                      if (filter === 'week') {
                        // For week filter, ensure we have a specific month selected
                        if (globalMonth === 0) {
                          setGlobalMonth(new Date().getMonth() + 1);
                        }
                      }
                    }}
                    className="text-sm"
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
              
              {/* Year Selector - Only show for Month filter */}
              {globalFilter === 'month' && (
                <select
                  value={globalYear}
                  onChange={(e) => setGlobalYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
              
              {/* Year + Month Selector - Only show for Week filter */}
              {globalFilter === 'week' && (
                <>
                  <select
                    value={globalYear}
                    onChange={(e) => setGlobalYear(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    value={globalMonth}
                    onChange={(e) => setGlobalMonth(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={1}>January</option>
                    <option value={2}>February</option>
                    <option value={3}>March</option>
                    <option value={4}>April</option>
                    <option value={5}>May</option>
                    <option value={6}>June</option>
                    <option value={7}>July</option>
                    <option value={8}>August</option>
                    <option value={9}>September</option>
                    <option value={10}>October</option>
                    <option value={11}>November</option>
                    <option value={12}>December</option>
                  </select>
                </>
              )}
            </div>
            
            {/* Download Button with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleDownloadReport(true)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Image className="w-4 h-4" />
                  <span>With Graphs</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownloadReport(false)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Without Graphs</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-2">Total Referrals</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.total_referrals.toLocaleString()}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {summary.recent_referrals} in last 7 days
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">Coordinated</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.successful_referrals.toLocaleString()}</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {summary.coordination_rate}% coordination rate
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{summary.pending_referrals.toLocaleString()}</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              Avg. {summary.avg_processing_time_hours.toFixed(1)} hours
            </p>
          </div>
          
          <div className="bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Cancelled</h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.cancelled_referrals.toLocaleString()}</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {summary.cancellation_rate}% cancellation rate
            </p>
          </div>
        </div>
        
        {/* Referrals and Charts Row - Three Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* First Column: Referrals by Time Period - Bar Graph */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300 min-h-[650px]">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Referrals by {globalFilter.charAt(0).toUpperCase() + globalFilter.slice(1)}</h3>
            </div>
            
            {loadingTimeData ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : referralsByTime.length > 0 ? (
              <div className="space-y-4">
                {/* Column Bar Graph Container */}
                <div id="bar-chart" className="h-80 w-full">
                  <svg className="w-full h-full" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid meet">
                    {/* Background */}
                    <rect width="100%" height="100%" fill="transparent" />
                    
                    {/* Y-axis */}
                    <line x1="60" y1="30" x2="60" y2="220" stroke="#374151" strokeWidth="2"/>
                    
                    {/* X-axis */}
                    <line x1="60" y1="220" x2="450" y2="220" stroke="#374151" strokeWidth="2"/>
                    
                    {/* Horizontal grid lines */}
                    {(() => {
                      const maxValue = Math.max(...referralsByTime.map(item => item.count), 1);
                      // Ensure we have at least 4 steps, but make them meaningful
                      const step = Math.max(1, Math.ceil(maxValue / 4));
                      // Create proper incremental values: 0, step, step*2, step*3, step*4
                      const gridValues = Array.from({ length: 5 }, (_, i) => i * step);
                      // Ensure the last value covers the max
                      const actualMaxValue = Math.max(maxValue, gridValues[gridValues.length - 1]);
                      
                      return gridValues.map((value, index) => (
                        <line 
                          key={index}
                          x1="60" 
                          y1={220 - (value / actualMaxValue) * 190} 
                          x2="450" 
                          y2={220 - (value / actualMaxValue) * 190} 
                          stroke="#e5e7eb" 
                          strokeWidth="1"
                          opacity="0.5"
                        />
                      ));
                    })()}
                    
                    {/* Y-axis labels */}
                    {(() => {
                      const maxValue = Math.max(...referralsByTime.map(item => item.count), 1);
                      // Ensure we have at least 4 steps, but make them meaningful
                      const step = Math.max(1, Math.ceil(maxValue / 4));
                      // Create proper incremental values: 0, step, step*2, step*3, step*4
                      const gridValues = Array.from({ length: 5 }, (_, i) => i * step);
                      // Ensure the last value covers the max
                      const actualMaxValue = Math.max(maxValue, gridValues[gridValues.length - 1]);
                      
                      return gridValues.map((value, index) => (
                        <text 
                          key={index}
                          x="50" 
                          y={225 - (value / actualMaxValue) * 190} 
                          className="text-sm fill-gray-700 dark:fill-gray-300 font-semibold" 
                          textAnchor="end"
                          dominantBaseline="middle"
                        >
                          {value}
                        </text>
                      ));
                    })()}
                    
                    {/* Column bars */}
                    {referralsByTime.map((item, index) => {
                      const maxValue = Math.max(...referralsByTime.map(item => item.count), 1);
                      // Ensure we have at least 4 steps, but make them meaningful
                      const step = Math.max(1, Math.ceil(maxValue / 4));
                      // Create proper incremental values: 0, step, step*2, step*3, step*4
                      const gridValues = Array.from({ length: 5 }, (_, i) => i * step);
                      // Ensure the last value covers the max
                      const actualMaxValue = Math.max(maxValue, gridValues[gridValues.length - 1]);
                      
                      const barWidth = Math.max(20, 350 / referralsByTime.length * 0.6); // Minimum 20px width, 60% of space
                      const barSpacing = 350 / referralsByTime.length;
                      const x = 60 + (index * barSpacing) + (barSpacing - barWidth) / 2;
                      const barHeight = (item.count / actualMaxValue) * 190;
                      const y = 220 - barHeight;
                      
                      return (
                        <g key={index}>
                          {/* Bar */}
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={Math.max(barHeight, 2)} // Minimum 2px height for visibility
                            fill="#3b82f6"
                            className="hover:fill-blue-700 transition-colors cursor-pointer"
                            rx="3"
                            ry="3"
                          />
                          {/* Value label on top of bar - only show if value > 0 */}
                          {item.count > 0 && (
                            <text
                              x={x + barWidth / 2}
                              y={y - 8}
                              className="text-sm fill-gray-800 dark:fill-gray-200 font-bold"
                              textAnchor="middle"
                              dominantBaseline="text-after-edge"
                            >
                              {item.count}
                            </text>
                          )}
                          {/* Hover tooltip */}
                          <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                            <rect
                              x={x + barWidth / 2 - 35}
                              y={y - 45}
                              width="70"
                              height="28"
                              fill="rgba(0,0,0,0.9)"
                              rx="6"
                            />
                            <text
                              x={x + barWidth / 2}
                              y={y - 32}
                              className="text-sm fill-white font-bold"
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              {item.count}
                            </text>
                            <text
                              x={x + barWidth / 2}
                              y={y - 18}
                              className="text-xs fill-gray-300"
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              referrals
                            </text>
                          </g>
                        </g>
                      );
                    })}
                    
                    {/* X-axis labels - rotated and properly spaced to prevent overlap */}
                    {referralsByTime.map((item, index) => {
                      const barSpacing = 350 / referralsByTime.length;
                      const x = 60 + (index * barSpacing) + barSpacing / 2;
                      
                      // Clean up the period label - remove redundancy and improve readability
                      let displayLabel = item.period;
                      
                      // Remove redundant parenthetical information if it's the same as the main label
                      if (item.full_period && item.period !== item.full_period) {
                        // Check if the full_period contains redundant information
                        const periodLower = item.period.toLowerCase();
                        const fullPeriodLower = item.full_period.toLowerCase();
                        
                        // If full_period just repeats the period, use only the period
                        if (fullPeriodLower.includes(periodLower) && fullPeriodLower.includes('(') && fullPeriodLower.includes(')')) {
                          displayLabel = item.period;
                        } else {
                          // Use the shorter, cleaner version
                          displayLabel = item.period.length <= item.full_period.length ? item.period : item.full_period;
                        }
                      }
                      
                      // For better readability, shorten labels if there are many items
                      if (referralsByTime.length > 6 && displayLabel.length > 6) {
                        displayLabel = displayLabel.substring(0, 4) + '...';
                      } else if (displayLabel.length > 12) {
                        displayLabel = displayLabel.substring(0, 10) + '...';
                      }
                      
                      return (
                        <text
                          key={index}
                          x={x}
                          y="245"
                          className="text-xs fill-gray-800 dark:fill-gray-200 font-semibold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(-45 ${x} 245)`}
                        >
                          {displayLabel}
                        </text>
                      );
                    })}
                  </svg>
                </div>
                
                {/* Data list below graph - improved spacing and larger scrollable area */}
                <div className="space-y-3 max-h-48 overflow-y-auto border-t pt-4 mt-4">
                  {referralsByTime.map((item, index) => {
                    // Clean up display labels to remove redundancy
                    let displayLabel = item.period;
                    let additionalInfo = '';
                    
                    if (item.full_period && item.period !== item.full_period) {
                      // Check if full_period contains redundant information
                      const periodLower = item.period.toLowerCase();
                      const fullPeriodLower = item.full_period.toLowerCase();
                      
                      // If full_period just repeats the period, don't show it
                      if (!fullPeriodLower.includes(periodLower) || (!fullPeriodLower.includes('(') && !fullPeriodLower.includes(')'))) {
                        additionalInfo = item.full_period;
                      }
                    }
                    
                    return (
                      <div key={index} className="flex items-center justify-between text-sm py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-blue-600 rounded-full flex-shrink-0"></div>
                          <div className="flex flex-col">
                            <span className="text-gray-800 dark:text-gray-200 font-medium">
                              {displayLabel}
                            </span>
                            {additionalInfo && (
                              <span className="text-gray-500 dark:text-gray-400 text-xs">
                                {additionalInfo}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-bold text-gray-900 dark:text-white text-lg">{item.count}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">referrals</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available for the selected period</p>
            )}
          </div>

          {/* Second Column: Top Referring Hospitals - Pie Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300 min-h-[650px]">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Referring Hospitals</h3>
            </div>
            
            <div className="h-full flex flex-col">
              {loadingHospitals ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : hospitalsData.length > 0 ? (
                <>
                  {/* Pie Chart Visualization - Same size as bar graph */}
                  <div id="hospitals-pie-chart" className="h-80 w-full flex items-center justify-center mb-4">
                    <div className="relative w-64 h-64">
                      <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                        {hospitalsData.slice(0, 6).map((hospital, index) => {
                          const totalHospitalReferrals = hospitalsData.reduce((sum, h) => sum + h.count, 0);
                          const percentage = (hospital.count / totalHospitalReferrals) * 100;
                          const circumference = 2 * Math.PI * 30; // 2πr where r=30
                          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                          
                          // Calculate the offset based on previous segments
                          const previousPercentages = hospitalsData
                            .slice(0, index)
                            .reduce((acc, h) => acc + (h.count / totalHospitalReferrals) * 100, 0);
                          const strokeDashoffset = -(previousPercentages / 100) * circumference;
                          
                          // Generate colors for hospitals
                          const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
                          
                          return (
                            <circle
                              key={index}
                              cx="50"
                              cy="50"
                              r="30"
                              fill="transparent"
                              stroke={colors[index % colors.length]}
                              strokeWidth="8"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-300 hover:stroke-width-10"
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {hospitalsData.reduce((sum, h) => sum + h.count, 0)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend - Same style as bar graph data list */}
                  <div className="space-y-3 max-h-48 overflow-y-auto border-t pt-4 mt-4">
                    {hospitalsData.slice(0, 6).map((hospital, index) => {
                      const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
                      return (
                        <div key={index} className="flex items-center justify-between text-sm py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: colors[index % colors.length] }}
                            ></div>
                            <div className="flex flex-col">
                              <span className="text-gray-800 dark:text-gray-200 font-medium" title={hospital.name}>
                                {hospital.name}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 text-xs">
                                {hospital.percentage}% of total
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-bold text-gray-900 dark:text-white text-lg">{hospital.count}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">referrals</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center flex-1 flex items-center justify-center">No hospital data available</p>
              )}
            </div>
          </div>

          {/* Third Column: Specialty Required - Pie Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg transition-colors duration-300 min-h-[650px]">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Specialty Required</h3>
            </div>
            
            <div className="h-full flex flex-col">
              {/* Pie Chart Visualization */}
              {loadingSpecialtyData ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : specialtyData.length > 0 ? (
                <>
                  <div className="h-80 w-full flex items-center justify-center mb-4" id="specialty-pie-chart">
                    <div className="relative w-64 h-64">
                      <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                        {specialtyData.slice(0, 6).map((specialty, index) => {
                          const totalSpecialtyReferrals = specialtyData.reduce((sum, s) => sum + s.count, 0);
                          const percentage = (specialty.count / totalSpecialtyReferrals) * 100;
                          const circumference = 2 * Math.PI * 30; // 2πr where r=30
                          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                          
                          // Calculate the offset based on previous segments
                          const previousPercentages = specialtyData
                            .slice(0, index)
                            .reduce((acc, s) => acc + (s.count / totalSpecialtyReferrals) * 100, 0);
                          const strokeDashoffset = -(previousPercentages / 100) * circumference;
                          
                          // Generate colors for specialties
                          const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
                          
                          return (
                            <circle
                              key={index}
                              cx="50"
                              cy="50"
                              r="30"
                              fill="transparent"
                              stroke={colors[index % colors.length]}
                              strokeWidth="8"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-300 hover:stroke-width-10"
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {specialtyData.reduce((sum, s) => sum + s.count, 0)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend - Same style as bar graph data list */}
                  <div className="space-y-3 max-h-48 overflow-y-auto border-t pt-4 mt-4">
                    {specialtyData.slice(0, 6).map((specialty, index) => {
                      const totalSpecialtyReferrals = specialtyData.reduce((sum, s) => sum + s.count, 0);
                      const percentage = ((specialty.count / totalSpecialtyReferrals) * 100).toFixed(1);
                      const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
                      
                      return (
                        <div key={index} className="flex items-center justify-between text-sm py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: colors[index % colors.length] }}
                            ></div>
                            <div className="flex flex-col">
                              <span className="text-gray-800 dark:text-gray-200 font-medium" title={specialty.name}>
                                {specialty.name}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 text-xs">
                                {percentage}% of total
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-bold text-gray-900 dark:text-white text-lg">{specialty.count}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">referrals</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center flex-1 flex items-center justify-center">No specialty data available</p>
              )}
            </div>
          </div>
        
        {/* Close the three-column grid */}
        </div>

        {/* Cancellation Reasons Pie Chart */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cancellation Reasons</h3>
            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              Total cancelled: <span className="font-semibold text-gray-900 dark:text-white">{totalCancelled}</span>
            </span>
          </div>

          {loadingCancellationReasons ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Pie chart */}
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                    {totalCancelled === 0 ? (
                      <circle cx="50" cy="50" r="30" fill="transparent" stroke="#e5e7eb" strokeWidth="8" />
                    ) : (
                      (() => {
                        const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#10b981','#f59e0b','#6366f1','#84cc16','#14b8a6'];
                        const active = cancellationReasonsData.filter(r => r.count > 0);
                        const circumference = 2 * Math.PI * 30;
                        let cumPct = 0;
                        return active.map((item, i) => {
                          const pct = item.count / totalCancelled;
                          const dash = `${pct * circumference} ${circumference}`;
                          const offset = -(cumPct * circumference);
                          cumPct += pct;
                          return (
                            <circle
                              key={item.reason}
                              cx="50" cy="50" r="30"
                              fill="transparent"
                              stroke={COLORS[i % COLORS.length]}
                              strokeWidth="8"
                              strokeDasharray={dash}
                              strokeDashoffset={offset}
                            />
                          );
                        });
                      })()
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{totalCancelled}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cancelled</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend / table */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(() => {
                  const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#10b981','#f59e0b','#6366f1','#84cc16','#14b8a6'];
                  const active = cancellationReasonsData.filter(r => r.count > 0);
                  const inactive = cancellationReasonsData.filter(r => r.count === 0);
                  const sorted = [...active, ...inactive];
                  return sorted.map((item, i) => (
                    <div key={item.reason} className="flex items-center justify-between text-sm py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: i < active.length ? COLORS[i % COLORS.length] : '#d1d5db' }} />
                        <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-gray-500 dark:text-gray-400 text-xs w-12 text-right">{item.percentage}%</span>
                        <span className="font-semibold text-gray-900 dark:text-white w-6 text-right">{item.count}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>


        {/* TAT Analytics Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Turnaround Time (TAT) Analytics</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Target: 90% within</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">30 minutes</span>
            </div>
          </div>

          {loadingTAT ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : !tatData || tatData.total_measured === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No TAT data yet. Data appears once EDCC/EDMA assigns departments to referrals.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{tatData.total_measured}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Total Measured</p>
                </div>
                <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{tatData.within_target}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Within 30 min</p>
                </div>
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-center">
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{tatData.exceeded_target}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">Exceeded 30 min</p>
                </div>
                <div className={`rounded-lg border p-4 text-center ${
                  tatData.compliance_rate >= 90
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                }`}>
                  <p className={`text-2xl font-bold ${tatData.compliance_rate >= 90 ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {tatData.compliance_rate}%
                  </p>
                  <p className={`text-xs mt-1 ${tatData.compliance_rate >= 90 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    Compliance Rate {tatData.compliance_rate >= 90 ? '✓' : '⚠'}
                  </p>
                </div>
              </div>

              {/* Target indicator */}
              <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                tatData.compliance_rate >= 90
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                  : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
              }`}>
                <span className="text-xl">{tatData.compliance_rate >= 90 ? '✅' : '⚠️'}</span>
                <div>
                  <p className={`text-sm font-semibold ${tatData.compliance_rate >= 90 ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'}`}>
                    {tatData.compliance_rate >= 90
                      ? `Target met — ${tatData.compliance_rate}% of referrals processed within 30 minutes`
                      : `Target not yet met — ${tatData.compliance_rate}% of referrals processed within 30 minutes (target: 90%)`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Average TAT: {tatData.avg_tat_minutes} minutes</p>
                </div>
              </div>

              {/* Distribution bar chart */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Response Time Distribution</p>
                <div className="space-y-3">
                  {tatData.distribution.map((bucket: any, i: number) => {
                    const maxCount = Math.max(...tatData.distribution.map((b: any) => b.count), 1);
                    const pct = Math.round((bucket.count / maxCount) * 100);
                    const isWithinTarget = i < 3; // 0-10, 10-20, 20-30 are within 30 min
                    return (
                      <div key={bucket.label} className="flex items-center gap-3">
                        <span className="w-20 text-xs text-right text-gray-600 dark:text-gray-400 flex-shrink-0">{bucket.label}</span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                          <div
                            className={`h-full rounded-full flex items-center justify-end pr-2 transition-all ${
                              isWithinTarget ? 'bg-green-500 dark:bg-green-600' : 'bg-red-400 dark:bg-red-600'
                            }`}
                            style={{ width: `${pct}%`, minWidth: bucket.count > 0 ? '2rem' : '0' }}
                          >
                            {bucket.count > 0 && (
                              <span className="text-xs font-semibold text-white">{bucket.count}</span>
                            )}
                          </div>
                        </div>
                        <span className="w-20 text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">
                          {tatData.total_measured > 0 ? `${((bucket.count / tatData.total_measured) * 100).toFixed(1)}%` : '0%'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Within 30 min target</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span> Exceeded target</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* New Report Categories Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detailed Report Categories</h2>
          </div>
          
          {loadingRegionalData ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Coordinated Overall */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-lg hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Coordinated Overall</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">All Regions</p>
                    </div>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-2 py-1 rounded text-xs font-medium">
                    Active
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Count of all referrals in all regions
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">{regionalData.coordinatedOverall.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Referrals</span>
                </div>
              </div>

              {/* Cancelled Overall */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-lg hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Cancelled Overall</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">All Regions</p>
                    </div>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 px-2 py-1 rounded text-xs font-medium">
                    Active
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Count of all cancelled referrals
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">{regionalData.uncoordinatedOverall.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Referrals</span>
                </div>
              </div>

              {/* Coordinated Inside Davao */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-lg hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Coordinated Inside Davao</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Davao Region</p>
                    </div>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded text-xs font-medium">
                    Active
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Referrals inside Davao City, Davao del Sur region
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{regionalData.coordinatedInsideDavao.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Referrals</span>
                </div>
              </div>

              {/* Cancelled Inside Davao */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-lg hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Cancelled Inside Davao</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Davao Region</p>
                    </div>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 px-2 py-1 rounded text-xs font-medium">
                    Active
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Cancelled referrals inside Davao City, Davao del Sur
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{regionalData.uncoordinatedInsideDavao.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Referrals</span>
                </div>
              </div>

              {/* Coordinated Outside Davao */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-lg hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Coordinated Outside Davao</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Outside Davao</p>
                    </div>
                  </div>
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-2 py-1 rounded text-xs font-medium">
                    Active
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Referrals outside Davao City, Davao del Sur region
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{regionalData.coordinatedOutsideDavao.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Referrals</span>
                </div>
              </div>

              {/* Cancelled Outside Davao */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-lg hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Cancelled Outside Davao</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Outside Davao</p>
                    </div>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded text-xs font-medium">
                    Active
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Cancelled referrals outside Davao City, Davao del Sur
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{regionalData.uncoordinatedOutsideDavao.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Referrals</span>
                </div>
              </div>

              {/* Delay Department */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-lg hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Delay Department</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Processing Delays</p>
                    </div>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 px-2 py-1 rounded text-xs font-medium">
                    Active
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Referrals with processing time over 24 hours
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{regionalData.delayDepartmentCount.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Referrals</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">Regional Data Information</h4>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Regional categorization is based on hospital location and city data. Davao region includes Davao City, Davao del Sur, Davao del Norte, Davao Oriental, and Davao de Oro. 
                  Data is filtered according to the selected time period above.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Reports;