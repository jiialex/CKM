import React, { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Zap, Globe, Clock, RefreshCw, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios'; // Points directly to your updated Axios interceptor file

const WS_URL = 'http://localhost:8080/ws';

export default function SecurityThreats() {
  // --- Core State Machine ---
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, medium: 0 });
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  // --- REST Data Fetching Layer (Using Interceptor-protected axios instance) ---
  const fetchThreatData = async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes] = await Promise.all([
        api.get('/security/alerts'),   // Mapped to your security services endpoints
        api.get('/security/stats'),
      ]);

      setThreats(alertsRes.data || []);
      setStats(statsRes.data || { total: 0, critical: 0, high: 0, medium: 0 });
      setLastUpdated('Just now');
    } catch (err) {
      console.error('Failed loading security network data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Initial Mount Data Sync ---
  useEffect(() => {
    fetchThreatData();
  }, []);

  // --- Real-time SIEM WebSocket STOMP Stream ---
  useEffect(() => {
    const socket = new SockJS(WS_URL);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe('/topic/threats', (message) => {
          const newThreat = JSON.parse(message.body);

          // Prepend real-time incoming records to the visible log array
          setThreats((previous) => [newThreat, ...previous]);
          setLastUpdated('Just now');

          // Keep dashboard numerical analytics metrics synced
          api.get('/security/stats')
            .then((res) => setStats(res.data))
            .catch(() => {});
        });
      },
    });

    stompClient.activate();
    return () => stompClient.deactivate();
  }, []);

  // --- Action Handlers ---
  const handleRevoke = async (id, e) => {
    e.stopPropagation(); // Avoid triggering row events
    if (!window.confirm('Revoke this threat block configuration?')) return;

    try {
      await api.delete(`/security/threats/${id}`); // Mapped to your explicit revoke API
      setThreats((previous) => previous.filter((threat) => threat.id !== id));
    } catch (err) {
      console.error('Revoke transmission failure:', err);
    }
  };

  // Filter local state tracking array based on active navigation tab choice
  const filteredThreats = filter === 'All' 
    ? threats 
    : threats.filter((threat) => threat.severity === filter);

  // Fallback structures to handle stats safely
  const safeStats = {
    total: stats?.total || 0,
    critical: stats?.critical || 0,
    high: stats?.high || 0,
    medium: stats?.medium || 0,
  };

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] px-12 py-10 font-sans text-slate-800">
      
      {/* SCREEN PAGE CAPTION TITLE (Matches Orders Screen layout) */}
      <div className="mb-3 text-center">
        <h1 className="text-3xl font-semibold text-[#2b4c65] tracking-tight">Threat Intelligence Center</h1>
        <p className="text-sm text-slate-500 max-w-2xl mx-auto mt-2 leading-relaxed">
          The Security Threats screen provides real-time insights into active boundary attack parameters. 
          Monitor originating country sources, threat levels, block constraints, and instantly revoke firewall entries.
        </p>
      </div>

      {/* NEW MINIMALIST METRIC HIGHLIGHT PANELS */}
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Threats</span>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{safeStats.total}</h3>
          <span className="text-[11px] font-medium text-slate-400 mt-2">Active firewall blocks</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Critical Risk</span>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">{safeStats.critical}</h3>
          <span className="text-[11px] font-medium text-rose-400 bg-rose-50 px-2 py-0.5 rounded-md w-max mt-2">Immediate review</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">High Risk</span>
          <h3 className="text-2xl font-bold text-orange-500 mt-1">{safeStats.high}</h3>
          <span className="text-[11px] font-medium text-orange-400 bg-orange-50 px-2 py-0.5 rounded-md w-max mt-2">Elevated alertness</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Medium Risk</span>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{safeStats.medium}</h3>
          <span className="text-[11px] font-medium text-slate-400 mt-2">Standard anomalies</span>
        </div>
      </div>

      {/* CONTROL & SEARCH INTERFACE BAR */}
      <div className="max-w-[1100px] mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        
        {/* Dynamic Search Parameters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-2 flex items-center w-64 focus-within:border-blue-400 transition">
            <Globe className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Search by IP Address or Target..." 
              className="bg-transparent text-xs outline-none w-full text-slate-700 placeholder-slate-400"
              onChange={(e) => {
                const term = e.target.value.toLowerCase();
                if (!term) { fetchThreatData(); return; }
                setThreats(prev => prev.filter(t => t.ip.toLowerCase().includes(term) || t.reason.toLowerCase().includes(term)));
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated: {lastUpdated}</span>
          </div>
          <button 
            onClick={fetchThreatData}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-sm"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-medium rounded-xl shadow-sm transition">
            <Download className="w-3.5 h-3.5" /> Export Log CSV
          </button>
        </div>
      </div>

      {/* SYSTEM CENTRAL THREAT REGISTRY WRAPPER MATRIX */}
      <div className="max-w-[1100px] mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/50 overflow-hidden">
        
        {/* TAB NAVIGATION INTERACTION CONSOLE BAR */}
        <div className="px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-red-500 animate-pulse" />
            <h2 className="text-base font-semibold text-slate-800">Active Network Blocks</h2>
          </div>
          
          <div className="flex items-center flex-wrap gap-4">
            {/* Filter Sub-Tabs */}
            <div className="flex items-center gap-1 border-b border-transparent">
              {['All', 'CRITICAL', 'HIGH', 'MEDIUM'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all relative ${
                    filter === tab 
                      ? 'text-orange-500 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-orange-500' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tab === 'All' ? 'All Alerts' : `${tab} Risk`}
                </button>
              ))}
            </div>

            {/* Date Indicator Block */}
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Live Perimeter Monitoring Stream</span>
            </div>
          </div>
        </div>

        {/* LOG EVENT SPREADSHEET MATRIX (Matches precisely layout 2) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#f8fafc] text-xs font-semibold text-slate-500">
                <th className="px-8 py-4 text-center w-16">S No</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Threat Signature / Reason</th>
                <th className="px-6 py-4">Origin / Country</th>
                <th className="px-6 py-4 text-center">Hit Counts</th>
                <th className="px-6 py-4 text-center">Severity</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {loading && threats.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-medium bg-white">
                    Synchronizing real-time telemetry array...
                  </td>
                </tr>
              ) : filteredThreats.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-medium bg-white">
                    Clear network matrix. No active threats detected inside context boundaries.
                  </td>
                </tr>
              ) : (
                filteredThreats.map((threat, index) => {
                  const isCritical = threat.severity === 'CRITICAL';
                  const isHigh = threat.severity === 'HIGH';
                  
                  return (
                    <tr key={threat.id} className="hover:bg-slate-50/60 transition bg-white">
                      {/* Serial Number */}
                      <td className="px-8 py-4 text-center font-medium text-slate-400">{index + 1}</td>
                      
                      {/* IP Target Address */}
                      <td className="px-6 py-4 font-mono font-medium text-slate-900 tracking-wide">
                        {threat.ip}
                      </td>
                      
                      {/* Reason Signature */}
                      <td className="px-6 py-4 font-medium text-slate-700 max-w-xs truncate">
                        {threat.reason}
                      </td>
                      
                      {/* Country Origin */}
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {threat.country || 'Unknown Location'}
                      </td>
                      
                      {/* Connection Attempt Hits Counter */}
                      <td className="px-6 py-4 text-center text-slate-500 font-mono">
                        {threat.attempts ?? 0}
                      </td>
                      
                      {/* Unified Status-style Pill */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-medium tracking-wide ${
                          isCritical 
                            ? 'text-rose-600 bg-rose-50/50' 
                            : isHigh 
                            ? 'text-orange-500 bg-orange-50/50' 
                            : 'text-amber-500 bg-amber-50/50'
                        }`}>
                          {threat.severity}
                        </span>
                      </td>

                      {/* Explicit Interactive Action Hooks */}
                      <td className="px-8 py-4 text-right">
                        <button
                          onClick={(e) => handleRevoke(threat.id, e)}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 px-3 py-1.5 rounded-lg transition"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* SYSTEM FOOTER PAGINATION CONTAINER */}
        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center gap-1">
          <button className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 disabled:opacity-50 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center text-xs font-semibold rounded-lg bg-slate-800 text-white shadow-sm">1</button>
          <button className="w-7 h-7 flex items-center justify-center text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100">2</button>
          <span className="text-slate-400 text-xs px-1">.....</span>
          <button className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}