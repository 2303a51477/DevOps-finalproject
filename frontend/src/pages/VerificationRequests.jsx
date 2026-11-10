import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Building2, 
  Mail, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Send
} from 'lucide-react';
import { verificationService } from '../services/verificationService';
import { Badge } from '../components/common/Badge';
import { Modal, LoadingSpinner } from '../components/common/Modal';

export const VerificationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    requester_name: '',
    requester_email: '',
    requester_organization: '',
    certificate_id: '',
    notes: '',
  });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await verificationService.getVerificationRequests({
        status_filter: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined
      });
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const newReq = await verificationService.submitVerificationRequest(form);
      setIsSubmitOpen(false);
      setSuccessMsg(`Verification Request logged successfully: ${newReq.request_id} (Status: ${newReq.status.toUpperCase()})`);
      setForm({
        requester_name: '',
        requester_email: '',
        requester_organization: '',
        certificate_id: '',
        notes: '',
      });
      loadRequests();
    } catch (err) {
      alert('Error submitting verification request: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employer Verification Inquiries & Audit Log</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit formal pre-employment academic credential checks and inspect audit histories.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitOpen(true)}
          className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Verification Request</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Request ID, Company, or Certificate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadRequests()}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Result:</span>
          {['all', 'verified', 'pending', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Inquiries' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving verification audit log..." />
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No verification inquiries found</p>
            <p className="text-xs text-slate-400 mt-1">Submit an employer background verification inquiry above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Request Identifier</th>
                  <th className="px-6 py-3.5">Requester & Organization</th>
                  <th className="px-6 py-3.5">Target Certificate ID</th>
                  <th className="px-6 py-3.5">Verification Outcome</th>
                  <th className="px-6 py-3.5">Audit Timestamp</th>
                  <th className="px-6 py-3.5">Inquiry Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {req.request_id}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{req.requester_name}</p>
                      <p className="text-[11px] text-slate-500">{req.requester_organization || 'Independent'}</p>
                      <p className="text-[10px] text-slate-400">{req.requester_email}</p>
                    </td>

                    <td className="px-6 py-4 font-mono font-semibold text-sky-700">
                      {req.certificate_id}
                    </td>

                    <td className="px-6 py-4">
                      <Badge status={req.status} size="md" />
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(req.created_at).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={req.notes}>
                      {req.notes || <span className="text-slate-300 italic">No notes provided</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Verification Request Modal */}
      {isSubmitOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsSubmitOpen(false)}
          title="Submit Official Employer Verification Request"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <p className="text-xs text-slate-500">
              Submit a formal pre-employment credential validation request for official institutional records.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Green"
                  value={form.requester_name}
                  onChange={(e) => setForm({ ...form, requester_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Email</label>
                <input
                  type="email"
                  required
                  placeholder="hr@company.com"
                  value={form.requester_email}
                  onChange={(e) => setForm({ ...form, requester_email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Hiring Organization</label>
              <input
                type="text"
                required
                placeholder="e.g. Google Talent Acquisition / Apex Corp"
                value={form.requester_organization}
                onChange={(e) => setForm({ ...form, requester_organization: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Certificate ID or Verification Hash to Audit
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CERT-2026-98124 or VFY-8A7B6C5D4E3F"
                value={form.certificate_id}
                onChange={(e) => setForm({ ...form, certificate_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Purpose & Notes</label>
              <textarea
                rows={2}
                placeholder="Candidate background review for Senior Cloud Engineer role..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSubmitOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Logging...' : 'Submit Inquiry'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default VerificationRequests;

