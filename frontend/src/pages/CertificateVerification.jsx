import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Download, 
  Printer, 
  Award, 
  Building2, 
  Clock, 
  Calendar, 
  ExternalLink,
  QrCode,
  Share2
} from 'lucide-react';
import { verificationService } from '../services/verificationService';
import { certificateService } from '../services/certificateService';
import { LoadingSpinner } from '../components/common/Modal';

export const CertificateVerification = () => {
  const { verificationId } = useParams();
  const navigate = useNavigate();

  const [inputVal, setInputVal] = useState(verificationId || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [searched, setSearched] = useState(false);

  const performVerification = async (queryId) => {
    if (!queryId || !queryId.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await verificationService.verifyCredential(queryId.trim());
      setData(res);
    } catch (err) {
      console.error(err);
      setData({
        verification_id: queryId,
        status: 'not_found',
        revocation_reason: 'Network error or unable to locate record.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verificationId) {
      setInputVal(verificationId);
      performVerification(verificationId);
    }
  }, [verificationId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      navigate(`/verify/${inputVal.trim()}`);
      performVerification(inputVal.trim());
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isValid = data?.status === 'valid';
  const isRevoked = data?.status === 'revoked';
  const isNotFound = data?.status === 'not_found' || !data?.status;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Search Bar & Demo Pills */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm no-print">
        <div className="max-w-2xl mx-auto text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Public Global Verification Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verify Academic & Professional Credentials
          </h1>
          <p className="text-xs text-slate-500">
            Instant, cryptographic validation for employers, universities, and background check agencies.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter Verification Hash (e.g. VFY-8A7B6C5D4E3F) or Certificate ID..."
              className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white text-slate-900 font-mono font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Credential</span>
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <span className="font-medium">Quick verification samples:</span>
          <button
            onClick={() => {
              setInputVal('VFY-8A7B6C5D4E3F');
              navigate('/verify/VFY-8A7B6C5D4E3F');
              performVerification('VFY-8A7B6C5D4E3F');
            }}
            className="font-mono text-emerald-600 hover:underline font-bold"
          >
            VFY-8A7B6C5D4E3F (Valid)
          </button>
          <span>•</span>
          <button
            onClick={() => {
              setInputVal('VFY-9REVOKED001');
              navigate('/verify/VFY-9REVOKED001');
              performVerification('VFY-9REVOKED001');
            }}
            className="font-mono text-rose-600 hover:underline font-bold"
          >
            VFY-9REVOKED001 (Revoked)
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner text="Querying cryptographic ledger..." />}

      {/* Verification Result Showcase */}
      {!loading && searched && data && (
        <div className="space-y-6">
          {/* Status Alert Banner */}
          {isValid && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">AUTHENTIC & VALID CREDENTIAL</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    This certificate is genuine, active, and cryptographically verified against the institutional registry.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto no-print">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100/50 flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
                <Link
                  to="/verifications/requests"
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <span>Submit Employer Inquiry</span>
                </Link>
              </div>
            </div>
          )}

          {isRevoked && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">REVOKED CREDENTIAL - INVALID</h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Warning: This certificate was permanently revoked by the issuing authority and cannot be verified as valid.
                  </p>
                </div>
              </div>
              {data.revocation_reason && (
                <div className="mt-3 p-3 rounded-xl bg-white/80 border border-rose-200 text-xs text-rose-900 font-medium">
                  <strong>Official Revocation Reason:</strong> {data.revocation_reason}
                </div>
              )}
            </div>
          )}

          {isNotFound && (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900">
              <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold">Credential Not Found</h3>
                <p className="text-xs mt-0.5">
                  No certificate record exists matching identifier <strong className="font-mono">{data.verification_id}</strong>. Please verify the code on your certificate or contact the issuing institution.
                </p>
              </div>
            </div>
          )}

          {/* Certificate Visual Preview Document */}
          {!isNotFound && (
            <div className="bg-white rounded-3xl border-4 border-slate-200 p-8 sm:p-12 shadow-xl relative overflow-hidden certificate-print-container">
              {/* Outer Decorative Border */}
              <div className="border-2 border-sky-600/40 p-6 sm:p-10 rounded-2xl relative bg-gradient-to-b from-sky-50/20 via-white to-slate-50/30">
                {/* Revoked Watermark */}
                {isRevoked && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
                    <span className="text-6xl sm:text-7xl font-extrabold text-rose-500/20 -rotate-12 uppercase tracking-widest border-8 border-rose-500/20 px-8 py-4 rounded-3xl">
                      REVOKED
                    </span>
                  </div>
                )}

                {/* Issuer Header */}
                <div className="text-center space-y-1 pb-6 border-b border-slate-200/80">
                  <div className="inline-flex items-center gap-2 text-sky-800 font-bold text-xs uppercase tracking-widest">
                    <Award className="w-4 h-4 text-sky-600" />
                    <span>Global Credential Verification System</span>
                  </div>
                  <h3 className="text-sm text-slate-500 font-medium">
                    Accredited Institution: <strong className="text-slate-800">{data.provider_name}</strong>
                  </h3>
                </div>

                {/* Certificate Title */}
                <div className="text-center my-8 space-y-2">
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif">
                    Certificate of Achievement
                  </h2>
                  <p className="text-xs text-slate-500 italic">This is officially presented to certify that</p>
                  
                  {/* Learner Name */}
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-sky-700 pt-2 pb-1 font-serif">
                    {data.learner_name}
                  </h3>
                  <div className="w-48 h-0.5 bg-slate-300 mx-auto" />
                </div>

                {/* Course Details */}
                <div className="text-center max-w-xl mx-auto space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    has successfully satisfied all instructional requirements, curriculum modules, and practical laboratory criteria for the accredited program:
                  </p>
                  <h4 className="text-lg sm:text-xl font-bold text-slate-900">
                    "{data.course_name}"
                  </h4>
                  <div className="inline-flex items-center gap-3 text-xs text-slate-500 font-medium pt-1">
                    <span>Academic Grade: <strong>{data.score}%</strong></span>
                    <span>•</span>
                    <span>Issued: <strong>{new Date(data.issue_date).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                {/* Bottom Signature & Verification Seal Grid */}
                <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center sm:text-left">
                  {/* Left: Authority Signature */}
                  <div>
                    <div className="w-36 h-0.5 bg-slate-400 mb-2 mx-auto sm:mx-0" />
                    <p className="text-xs font-bold text-slate-900">Authorized Academic Registrar</p>
                    <p className="text-[11px] text-slate-500">{data.provider_name}</p>
                  </div>

                  {/* Center: Official Seal */}
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto rounded-full flex flex-col items-center justify-center border-2 ${
                      isValid ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-rose-600 bg-rose-50 text-rose-700'
                    }`}>
                      <Award className="w-6 h-6 mb-0.5" />
                      <span className="text-[8px] font-extrabold uppercase tracking-widest">
                        {isValid ? 'VERIFIED' : 'INVALID'}
                      </span>
                    </div>
                  </div>

                  {/* Right: QR Code & Verification ID */}
                  <div className="sm:text-right space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Cryptographic Identifiers</p>
                    <p className="font-mono text-xs font-bold text-slate-900">
                      ID: {data.certificate_id}
                    </p>
                    <p className="font-mono text-[11px] font-semibold text-sky-700">
                      Hash: {data.verification_id}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Audited: {new Date(data.verified_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificateVerification;
