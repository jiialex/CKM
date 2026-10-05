import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, ChevronLeft, ChevronRight, 
  AlertTriangle, Shield, Users, Percent, FileSpreadsheet, FileText, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from '../../api/axios';

const AuditDashboard = () => {
  // --- Core UI State Management ---
  const [viewMode, setViewMode] = useState('dashboard'); 
  const [logs, setLogs] = useState([]);
  
  // Real-time client-aggregated analytics states
  const [stats, setStats] = useState({ totalLogs: 0, criticalEvents: 0, uniqueUsers: 0, complianceRate: 100 });
  const [timeSeries, setTimeSeries] = useState([]);
  const [topResources, setTopResources] = useState([]);
  const [severityPie, setSeverityPie] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Pagination Engine Trackers
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Spring Boot AuditFilterRequest DTO Model
  const [filters, setFilters] = useState({
    username: '',
    action: '',
    status: '', 
    resource: '',
    target: '',
    from: null,
    to: null
  });

  // --- Dynamic Client-Side SIEM Aggregator ---
  const calculateAnalyticsFromLogs = (rawLogs) => {
    if (!Array.isArray(rawLogs) || rawLogs.length === 0) {
      setStats({ totalLogs: 0, criticalEvents: 0, uniqueUsers: 0, complianceRate: 100 });
      setTimeSeries([]);
      setTopResources([]);
      setSeverityPie([]);
      return;
    }

    const total = rawLogs.length;
    
    // 1. Filter out Critical Security Breaches 
    const critical = rawLogs.filter(log => 
      log.severity === 'CRITICAL' || log.status === 'FAILED'
    ).length;

    // 2. Map Unique Operator Profiles
    const uniqueUsersSet = new Set(rawLogs.map(log => log.username).filter(Boolean));
    const uniqueUsersCount = uniqueUsersSet.size === 0 ? 1 : uniqueUsersSet.size;

    // 3. Compute Operational Success Rate Percentage
    const successCount = rawLogs.filter(log => log.status === 'SUCCESS').length;
    const compliance = total > 0 ? Math.round((successCount / total) * 100) : 100;

    setStats({
      totalLogs: total,
      criticalEvents: critical,
      uniqueUsers: uniqueUsersCount,
      complianceRate: compliance
    });

    // 4. Generate Time Series Distribution Grouped by Day-of-Week
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const timeMap = {};
    
    daysOfWeek.forEach(day => {
      timeMap[day] = { name: day, Success: 0, Failures: 0 };
    });

    rawLogs.forEach(log => {
      if (log.timestamp) {
        const dateObj = new Date(log.timestamp);
        const dayName = daysOfWeek[dateObj.getDay()];
        if (log.status === 'SUCCESS') {
          timeMap[dayName].Success += 1;
        } else {
          timeMap[dayName].Failures += 1;
        }
      }
    });
    setTimeSeries(Object.values(timeMap));

    // 5. Aggregate Top Target Workspaces
    const resourceMap = {};
    rawLogs.forEach(log => {
      const resName = log.resource || log.target || 'GLOBAL';
      resourceMap[resName] = (resourceMap[resName] || 0) + 1;
    });

    const sortedResources = Object.entries(resourceMap)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    setTopResources(sortedResources);

    // 6. Aggregate Radial Severity Pie Charts
    let lowCount = 0, medCount = 0, highCount = 0;
    rawLogs.forEach(log => {
      if (log.severity === 'CRITICAL' || log.status === 'FAILED') highCount++;
      else if (log.severity === 'MEDIUM') medCount++;
      else lowCount++;
    });

    setSeverityPie([
      { name: 'Low Risk Events', value: lowCount, color: '#10b981' },
      { name: 'Medium Risk Events', value: medCount, color: '#f59e0b' },
      { name: 'Critical Actions', value: highCount, color: '#ef4444' }
    ].filter(item => item.value > 0));
  };

  // --- Dynamic API Execution Commits ---
  const executeLogSearch = async (currentFilters = filters) => {
    setLoading(true);
    try {
      const cleanedPayload = Object.fromEntries(
        Object.entries(currentFilters).map(([k, v]) => [k, v === '' ? null : v])
      );
      
      const response = await api.post('/audit/logs/search', cleanedPayload);
      const dataPayload = Array.isArray(response.data) ? response.data : [];
      
      setLogs(dataPayload);
      calculateAnalyticsFromLogs(dataPayload);
    } catch (err) {
      console.error("SIEM pipeline search query rejected. Checking structural fallbacks...", err);
      try {
        const fallbackRes = await api.get('/audit/logs');
        const fallbackData = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
        setLogs(fallbackData);
        calculateAnalyticsFromLogs(fallbackData);
      } catch (fallbackErr) {
        console.error("Critical Fallback route failed.", fallbackErr);
        setLogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- CSV Matrix Streaming ---
  const handleCsvExport = async () => {
    try {
      const cleanedPayload = Object.fromEntries(
        Object.entries(filters).map(([k, v]) => [k, v === '' ? null : v])
      );
      const response = await api.post('/audit/export/csv', cleanedPayload, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'text/csv;charset=UTF-8' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `SIEM-AuditReportMatrix-${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (err) {
      console.error("CSV engine connection failure:", err);
    }
  };

  // --- Programmatic Vector-Based PDF Document Compilation Engine ---
 const generateProgrammaticPdfReport = () => {
  setExporting(true);

  try {
    const doc = new jsPDF("p", "mm", "a4");
    const timestampString = new Date().toLocaleString();

    // ==============================
    // 1. HEADER BANNER
    // ==============================
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text("EXECUTIVE COMPLIANCE AUDIT REPORT", 14, 16);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated: ${timestampString}  |  Classification: Restricted Internal Audit`,
      14,
      24
    );

    doc.text(
      `Active Search Scope: ${filters.action || "ALL_METHODS"} | Target Profile: ${
        filters.username || "ALL_USERS"
      }`,
      14,
      29
    );

    // ==============================
    // 2. STATS CARDS
    // ==============================
    doc.setFillColor(248, 250, 252);

    doc.rect(14, 46, 42, 24, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text(String(stats.totalLogs), 18, 62);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("TOTAL LOG ENTRIES", 18, 52);

    doc.rect(62, 46, 42, 24, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text(String(stats.uniqueUsers), 66, 62);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("UNIQUE OPERATORS", 66, 52);

    doc.rect(110, 46, 42, 24, "F");
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(14);
    doc.text(String(stats.criticalEvents), 114, 62);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("CRITICAL INCIDENTS", 114, 52);

    doc.rect(154, 46, 42, 24, "F");
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.text(`${stats.complianceRate}%`, 158, 62);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("SUCCESS RATE", 158, 52);

    // ==============================
    // 3. ANALYTICS HEADER
    // ==============================
    let y = 82;

    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("System Operational Analytics Breakdown", 14, y);

    y += 6;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(
      "The downstream data array registers historical distribution vectors over execution traces.",
      14,
      y
    );

    // ==============================
    // 4. RESOURCE LIST
    // ==============================
    y += 10;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Target Object Workspace Allocations:", 14, y);

    y += 6;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);

    if (!topResources?.length) {
      doc.text("No mapped resources available.", 18, y);
      y += 6;
    } else {
      topResources.forEach((item) => {
        doc.text(
          `• ${item.name} - ${item.percentage}%`,
          18,
          y
        );
        y += 5.5;
      });
    }

    // ==============================
    // 5. PIE DATA LIST
    // ==============================
    y += 4;

    doc.setFont("Helvetica", "bold");
    doc.text("Operational Risk Vectors:", 14, y);

    y += 6;

    doc.setFont("Helvetica", "normal");

    severityPie?.forEach((entry) => {
      doc.text(
        `• ${entry.name} - ${entry.value} Records`,
        18,
        y
      );
      y += 5.5;
    });

    // ==============================
    // 6. TABLE (FIXED AUTO TABLE)
    // ==============================
    const tableRows = logs.map((log, index) => [
      index + 1,
      log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A",
      log.username || "SYSTEM_DAEMON",
      log.action || "UNKNOWN_ACTION",
      log.status || "UNVALUATED",
    ]);

    autoTable(doc, {
      startY: y + 10,
      head: [
        [
          "Index",
          "Timestamp",
          "User",
          "Action",
          "Status",
        ],
      ],
      body: tableRows,

      theme: "striped",

      headStyles: {
        fillColor: [15, 23, 42],
        fontSize: 9,
        fontStyle: "bold",
      },

      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
      },

      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
        1: { cellWidth: 45 },
        2: { cellWidth: 35 },
        3: { cellWidth: 55 },
        4: { cellWidth: 25, halign: "center" },
      },

      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const val = data.cell.raw;

          if (val === "SUCCESS") {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = "bold";
          }

          if (val === "FAILED") {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    // ==============================
    // SAVE PDF
    // ==============================
    doc.save(`SIEM-AuditReport-${Date.now()}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
  } finally {
    setExporting(false);
  }
};

  useEffect(() => {
    executeLogSearch();
  }, []);

  const handleFilterInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    executeLogSearch(updatedFilters);
  };

  const clearFilters = () => {
    const freshState = { username: '', action: '', status: '', resource: '', target: '', from: null, to: null };
    setFilters(freshState);
    setCurrentPage(1);
    executeLogSearch(freshState);
  };

  // Slicing operations
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  return (
    <div style={{ backgroundColor: '#f3f4f9' }} className="w-full min-h-screen text-slate-800 font-sans p-8">
      <div className="max-w-[1350px] mx-auto">
        
        {/* VIEW SEGMENT 1: SUMMARY BOARD */}
        {viewMode === 'dashboard' && (
          <>
            <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Matrix</h1>
                <p className="text-xs font-medium text-slate-400 mt-0.5">System Audit & Compliance Telemetry Platform</p>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center w-64 shadow-sm">
                  <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search logs..." 
                    name="target"
                    value={filters.target}
                    onChange={handleFilterInputChange}
                    className="bg-transparent text-xs outline-none w-full text-slate-700"
                  />
                </div>
                <button 
                  onClick={() => executeLogSearch()}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* LIVE KPI ANALYTICS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div style={{ backgroundColor: '#ffffff' }} className="p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Transaction Tracking</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Aggregated weekly metrics chart view</p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeSeries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Success" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={10} />
                      <Bar dataKey="Failures" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CARD TILE COUNTERS */}
              <div className="grid grid-cols-2 gap-4">
                <div style={{ backgroundColor: '#ffffff' }} className="p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Shield className="w-4 h-4" /></div>
                  <div className="mt-4">
                    <span className="text-[11px] font-medium text-slate-400 block uppercase">Total Logs</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{stats.totalLogs}</h3>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff' }} className="p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="w-8 h-8 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center"><Users className="w-4 h-4" /></div>
                  <div className="mt-4">
                    <span className="text-[11px] font-medium text-slate-400 block uppercase">Unique Users</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{stats.uniqueUsers}</h3>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff' }} className="p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
                  <div className="mt-4">
                    <span className="text-[11px] font-medium text-slate-400 block uppercase">Critical Alerts</span>
                    <h3 className="text-xl font-bold text-rose-600 mt-1">{stats.criticalEvents}</h3>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff' }} className="p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Percent className="w-4 h-4" /></div>
                  <div className="mt-4">
                    <span className="text-[11px] font-medium text-slate-400 block uppercase">Success Rate</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{stats.complianceRate}%</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SEGMENTS TRACE ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div style={{ backgroundColor: '#ffffff' }} className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-2">
                <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Live security event streams</p>
                  </div>
                  <button 
                    onClick={() => setViewMode('all-logs')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                  >
                    See All 🡪
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-3.5">Action Executed</th>
                        <th className="px-6 py-3.5">Timestamp</th>
                        <th className="px-6 py-3.5">Operator ID</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                      {loading ? (
                        <tr><td colSpan="4" className="text-center py-8 text-slate-400">Loading audit tracking...</td></tr>
                      ) : logs.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-slate-400">No operations discovered.</td></tr>
                      ) : (
                        logs.slice(0, 5).map((log, idx) => (
                          <tr key={log.id || idx} className="hover:bg-slate-50/40 transition">
                            <td className="px-6 py-4 font-bold text-slate-900">{log.action || 'N/A'}</td>
                            <td className="px-6 py-4 text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-6 py-4 text-slate-500">{log.username || 'system'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                              }`}>{log.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TARGET WORKSPACE PROGRESS CARD */}
              <div style={{ backgroundColor: '#ffffff' }} className="p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Top System Targets</h3>
                  <div className="space-y-4">
                    {topResources.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No structural logs parsed.</p>
                    ) : (
                      topResources.map((item, index) => (
                        <div key={index} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-800 truncate max-w-[180px]">{item.name}</span>
                            <span className="text-blue-600">{item.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full" style={{ width: `${item.percentage}%` }}></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {severityPie.length > 0 && (
                  <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
                    <div className="w-20 h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={severityPie} innerRadius={20} outerRadius={28} dataKey="value">
                            {severityPie.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 text-[11px] font-medium text-slate-500 pl-4 space-y-0.5">
                      {severityPie.map((entry, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{entry.name}</span>
                          <span className="font-bold text-slate-700">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">
              <button 
                disabled={exporting}
                onClick={generateProgrammaticPdfReport}
                className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 text-xs font-semibold rounded-xl shadow-md transition"
              >
                <FileText className="w-4 h-4" /> {exporting ? "Generating Compliance Doc..." : "Export Analytics Document (PDF)"}
              </button>
            </div>
          </>
        )}

        {/* VIEW SEGMENT 2: MASTER PAGINATED GRID */}
        {viewMode === 'all-logs' && (
          <div style={{ backgroundColor: '#ffffff' }} className="rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
              <div>
                <button 
                  onClick={() => setViewMode('dashboard')}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 mb-1"
                >
                  <X className="w-3 h-3" /> Back to Dashboard Overview
                </button>
                <h2 className="text-lg font-bold text-slate-900">Complete Master Log Registry</h2>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCsvExport}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 px-4 py-2 text-xs font-bold rounded-xl transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" /> Export CSV Matrix
                </button>
                <button 
                  onClick={generateProgrammaticPdfReport}
                  className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 text-xs font-bold rounded-xl transition"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-300" /> Export Analytics Document (PDF)
                </button>
              </div>
            </div>

            {/* FILTER INPUT STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
              <input 
                type="text"
                name="username"
                value={filters.username}
                onChange={handleFilterInputChange}
                placeholder="Operator Identity"
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400"
              />
              <input 
                type="text"
                name="action"
                value={filters.action}
                onChange={handleFilterInputChange}
                placeholder="Action Keyword"
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400"
              />
              <input 
                type="text"
                name="resource"
                value={filters.resource}
                onChange={handleFilterInputChange}
                placeholder="Resource Scope Target"
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400"
              />
              <select 
                name="status"
                value={filters.status}
                onChange={handleFilterInputChange}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-400"
              >
                <option value="">All Transactions</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
              </select>
              <div className="sm:col-span-4 flex justify-end">
                <button onClick={clearFilters} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition">Clear Query Parameters</button>
              </div>
            </div>

            {/* REAL-TIME DATA MATRIX */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4 text-center w-12">No.</th>
                    <th className="px-6 py-4">Timestamp Event</th>
                    <th className="px-6 py-4">Identity Subject</th>
                    <th className="px-6 py-4">Action Method Space</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-400">Syncing security log structures...</td></tr>
                  ) : currentLogs.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-400">No logs found matching selected parameters.</td></tr>
                  ) : (
                    currentLogs.map((log, index) => (
                      <tr key={log.id || index} className="hover:bg-slate-50/40 transition">
                        <td className="px-6 py-4 text-center font-bold text-slate-300">{indexOfFirstLog + index + 1}</td>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{log.username || 'ANONYMOUS'}</td>
                        <td className="px-6 py-4"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono text-[11px] font-bold">{log.action}</span></td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                          }`}>{log.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* COMPONENT PAGINATION INTERFACE */}
            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400 font-medium">
                  Showing <span className="font-bold text-slate-700">{indexOfFirstLog + 1}</span> to <span className="font-bold text-slate-700">{Math.min(indexOfLastLog, logs.length)}</span> of <span className="font-bold text-slate-700">{logs.length}</span> recorded entries
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNo => (
                    <button
                      key={pageNo}
                      onClick={() => setCurrentPage(pageNo)}
                      className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg ${
                        currentPage === pageNo ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {pageNo}
                    </button>
                  ))}
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AuditDashboard;