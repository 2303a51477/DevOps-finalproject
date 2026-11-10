import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  Award, 
  Mail, 
  Sliders, 
  CheckCircle2, 
  RefreshCw,
  QrCode
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { LoadingSpinner } from '../components/common/Modal';

export const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key, val) => {
    setSettings(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess('');
    try {
      for (const [k, v] of Object.entries(settings)) {
        await settingsService.updateSetting(k, v.toString());
      }
      setSavedSuccess('System configurations successfully synchronized to database.');
    } catch (err) {
      alert('Error updating system settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving system configuration..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Certification Configurations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global governance parameters, passing criteria thresholds, and security seal toggles.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Config</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedSuccess}</span>
          </div>
          <button onClick={() => setSavedSuccess('')} className="font-bold text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: Platform Identity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-600" />
            <span>Platform Branding & Identity</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Platform Portal Title</label>
              <input
                type="text"
                value={settings.platform_name || ''}
                onChange={(e) => handleChange('platform_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Displayed across top navigation bar, certificates, and email headers.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Registrar Support Email</label>
              <input
                type="email"
                value={settings.support_email || ''}
                onChange={(e) => handleChange('support_email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Credential & Examination Criteria */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-sky-600" />
            <span>Accreditation & Passing Thresholds</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Assessment Passing Score (%)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={settings.default_passing_percentage || '75.0'}
                onChange={(e) => handleChange('default_passing_percentage', e.target.value)}
                className="w-48 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:outline-none font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Baseline threshold applied to newly created technical quizzes.</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Automatic Certificate Issuance</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automatically mint and log digital credentials when a learner finishes 100% syllabus and passes exam.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_issue_certificates === 'true'}
                onChange={(e) => handleChange('auto_issue_certificates', e.target.checked ? 'true' : 'false')}
                className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Verification Security & Seals */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Verification Network Security Parameters</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Verification Mode</label>
              <select
                value={settings.verification_mode || 'instant'}
                onChange={(e) => handleChange('verification_mode', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="instant">Instant Real-Time Cryptographic Lookup (Recommended)</option>
                <option value="strict">Strict Dual-Signature Validation</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Render Official Security Seal on PDF</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Embed tamper-evident gold seal graphic and QR code on generated PDF certificates.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.security_seal_enabled === 'true'}
                onChange={(e) => handleChange('security_seal_enabled', e.target.checked ? 'true' : 'false')}
                className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-sky-600/20 hover:shadow-lg flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Synchronizing...' : 'Save Configuration Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;

