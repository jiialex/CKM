import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  CreditCard,
  Bell,
  Smartphone,
  HelpCircle,
  LogOut,
  Loader2,
  Camera,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { preferences, setThemeMode } = useTheme();

  const [activeSection, setActiveSection] = useState('profile');
  const [form, setForm] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Sample tab content states
  const [notificationSettings, setNotificationSettings] = useState({ emailAlerts: true, securityAlerts: true });
  const [subType, setSubType] = useState('Premium Tier');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/profile');
        setForm(prev => ({
          ...prev,
          username: res.data.username || user?.username || '',
          email: res.data.email || user?.email || '',
        }));
      } catch (err) {
        console.error(err);
        setError('Failed to load profile settings');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (activeSection === 'offline') {
      const fetchDevices = async () => {
        try {
          setLoadingDevices(true);
          setError('');
          const res = await api.get('/profile/devices');
          setDevices(res.data || []);
        } catch (err) {
          console.error(err);
          setError('Failed to query registered system nodes');
        } finally {
          setLoadingDevices(false);
        }
      };
      fetchDevices();
    }
  }, [activeSection]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setMessage('');
    setError('');
  };

  const handleAvatarUpdate = () => {
    alert('Trigger file upload window handler...');
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (form.newPassword || form.currentPassword) {
        if (!form.currentPassword) throw new Error("Current password is required to change credentials");
        if (form.newPassword !== form.confirmPassword) throw new Error("New passwords do not match");

        await api.post('/profile/change-password', {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        });
      }

      await api.put('/profile', { 
        username: form.username, 
        email: form.email 
      });

      setMessage('✅ Profile data synced successfully');
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save execution failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    if (!window.confirm('Are you sure you want to revoke and clear this device authorization token?')) return;
    
    try {
      setError('');
      // Calls your deletion endpoint passing the unique row key identifier
      await api.delete(`/profile/devices/${deviceId}`);
      setDevices(prev => prev.filter(device => device.id !== deviceId));
      setMessage('🔒 Device session terminated successfully');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to request node authorization dropout');
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard size={18} /> },
    { id: 'theme', label: 'Theme & Style', icon: <Palette size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'offline', label: 'Offline Devices', icon: <Smartphone size={18} /> },
    { id: 'help', label: 'Help', icon: <HelpCircle size={18} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center transition-colors duration-300">
        <Loader2 className="animate-spin text-app-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-text font-sans antialiased transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row gap-16">
        
        {/* Left Side Navigation Panel */}
        <div className="w-full md:w-56 flex flex-col items-center md:items-start text-center md:text-left">
          
          {/* Avatar Area with update action trigger */}
          <div className="relative group mb-4">
            <div className="w-24 h-24 bg-app-surface-muted rounded-full flex items-center justify-center border border-app-border overflow-hidden">
              <User size={40} className="text-app-muted" />
            </div>
            <button 
              onClick={handleAvatarUpdate}
              className="absolute bottom-0 right-0 p-2 bg-app-primary text-white rounded-full hover:opacity-90 transition-opacity shadow-md"
              title="Update profile snapshot"
            >
              <Camera size={14} />
            </button>
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-sm tracking-tight text-app-heading break-all">{form.username || 'System User'}</h3>
            <span className="text-xs text-app-muted font-medium">{form.email}</span>
          </div>

          {/* Navigation Links */}
          <nav className="w-full space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setMessage('');
                  setError('');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'text-app-heading font-bold bg-app-surface-strong'
                    : 'text-app-muted hover:text-app-heading'
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
            
            <button
              onClick={() => window.confirm('Terminate your active application session?') && logout()}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-app-muted hover:text-red-500 rounded-lg text-sm font-medium transition-colors mt-4"
            >
              <LogOut size={18} />
              Log out
            </button>
          </nav>
        </div>

        {/* Right Tab Content Container */}
        <div className="flex-1 bg-app-surface border border-app-border shadow-sm rounded-xl p-8 md:p-12 max-w-2xl transition-colors duration-300">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {message && <p className="text-emerald-600 text-sm mb-4">{message}</p>}

          {activeSection === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold mb-8 text-app-heading">Edit Profile</h2>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-app-heading mb-1 block">Username</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className="w-full bg-transparent border-b border-app-border py-2 focus:border-app-primary outline-none transition-colors text-sm text-app-text"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-app-heading mb-1 block">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full bg-transparent border-b border-app-border py-2 focus:border-app-primary outline-none transition-colors text-sm text-app-text"
                  />
                </div>

                <div className="pt-4 border-t border-app-border mt-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-app-muted">Security Credentials</h4>
                  <div>
                    <label className="text-xs text-app-muted mb-1 block">Current Password</label>
                    <input
                      type="password"
                      value={form.currentPassword}
                      onChange={(e) => handleChange('currentPassword', e.target.value)}
                      className="w-full bg-transparent border-b border-app-border py-1.5 focus:border-app-primary outline-none transition-colors text-sm text-app-text"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-app-muted mb-1 block">New Password</label>
                      <input
                        type="password"
                        value={form.newPassword}
                        onChange={(e) => handleChange('newPassword', e.target.value)}
                        className="w-full bg-transparent border-b border-app-border py-1.5 focus:border-app-primary outline-none transition-colors text-sm text-app-text"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-app-muted mb-1 block">Confirm New Password</label>
                      <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        className="w-full bg-transparent border-b border-app-border py-1.5 focus:border-app-primary outline-none transition-colors text-sm text-app-text"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-12 py-3 bg-app-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-app-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Update Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-12 py-3 bg-app-surface-strong border border-app-border text-app-text text-xs font-bold uppercase tracking-wider hover:bg-app-surface-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION: SUBSCRIPTION */}
          {activeSection === 'subscription' && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-app-heading">Subscription Parameters</h2>
              <p className="text-sm text-app-muted mb-8">Review and alter infrastructure permissions tiers</p>
              
              <div className="p-6 bg-app-surface-muted border border-app-border rounded-lg mb-6">
                <span className="text-xs uppercase font-bold text-app-muted">Active Tier</span>
                <p className="text-xl font-bold mt-1 text-app-heading">{subType}</p>
                <p className="text-xs text-app-muted mt-2">Next standard evaluation checkpoint: July 1, 2026</p>
              </div>

              <div className="space-y-3">
                <button onClick={() => setSubType('Enterprise Tier')} className="w-full text-left p-4 border border-app-border rounded-lg hover:border-app-primary transition-colors flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold text-app-heading">Request Enterprise Access Extension</p>
                    <p className="text-xs text-app-muted">Unlocks custom HSM key operations, audit streams, and priority telemetry logging queues</p>
                  </div>
                  <span className="text-xs font-bold tracking-wider underline text-app-accent hover:text-app-accent-hover">UPGRADE</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION: THEME & APPEARANCE */}
          {activeSection === 'theme' && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-app-heading">Appearance Modes</h2>
              <p className="text-sm text-app-muted mb-8">Choose how the application console looks to you</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setThemeMode('light')}
                  className={`p-6 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                    preferences?.themeMode === 'light'
                      ? 'border-app-primary bg-app-surface-strong text-app-heading shadow-sm'
                      : 'border-app-border bg-app-surface text-app-muted hover:text-app-heading'
                  }`}
                >
                  <Sun size={28} />
                  <span className="font-bold text-xs uppercase tracking-wider">Light Workspace</span>
                </button>

                <button
                  onClick={() => setThemeMode('dark')}
                  className={`p-6 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                    preferences?.themeMode === 'dark'
                      ? 'border-app-primary bg-app-surface-strong text-app-heading shadow-sm'
                      : 'border-app-border bg-app-surface text-app-muted hover:text-app-heading'
                  }`}
                >
                  <Moon size={28} />
                  <span className="font-bold text-xs uppercase tracking-wider">Dark Workspace</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION: NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-app-heading">Alert Dispatch Channels</h2>
              <p className="text-sm text-app-muted mb-8">Manage operational alerts dispatch conditions</p>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-app-surface-muted rounded-lg cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-app-heading">System Logs Summary</p>
                    <p className="text-xs text-app-muted">Receive system performance metrics and account summary logs</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.emailAlerts}
                    onChange={(e) => setNotificationSettings(p => ({ ...p, emailAlerts: e.target.checked }))}
                    className="w-4 h-4 accent-app-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-app-surface-muted rounded-lg cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-app-heading">Critical Telemetry Warnings</p>
                    <p className="text-xs text-app-muted">Trigger explicit telemetry warning when new authentication hooks activate</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.securityAlerts}
                    onChange={(e) => setNotificationSettings(p => ({ ...p, securityAlerts: e.target.checked }))}
                    className="w-4 h-4 accent-app-primary"
                  />
                </label>
              </div>
            </div>
          )}

          {/* SECTION: OFFLINE DEVICES INTEGRATION */}
          {activeSection === 'offline' && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-app-heading">Registered Nodes</h2>
              <p className="text-sm text-app-muted mb-8">Active client sessions verified for secure vault operations</p>

              {loadingDevices ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-app-primary" size={24} />
                  <span className="text-xs font-bold tracking-wider uppercase ml-3 text-app-muted">Polling node topology...</span>
                </div>
              ) : devices.length === 0 ? (
                <div className="p-8 border border-dashed border-app-border rounded-lg text-center">
                  <Smartphone className="mx-auto text-app-muted mb-3" size={32} />
                  <p className="text-sm font-medium text-app-heading">No other active workstations detected</p>
                  <p className="text-xs text-app-muted mt-1">Your current session is your single localized link.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((node) => (
                    <div key={node.id} className="p-4 border border-app-border rounded-lg bg-app-surface flex justify-between items-center text-sm transition-all hover:border-app-border-strong">
                      <div>
                        <p className="font-bold text-app-heading flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                          {node.os} — <span className="font-medium text-app-muted">{node.browser}</span>
                        </p>
                        <p className="text-xs text-app-muted mt-1">
                          Network Identifier: <span className="font-mono text-app-text">{node.ipAddress}</span>
                        </p>
                        <p className="text-[11px] text-app-muted mt-0.5">
                          Session lease threshold expiration: {new Date(node.expiresAt).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRevokeDevice(node.id)}
                        className="text-xs text-red-500 font-bold uppercase tracking-wider hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION: HELP */}
          {activeSection === 'help' && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-app-heading">Support Terminal</h2>
              <p className="text-sm text-app-muted mb-8">Access structural system knowledge base</p>

              <div className="space-y-4 text-sm">
                <div className="p-4 border border-app-border rounded-lg bg-app-surface-muted">
                  <h4 className="font-bold text-app-heading text-xs uppercase tracking-wider mb-1">Documentation Engine</h4>
                  <p className="text-xs text-app-muted mb-2">Review security integration procedures for credential vaults and token parameters.</p>
                  <a href="/docs/vault-integration-guide.pdf" target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline text-app-primary hover:opacity-90">Open Documentation →</a>
                </div>

                <div className="p-4 border border-app-border rounded-lg bg-app-surface-muted">
                  <h4 className="font-bold text-app-heading text-xs uppercase tracking-wider mb-1">Open Diagnostics Ticket</h4>
                  <p className="text-xs text-app-muted mb-2">Experiencing verification pipeline or state execution dropouts?</p>
                  <a href="mailto:support@enterprise.local?subject=Diagnostics%20Pipeline%20Failure" className="text-xs font-bold underline text-app-primary hover:opacity-90">Submit Ticket →</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}