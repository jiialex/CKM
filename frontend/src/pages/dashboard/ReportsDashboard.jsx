import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/axios";
import { 
 
 
  Calendar, 
  Search, 
  MoreHorizontal
} from "lucide-react";

export default function ReportsDashboard() {
  // Raw state collection
  const [certificates, setCertificates] = useState([]);
  const [keys, setKeys] = useState([]);
  const [csrs, setCsrs] = useState([]);
  const [revokedCerts, setRevokedCerts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("certs"); 

  // Tooltip tracking state for the dynamic chart line nodes
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/certificates/my-certificates"),
      api.get("/hsm/my-keys"),
      api.get("/csr/my"),
      api.get("/crl/my-revoked")
    ])
      .then(([certsRes, keysRes, csrsRes, revokedRes]) => {
        setCertificates(certsRes.data || []);
        setKeys(keysRes.data || []);
        setCsrs(csrsRes.data || []);
        setRevokedCerts(revokedRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching user report analytics data:", err);
        setError("Failed to compile user report data metrics.");
        setLoading(false);
      });
  }, []);

  // Summary analytics
  const summaryMetrics = useMemo(() => {
    const totalActive = certificates.filter(c => c.status === "ACTIVE").length;
    const totalExpiring = certificates.filter(c => {
      if (!c.expiryDate) return false;
      const daysLeft = (new Date(c.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft > 0 && daysLeft <= 30;
    }).length;

    const totalPendingCsrs = csrs.filter(c => c.status === "PENDING" || c.status === "SUBMITTED").length;

    const algoCounts = keys.reduce((acc, curr) => {
      const algo = curr.algorithm || "Unknown";
      acc[algo] = (acc[algo] || 0) + 1;
      return acc;
    }, {});

    return {
      activeCerts: totalActive,
      expiringCerts: totalExpiring,
      revokedCerts: revokedCerts.length,
      pendingCsrs: totalPendingCsrs,
      totalKeys: keys.length,
      algoDistribution: algoCounts
    };
  }, [certificates, keys, csrs, revokedCerts]);

  // Dynamic Chart Processor: Evaluates Certificate deployment velocity over 12 months
  const chartMonthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts = Array(12).fill(0);

    certificates.forEach(cert => {
      const dateStr = cert.createdAt || cert.notBefore;
      if (dateStr) {
        const date = new Date(dateStr);
        const monthIndex = date.getMonth(); // 0-11
        if (monthIndex >= 0 && monthIndex < 12) {
          counts[monthIndex] += 1;
        }
      }
    });

    const maxCount = Math.max(...counts, 1); // Avoid division by zero anomalies

    // Coordinate mapping engine into a standard 1000x200 SVG ViewBox viewport
    return months.map((month, index) => {
      const x = (index / 11) * 920 + 40; // Leaves layout padding side edges
      const y = 160 - (counts[index] / maxCount) * 120; // Bound scaling inside limits
      return { month, count: counts[index], x, y };
    });
  }, [certificates]);

  // Calculated properties for dynamic SVG rendering shapes
  const { linePath, areaPath } = useMemo(() => {
    if (chartMonthlyData.length === 0) return { linePath: "", areaPath: "" };
    
    // Constructing a smooth cubic bezier pattern matching image curves safely
    let d = `M ${chartMonthlyData[0].x} ${chartMonthlyData[0].y}`;
    for (let i = 0; i < chartMonthlyData.length - 1; i++) {
      const p0 = chartMonthlyData[i];
      const p1 = chartMonthlyData[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    const area = `${d} L ${chartMonthlyData[chartMonthlyData.length - 1].x} 200 L ${chartMonthlyData[0].x} 200 Z`;
    return { linePath: d, areaPath: area };
  }, [chartMonthlyData]);

  // Filtering engine
  const filterData = (list, type) => {
    return list.filter((item) => {
      const aliasName = (item.alias || item.csrAlias || "").toLowerCase();
      const matchesSearch = aliasName.includes(searchTerm.toLowerCase());

      const itemDateStr = item.createdAt || item.notBefore;
      if (!itemDateStr) return matchesSearch;
      
      const itemTime = new Date(itemDateStr).getTime();
      const startMatch = startDate ? itemTime >= new Date(startDate).getTime() : true;
      const endMatch = endDate ? itemTime <= new Date(endDate).setHours(23, 59, 59, 999) : true;

      return matchesSearch && startMatch && endMatch;
    });
  };

  const filteredCerts = useMemo(() => filterData(certificates, "certs"), [certificates, searchTerm, startDate, endDate]);
  const filteredKeys = useMemo(() => filterData(keys, "keys"), [keys, searchTerm, startDate, endDate]);
  const filteredCsrs = useMemo(() => filterData(csrs, "csrs"), [csrs, searchTerm, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f5f9]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3b59f6] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f9] p-4 sm:p-6 lg:p-8 font-sans antialiased text-[#1a1d23]">
      
      {/* TOP HEADER & CONTROLS */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1d23]">Dashboard</h1>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9ca4b6]" />
            <input
              type="text"
              placeholder="Search by alias, item, etc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-none bg-white py-2 pl-10 pr-4 text-sm shadow-sm transition-all placeholder:text-[#9ca4b6] focus:outline-none focus:ring-2 focus:ring-[#3b59f6]/20"
            />
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-2 shadow-sm w-full sm:w-auto overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <Calendar className="h-4 w-4 text-[#9ca4b6]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-[#5e6678] focus:outline-none"
              />
              <span className="text-xs text-[#9ca4b6]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-[#5e6678] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD GRID CONTENT CONTAINER */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-4">
        
        {/* LEFT & CENTER MAIN REGION */}
        <div className="space-y-6 lg:space-y-8 xl:col-span-3">
          
          {/* FOUR METRICS TOP ROW */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Active Certificates */}
            <div className="rounded-2xl bg-white p-5 shadow-sm relative transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
              <div className="flex items-center justify-between text-[#9ca4b6]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                  <span className="text-xs font-semibold tracking-wide uppercase">Active Certs</span>
                </div>
                <MoreHorizontal className="h-4 w-4 cursor-pointer" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#1a1d23]">{summaryMetrics.activeCerts}</span>
                <span className="text-[11px] font-bold text-[#10b981] bg-[#e6f7f0] px-2 py-0.5 rounded-md">+ 12%</span>
              </div>
            </div>

            {/* Managed HSM Keys */}
            <div className="rounded-2xl bg-white p-5 shadow-sm relative transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
              <div className="flex items-center justify-between text-[#9ca4b6]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#3b59f6]" />
                  <span className="text-xs font-semibold tracking-wide uppercase">HSM Keys</span>
                </div>
                <MoreHorizontal className="h-4 w-4 cursor-pointer" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#1a1d23]">{summaryMetrics.totalKeys}</span>
                <span className="text-[11px] font-bold text-[#3b59f6] bg-[#edf0fe] px-2 py-0.5 rounded-md">+ 3%</span>
              </div>
            </div>

            {/* Pending CSR requests */}
            <div className="rounded-2xl bg-white p-5 shadow-sm relative transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
              <div className="flex items-center justify-between text-[#9ca4b6]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                  <span className="text-xs font-semibold tracking-wide uppercase">Pending CSRs</span>
                </div>
                <MoreHorizontal className="h-4 w-4 cursor-pointer" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#1a1d23]">{summaryMetrics.pendingCsrs}</span>
                <span className="text-[11px] font-bold text-[#f59e0b] bg-[#fef6e7] px-2 py-0.5 rounded-md">Hold</span>
              </div>
            </div>

            {/* Revoked Credentials */}
            <div className="rounded-2xl bg-white p-5 shadow-sm relative transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
              <div className="flex items-center justify-between text-[#9ca4b6]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                  <span className="text-xs font-semibold tracking-wide uppercase">Revoked</span>
                </div>
                <MoreHorizontal className="h-4 w-4 cursor-pointer" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#1a1d23]">{summaryMetrics.revokedCerts}</span>
                <span className="text-[11px] font-bold text-[#ef4444] bg-[#fdebeb] px-2 py-0.5 rounded-md">CRL</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC & RESPONSIVE LIFECYCLE MONITOR CHART */}
          <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-bold text-[#1a1d23]">Lifecycle Activity Monitor</h3>
                <p className="text-xs text-[#9ca4b6]">Tracking monthly certificate velocity metrics across the registry.</p>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-[#f4f5f9] p-1 text-xs font-bold text-[#5e6678] self-start sm:self-auto">
                {["1H", "1D", "1W", "1M", "1Y", "ALL"].map((t) => (
                  <button key={t} className={`rounded-lg px-2.5 py-1 transition-colors ${t === "1M" ? "bg-white text-[#3b59f6] shadow-sm" : "hover:text-[#1a1d23]"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Scalable Vector Graphic Area */}
            <div className="relative mt-6 w-full overflow-visible">
              <svg 
                className="w-full h-auto overflow-visible" 
                viewBox="0 0 1000 220" 
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b59f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b59f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Horizontal Gridlines */}
                {[40, 100, 160].map((yVal, index) => (
                  <line 
                    key={index} 
                    x1="30" 
                    y1={yVal} 
                    x2="970" 
                    y2={yVal} 
                    stroke="#f1f3f7" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Filled Area - Smooth dynamic rendering path */}
                {areaPath && (
                  <path 
                    d={areaPath} 
                    fill="url(#chartGradient)"
                    className="transition-all duration-700 ease-out"
                  />
                )}

                {/* Core Stroke Spline Line */}
                {linePath && (
                  <path 
                    d={linePath} 
                    fill="none" 
                    stroke="#3b59f6" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                )}

                {/* Interactive Functional Data Target Nodes */}
                {chartMonthlyData.map((node, idx) => (
                  <g key={idx} className="cursor-pointer">
                    {/* Ghost tracking zone for responsive handling */}
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r="16" 
                      fill="transparent" 
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                    {/* Visual Node Pin */}
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r={hoveredNode?.month === node.month ? "7" : "4.5"} 
                      fill="white" 
                      stroke="#3b59f6" 
                      strokeWidth={hoveredNode?.month === node.month ? "4" : "3"}
                      className="transition-all duration-150 ease-out"
                    />
                  </g>
                ))}
              </svg>
              
              {/* Dynamic Overlay Floating Tooltip */}
              {hoveredNode && (
                <div 
                  className="absolute pointer-events-none rounded-xl bg-[#1a1d23] text-white px-3 py-1.5 text-xs font-bold shadow-xl flex flex-col items-center transition-all duration-200"
                  style={{ 
                    left: `${(hoveredNode.x / 1000) * 100}%`, 
                    top: `${(hoveredNode.y / 220) * 100 - 22}%`,
                    transform: "translate(-50%, -100%)"
                  }}
                >
                  <span className="text-[10px] text-[#9ca4b6] uppercase tracking-wider">{hoveredNode.month}</span>
                  <span className="text-sm text-white mt-0.5">{hoveredNode.count} Issued</span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a1d23]" />
                </div>
              )}
            </div>

            {/* X-Axis Responsive Label Deck */}
            <div className="mt-2 flex justify-between px-2 sm:px-4 text-[10px] sm:text-[11px] font-semibold text-[#9ca4b6]">
              {chartMonthlyData.map(d => (
                <span key={d.month} className={hoveredNode?.month === d.month ? "text-[#3b59f6] font-bold scale-110 transition-transform" : ""}>
                  {d.month}
                </span>
              ))}
            </div>
          </div>

          {/* TWO COLUMN DETAILS SECTIONS */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* DATA SWITCHER TAB LIST */}
            <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-4">
                  {[
                    { id: "certs", label: "Certificates" },
                    { id: "keys", label: "Keys" },
                    { id: "csrs", label: "CSR Pipeline" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`text-sm font-bold pb-1 transition-all border-b-2 ${
                        activeTab === tab.id ? "border-[#3b59f6] text-[#1a1d23]" : "border-transparent text-[#9ca4b6] hover:text-[#5e6678]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button className="text-xs font-bold text-[#3b59f6] hover:underline">view more</button>
              </div>

              <div className="divide-y divide-[#f4f5f9] overflow-hidden">
                {activeTab === "certs" && filteredCerts.slice(0, 4).map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between py-3 text-xs animation-fadeIn">
                    <div>
                      <p className="font-bold text-[#1a1d23] truncate max-w-[150px] sm:max-w-xs">{cert.alias || "Untitled Certificate"}</p>
                      <p className="text-[#9ca4b6] text-[11px] mt-0.5 truncate max-w-[150px] sm:max-w-xs">{cert.commonName}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cert.status === "ACTIVE" ? "bg-[#e6f7f0] text-[#10b981]" : "bg-[#fdebeb] text-[#ef4444]"}`}>
                        {cert.status}
                      </span>
                      <p className="text-[#9ca4b6] text-[10px] mt-1">{cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : "Never"}</p>
                    </div>
                  </div>
                ))}

                {activeTab === "keys" && filteredKeys.slice(0, 4).map((k) => (
                  <div key={k.id} className="flex items-center justify-between py-3 text-xs animation-fadeIn">
                    <div>
                      <p className="font-bold text-[#1a1d23] truncate max-w-[150px] sm:max-w-xs">{k.alias}</p>
                      <p className="text-[#9ca4b6] font-mono text-[10px] mt-0.5">{k.algorithm} / {k.keySize ? `${k.keySize}b` : "EC"}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-[#edf0fe] text-[#3b59f6] px-1.5 py-0.5 rounded text-[10px] font-bold">{k.isHsmKey ? "HSM" : "Soft Stack"}</span>
                    </div>
                  </div>
                ))}

                {activeTab === "csrs" && filteredCsrs.slice(0, 4).map((csr) => (
                  <div key={csr.id} className="flex items-center justify-between py-3 text-xs animation-fadeIn">
                    <div>
                      <p className="font-bold text-[#1a1d23] truncate max-w-[150px] sm:max-w-xs">{csr.csrAlias}</p>
                      <p className="text-[#9ca4b6] text-[11px] mt-0.5 truncate max-w-[150px] sm:max-w-xs">{csr.commonName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[#f59e0b] font-bold uppercase text-[10px]">{csr.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PROGRESS METRICS METERS */}
            <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1a1d23]">Expiration Triggers</h3>
                <button className="text-xs font-bold text-[#3b59f6] hover:underline">view more</button>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                    <span className="text-[#5e6678]">Expiring within 30 Days</span>
                    <span className="text-[#1a1d23]">{summaryMetrics.expiringCerts}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#f4f5f9]">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#f5af19] transition-all duration-1000 ease-out" style={{ width: `${Math.min((summaryMetrics.expiringCerts / (certificates.length || 1)) * 100, 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                    <span className="text-[#5e6678]">Revocation Interrupts</span>
                    <span className="text-[#1a1d23]">{summaryMetrics.revokedCerts}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#f4f5f9]">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#ef4444] to-[#ff6b6b] transition-all duration-1000 ease-out" style={{ width: `${Math.min((summaryMetrics.revokedCerts / (certificates.length || 1)) * 100, 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                    <span className="text-[#5e6678]">Compliant & Valid</span>
                    <span className="text-[#1a1d23]">{summaryMetrics.activeCerts}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#f4f5f9]">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#10b981] to-[#2ecc71] transition-all duration-1000 ease-out" style={{ width: `${Math.min((summaryMetrics.activeCerts / (certificates.length || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR REGION */}
        <div className="space-y-6 lg:space-y-8">
          {/* DONUT BREAKDOWN BLOCK */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#1a1d23]">Algorithm Distribution</h3>
            
            <div className="relative mx-auto my-6 flex h-36 w-36 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[14px] border-slate-100" />
              <div className="absolute inset-0 rounded-full border-[14px] border-[#3b59f6] border-t-[#10b981] border-r-[#f59e0b] transition-transform duration-700 ease-out" />
              
              <div className="z-10 text-center">
                <span className="text-xl font-black text-[#1a1d23]">{summaryMetrics.totalKeys}</span>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#9ca4b6]">Total Blocks</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3b59f6]" />
                  <span className="text-[#5e6678]">RSA Keys</span>
                </div>
                <span className="font-bold text-[#1a1d23]">{summaryMetrics.algoDistribution["RSA"] || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                  <span className="text-[#5e6678]">Elliptic Curve (EC)</span>
                </div>
                <span className="font-bold text-[#1a1d23]">{summaryMetrics.algoDistribution["EC"] || 0}</span>
              </div>
            </div>
          </div>

          {/* INSA HARDWARE SECURITY ENCLAVE CARD */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[#1a1d23]">Hardware Security Enclave</h3>
            
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#6366f1] via-[#4f46e5] to-[#3730a3] p-5 text-white shadow-md transition-transform duration-300 hover:rotate-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200/80">Cryptographic Node</p>
                  <p className="mt-1 text-sm font-bold tracking-wide">INSA HSM MODULE</p>
                </div>
                <div className="h-6 w-8 rounded bg-white/20 backdrop-blur-sm" />
              </div>

              <div className="mt-8">
                <p className="font-mono text-xs tracking-widest text-indigo-100">•••• •••• •••• 2026</p>
              </div>

              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-indigo-200/60">Enclave Status</p>
                  <p className="text-[11px] font-bold tracking-wide">ACTIVE / BOUND</p>
                </div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">Slot 0</span>
              </div>
              <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-pink-500/30 blur-xl" />
            </div>

            <div className="mt-5 space-y-3 border-t border-[#f4f5f9] pt-4 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-[#5e6678]">Storage Engine</span>
                <span className="font-bold text-[#1a1d23]">Hardware Block</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5e6678]">Active Pipeline</span>
                <span className="font-bold text-[#3b59f6]">FIPS 140-2</span>
              </div>
              <button className="mt-2 w-full rounded-xl bg-[#f4f5f9] py-2.5 text-center text-xs font-bold text-[#3b59f6] transition-all hover:bg-[#edf0fe] active:scale-95">
                + Action Controller
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}