import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  Search, 
  Filter, 
  ShieldCheck, 
  Download, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { certificateService } from '../services/certificateService';
import { courseService } from '../services/courseService';
import { userService } from '../services/settingsService';
import { Badge } from '../components/common/Badge';
import { Modal, LoadingSpinner } from '../components/common/Modal';

export const CertificateManagement = () => {
  const { user, isAdmin, isProvider, isLearner } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [revokingCert, setRevokingCert] = useState(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Manual Issuance Form
  const [learnersList, setLearnersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [issueForm, setIssueForm] = useState({
    learner_id: '',
    course_id: '',
    score: 100.0,
  });

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const data = await certificateService.getCertificates({
        status_filter: statusFilter !== 'all' ? statusFilter : undefined
      });
      setCertificates(data);

      if (isAdmin || isProvider) {
        const [uData, cData] = await Promise.all([
          userService.getUsers({ role: 'learner' }),
          courseService.getCourses({ provider_id: !isAdmin ? user?.id : undefined })
        ]);
        setLearnersList(uData);
        setCoursesList(cData);
        if (uData.length > 0) setIssueForm(prev => ({ ...prev, learner_id: uData[0].id }));
        if (cData.length > 0) setIssueForm(prev => ({ ...prev, course_id: cData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, [statusFilter, user]);

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await certificateService.issueCertificate(
        Number(issueForm.learner_id),
        Number(issueForm.course_id),
        Number(issueForm.score)
      );
      setIsIssueOpen(false);
      loadCertificates();
    } catch (err) {
      alert('Error issuing certificate: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeConfirm = async (e) => {
    e.preventDefault();
    if (!revokingCert) return;
    setActionLoading(true);
    try {
      await certificateService.revokeCertificate(revokingCert.id, revocationReason);
      setRevokingCert(null);
      setRevocationReason('');
      loadCertificates();
    } catch (err) {
      alert('Error revoking certificate: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCerts = certificates.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.certificate_id.toLowerCase().includes(s) ||
      c.verification_id.toLowerCase().includes(s) ||
      c.learner?.name?.toLowerCase().includes(s) ||
      c.course?.title?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Credential Registry & Certificate Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse cryptographic certificates, issue new credentials, and audit certificate revocations.
          </p>
        </div>

        {(isAdmin || isProvider) && (
          <button
            onClick={() => setIsIssueOpen(true)}
            className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New Certificate</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Certificate ID, Verification Hash, or Learner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Status:</span>
          {['all', 'valid', 'revoked'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Credentials' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Certificate Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving digital credential ledger..." />
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-16">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No certificates matching query</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the filter or search parameters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Certificate Identifiers</th>
                  <th className="px-6 py-3.5">Awarded Learner</th>
                  <th className="px-6 py-3.5">Curriculum & Provider</th>
                  <th className="px-6 py-3.5">Grade Score</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Issued Timestamp</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-slate-900">{cert.certificate_id}</p>
                      <p className="font-mono text-[11px] text-sky-600 font-semibold">
                        {cert.verification_id}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{cert.learner?.name || 'Scholar'}</p>
                      <p className="text-[11px] text-slate-400">{cert.learner?.email}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 line-clamp-1">{cert.course?.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {cert.provider?.organization || cert.provider?.name || 'Academy'}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{cert.score}%</span>
                    </td>

                    <td className="px-6 py-4">
                      <Badge status={cert.status} size="md" />
                      {cert.status === 'revoked' && (
                        <p className="text-[10px] text-rose-600 mt-1 line-clamp-1 italic max-w-xs" title={cert.revocation_reason}>
                          Reason: {cert.revocation_reason}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(cert.issue_date).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Verify Link */}
                        <Link
                          to={`/verify/${cert.verification_id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                          title="Verify Credential Authenticity"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </Link>

                        {/* PDF Download Button */}
                        <button
                          onClick={() => certificateService.downloadPdf(cert.id, `${cert.certificate_id}.pdf`)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                          title="Download Official PDF Certificate"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Revoke Action (Admin or Provider only, if status is valid) */}
                        {(isAdmin || isProvider) && cert.status === 'valid' && (
                          <button
                            onClick={() => {
                              setRevokingCert(cert);
                              setRevocationReason('');
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Revoke Certificate"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
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

      {/* Issue Certificate Modal */}
      {isIssueOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsIssueOpen(false)}
          title="Manual Certificate Issuance"
        >
          <form onSubmit={handleIssueCertificate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Awardee Learner</label>
              <select
                required
                value={issueForm.learner_id}
                onChange={(e) => setIssueForm({ ...issueForm, learner_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                {learnersList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Accredited Course</label>
              <select
                required
                value={issueForm.course_id}
                onChange={(e) => setIssueForm({ ...issueForm, course_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                {coursesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Grade Score (%)</label>
              <input
                type="number"
                min={70}
                max={100}
                required
                value={issueForm.score}
                onChange={(e) => setIssueForm({ ...issueForm, score: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsIssueOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
              >
                {actionLoading ? 'Issuing...' : 'Issue & Sign Certificate'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Revoke Certificate Modal */}
      {revokingCert && (
        <Modal
          isOpen={true}
          onClose={() => setRevokingCert(null)}
          title={`Revoke Certificate: ${revokingCert.certificate_id}`}
        >
          <form onSubmit={handleRevokeConfirm} className="space-y-4">
            <p className="text-xs text-slate-600">
              Revoking this credential will flag it as <strong className="text-rose-600">REVOKED</strong> across the global verification network. Any employers searching this Verification ID will be alerted.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Revocation Reason (Mandatory)
              </label>
              <textarea
                rows={3}
                required
                placeholder="State the academic policy or code of conduct violation..."
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevokingCert(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !revocationReason.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                {actionLoading ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CertificateManagement;
