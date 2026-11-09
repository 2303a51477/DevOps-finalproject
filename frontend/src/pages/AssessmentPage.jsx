import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Download,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { assessmentService } from '../services/assessmentService';
import { certificateService } from '../services/certificateService';
import { LoadingSpinner, Modal } from '../components/common/Modal';

export const AssessmentPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins

  useEffect(() => {
    async function loadAssessment() {
      setLoading(true);
      try {
        const data = await assessmentService.getAssessmentById(assessmentId);
        setAssessment(data);
        if (data.time_limit_mins) {
          setTimeLeft(data.time_limit_mins * 60);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [assessmentId]);

  // Timer countdown
  useEffect(() => {
    if (result || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [result, timeLeft]);

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await assessmentService.submitAssessment(assessmentId, answers);
      setResult(res);
    } catch (err) {
      alert('Error submitting assessment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Certification Examination..." />;
  }

  if (!assessment) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-semibold text-slate-700">Assessment not found</p>
        <Link to="/courses" className="mt-2 text-xs text-sky-600 underline">Return to Courses</Link>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = assessment.questions?.length || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Assessment Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700">
            Official Certification Exam
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">{assessment.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Passing threshold: <strong className="text-slate-800">{assessment.passing_score}%</strong> • {totalQuestions} questions
          </p>
        </div>

        {/* Live Timer */}
        {!result && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-mono text-sm font-bold shadow-sm">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Result Display Card if submitted */}
      {result ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center">
            {result.passed ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <XCircle className="w-10 h-10" />
              </div>
            )}
          </div>

          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              result.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {result.passed ? 'Assessment Passed • Certified' : 'Passing Threshold Not Met'}
            </span>

            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              Final Academic Score: {result.score}%
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Required to pass: {assessment.passing_score}% • Evaluated items: {result.total_questions}
            </p>
          </div>

          {result.passed ? (
            <div className="bg-gradient-to-br from-sky-50 to-emerald-50/50 p-6 rounded-2xl border border-sky-100 text-left space-y-4 max-w-lg mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Credential Minted Automatically!</h4>
                  <p className="text-xs text-slate-500">Cryptographically signed and logged in registry.</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Certificate ID:</span>
                  <span className="font-bold text-slate-800">{result.certificate_id || 'CERT-2026-AUTO'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Verification ID:</span>
                  <span className="font-bold text-sky-600">{result.verification_id || 'VFY-AUTO'}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to={`/verify/${result.verification_id}`}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Credential Online</span>
                </Link>
                <Link
                  to="/learner/dashboard"
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Learner Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-4">
              <p className="text-xs text-slate-600">
                You fell slightly below the required {assessment.passing_score}% threshold. Review your syllabus course materials and reattempt the examination.
              </p>
              <button
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setTimeLeft(assessment.time_limit_mins * 60);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Assessment</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Examination Questions Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {assessment.questions?.map((q, qIndex) => {
              const selectedOption = answers[q.id];
              let options = [];
              try {
                options = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');
              } catch {
                options = [];
              }

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {qIndex + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {q.question_text}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-1 pl-9">
                    {options.map((optionText, optIndex) => {
                      const isSelected = selectedOption === optIndex;
                      return (
                        <label
                          key={optIndex}
                          onClick={() => handleSelectOption(q.id, optIndex)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/60 text-sky-950 font-semibold shadow-sm'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question_${q.id}`}
                            checked={isSelected}
                            onChange={() => handleSelectOption(q.id, optIndex)}
                            className="text-sky-600 focus:ring-sky-500"
                          />
                          <span>{optionText}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              Answered <strong className="text-slate-900">{answeredCount}</strong> of {totalQuestions} questions
            </span>

            <button
              type="submit"
              disabled={submitting || answeredCount === 0}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition-all"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Submit Exam for Instant Credentialing</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AssessmentPage;
