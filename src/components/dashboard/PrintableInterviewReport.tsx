import React from "react";
import { type InterviewAnalysisFull } from "@/lib/interviewIntelligenceApi";

export interface PrintConfig {
  overview: boolean;
  candidateFeedback: boolean;
  interviewerQuality: boolean;
  transcript: boolean;
}

interface Props {
  detail: InterviewAnalysisFull;
  config?: PrintConfig;
}

export const PrintableInterviewReport = React.forwardRef<HTMLDivElement, Props>(({ detail, config }, ref) => {
  const ir = detail.interviewer_report || {};
  const cr = detail.candidate_report || {};
  const iq = detail.interviewer_quality || {};
  const pt = detail.parsed_transcript?.parsed_qa || [];
  
  // Default to all true if no config provided for backward compatibility
  const printConfig = config || { overview: true, candidateFeedback: true, interviewerQuality: true, transcript: true };

  return (
    <div
      ref={ref}
      style={{
        width: "800px",
        backgroundColor: "white",
        color: "#111827",
        padding: "40px",
        fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      {/* ======================= PAGE 1: EXECUTIVE OVERVIEW ======================= */}
      <div style={{ paddingBottom: "20px", borderBottom: "3px solid #4f46e5", marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "900", margin: 0, color: "#111827", textTransform: "uppercase", letterSpacing: "-0.5px" }}>
              Interview Intelligence Report
            </h1>
            <p style={{ fontSize: "16px", color: "#4f46e5", fontWeight: "bold", marginTop: "4px" }}>
              HireHand AI Assessment
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Generated on</p>
            <p style={{ fontSize: "14px", fontWeight: "bold", margin: 0 }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {printConfig.overview && (
        <>
          <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "8px", marginBottom: "30px", border: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 15px 0", color: "#0f172a" }}>Candidate Profile</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ flex: "1 1 45%" }}>
            <p style={{ margin: "0 0 5px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>Name</p>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#0f172a" }}>{detail.candidate_name}</p>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <p style={{ margin: "0 0 5px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>Position</p>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#0f172a" }}>{detail.position_title}</p>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <p style={{ margin: "0 0 5px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>Round</p>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#4f46e5" }}>L{detail.interview_round ?? 1} Technical Assessment</p>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <p style={{ margin: "0 0 5px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>Interview Duration</p>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#0f172a" }}>{Math.round((detail.duration_seconds || 0) / 60)} minutes</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", marginBottom: "35px" }}>
        <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "20px", borderRadius: "12px", flex: 1, textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ fontSize: "13px", color: "#1d4ed8", textTransform: "uppercase", fontWeight: "800", letterSpacing: "1px" }}>Overall Score</div>
          <div style={{ fontSize: "48px", fontWeight: "900", color: "#1e3a8a", marginTop: "5px" }}>{detail.overall_score ?? "—"}</div>
          <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "600" }}>out of 100</div>
        </div>
        <div style={{ backgroundColor: detail.verdict === 'NO HIRE' ? '#fef2f2' : detail.verdict === 'HOLD' ? '#fffbeb' : '#f0fdf4', border: "1px solid", borderColor: detail.verdict === 'NO HIRE' ? '#fecaca' : detail.verdict === 'HOLD' ? '#fde68a' : '#bbf7d0', padding: "20px", borderRadius: "12px", flex: 1, textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ fontSize: "13px", color: detail.verdict === 'NO HIRE' ? '#b91c1c' : detail.verdict === 'HOLD' ? '#d97706' : '#15803d', textTransform: "uppercase", fontWeight: "800", letterSpacing: "1px" }}>Final Verdict</div>
          <div style={{ fontSize: "36px", fontWeight: "900", color: detail.verdict === 'NO HIRE' ? '#991b1b' : detail.verdict === 'HOLD' ? '#b45309' : '#166534', marginTop: "12px" }}>{detail.verdict ?? "PENDING"}</div>
        </div>
      </div>

      <div style={{ marginBottom: "35px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "15px" }}>Executive Summary</h2>
        <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.7", textAlign: "justify" }}>{ir.executive_summary}</p>
        
        {ir.verdict_rationale && (
          <div style={{ marginTop: "15px", backgroundColor: "#f8fafc", padding: "12px 15px", borderLeft: "4px solid #94a3b8", borderRadius: "0 4px 4px 0" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#475569", fontStyle: "italic", lineHeight: "1.6" }}>
              <span style={{ fontWeight: "bold", color: "#334155", fontStyle: "normal" }}>Rationale: </span>
              {ir.verdict_rationale}
            </p>
          </div>
        )}
      </div>

      {ir.competency_summary && (
        <div style={{ marginBottom: "35px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "15px" }}>Competency Evaluation</h2>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
            <div style={{ flex: 1, backgroundColor: "#ffffff", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Technical</div>
              <div style={{ fontSize: "24px", fontWeight: "900", color: "#2563eb" }}>{ir.competency_summary.technical_avg ?? "N/A"}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#ffffff", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Behavioral</div>
              <div style={{ fontSize: "24px", fontWeight: "900", color: "#8b5cf6" }}>{ir.competency_summary.behavioral_avg ?? "N/A"}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#ffffff", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Communication</div>
              <div style={{ fontSize: "24px", fontWeight: "900", color: "#10b981" }}>{ir.competency_summary.communication_avg ?? "N/A"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Strengths & Concerns */}
      <div style={{ display: "flex", gap: "25px", marginBottom: "35px" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#059669", borderBottom: "1px solid #a7f3d0", paddingBottom: "8px", marginBottom: "12px" }}>Key Strengths</h2>
          {ir.key_strengths && ir.key_strengths.length > 0 ? (
            <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
              {ir.key_strengths.map((s: any, idx: number) => (
                <li key={idx} style={{ marginBottom: "10px" }}>
                  <strong style={{ color: "#0f172a" }}>{s.strength}: </strong> {s.evidence}
                </li>
              ))}
            </ul>
          ) : <p style={{ fontSize: "13px", fontStyle: "italic", color: "#94a3b8" }}>No notable strengths recorded.</p>}
        </div>
        
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#dc2626", borderBottom: "1px solid #fecaca", paddingBottom: "8px", marginBottom: "12px" }}>Key Concerns</h2>
          {ir.key_concerns && ir.key_concerns.length > 0 ? (
            <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
              {ir.key_concerns.map((c: any, idx: number) => (
                <li key={idx} style={{ marginBottom: "10px" }}>
                  <strong style={{ color: "#0f172a" }}>{c.concern} </strong> 
                  <span style={{ fontSize: "10px", padding: "1px 6px", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "10px", marginLeft: "4px" }}>{c.severity}</span><br />
                  <span style={{ color: "#475569" }}>{c.evidence}</span>
                </li>
              ))}
            </ul>
          ) : <p style={{ fontSize: "13px", fontStyle: "italic", color: "#94a3b8" }}>No major concerns recorded.</p>}
        </div>
      </div>

      {/* Recruiter Insights */}
      <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", marginBottom: "15px" }}>Additional Recruiter Insights</h2>
        
        {ir.culture_fit_assessment && (
          <div style={{ marginBottom: "15px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "bold", color: "#475569", margin: "0 0 5px 0", textTransform: "uppercase" }}>Culture Fit</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>{ir.culture_fit_assessment}</p>
          </div>
        )}
        
        {ir.salary_positioning && (
          <div style={{ marginBottom: "15px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "bold", color: "#475569", margin: "0 0 5px 0", textTransform: "uppercase" }}>Suggested Leveling</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>{ir.salary_positioning}</p>
          </div>
        )}

        {ir.recommended_next_steps && ir.recommended_next_steps.length > 0 && (
          <div>
            <h3 style={{ fontSize: "13px", fontWeight: "bold", color: "#475569", margin: "0 0 5px 0", textTransform: "uppercase" }}>Recommended Next Steps</h3>
            <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "13px", color: "#334155" }}>
              {ir.recommended_next_steps.map((step: string, idx: number) => (
                <li key={idx} style={{ marginBottom: "4px" }}>{step}</li>
              ))}
            </ul>
          </div>
        )}
        </div>
        </>
      )}

      {/* ======================= PAGE 2: CANDIDATE FEEDBACK ======================= */}
      {printConfig.candidateFeedback && (
      <div style={{ pageBreakBefore: printConfig.overview ? "always" : "auto", paddingTop: "10px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#111827", borderBottom: "3px solid #6366f1", paddingBottom: "10px", marginBottom: "25px" }}>
          Candidate Performance Review
        </h1>
        
        <div style={{ display: "flex", gap: "20px", marginBottom: "25px", alignItems: "center" }}>
          <div style={{ backgroundColor: "#e0e7ff", padding: "15px", borderRadius: "10px", border: "1px solid #c7d2fe", textAlign: "center", width: "120px" }}>
            <div style={{ fontSize: "12px", color: "#4338ca", fontWeight: "bold", textTransform: "uppercase" }}>Grade</div>
            <div style={{ fontSize: "32px", fontWeight: "900", color: "#312e81", marginTop: "4px" }}>{cr.grade ?? "—"}</div>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#1e293b", margin: "0 0 8px 0" }}>Overall Assessment</h3>
            <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6", margin: 0 }}>{cr.overall_performance || "No performance summary available."}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "25px", marginBottom: "30px" }}>
          <div style={{ flex: 1, backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#166534", marginBottom: "15px", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "16px", marginRight: "6px" }}>✓</span> What Went Well
            </h3>
            {cr.strengths && cr.strengths.length > 0 ? (
              <ul style={{ paddingLeft: "15px", margin: 0, fontSize: "13px", color: "#15803d", lineHeight: "1.6" }}>
                {cr.strengths.map((s: any, idx: number) => (
                  <li key={idx} style={{ marginBottom: "10px" }}>
                    <strong>{s.area}</strong><br/>
                    <span style={{ color: "#166534", opacity: 0.85 }}>{s.detail}</span>
                  </li>
                ))}
              </ul>
            ) : <p style={{ fontSize: "13px", color: "#166534", opacity: 0.7, margin: 0 }}>No details logged.</p>}
          </div>

          <div style={{ flex: 1, backgroundColor: "#fef2f2", padding: "20px", borderRadius: "8px", border: "1px solid #fecaca" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#991b1b", marginBottom: "15px", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "16px", marginRight: "6px" }}>⚠</span> Areas For Improvement
            </h3>
            {cr.improvements && cr.improvements.length > 0 ? (
              <ul style={{ paddingLeft: "15px", margin: 0, fontSize: "13px", color: "#991b1b", lineHeight: "1.6" }}>
                {cr.improvements.map((i: any, idx: number) => (
                  <li key={idx} style={{ marginBottom: "10px" }}>
                    <strong>{i.area}</strong> <span style={{ fontSize: "10px", padding: "1px 6px", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "10px", marginLeft: "4px" }}>{i.priority}</span><br/>
                    <span style={{ color: "#7f1d1d", opacity: 0.85 }}>{i.detail}</span>
                  </li>
                ))}
              </ul>
            ) : <p style={{ fontSize: "13px", color: "#991b1b", opacity: 0.7, margin: 0 }}>No details logged.</p>}
          </div>
        </div>

        {/* Alternative Roles & Tips */}
        <div style={{ display: "flex", gap: "25px", marginBottom: "30px" }}>
           {cr.alternative_roles && cr.alternative_roles.length > 0 && (
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#1e293b", marginBottom: "12px" }}>Alternative Role Suggestions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {cr.alternative_roles.map((r: any, idx: number) => (
                  <div key={idx} style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", padding: "12px", borderRadius: "6px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "13px", color: "#334155" }}>{r.role}</div>
                    <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>{r.reason}</div>
                  </div>
                ))}
              </div>
            </div>
           )}

           {cr.skill_development && cr.skill_development.length > 0 && (
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#1e293b", marginBottom: "12px" }}>Skill Development Tracker</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {cr.skill_development.map((s: any, idx: number) => (
                  <div key={idx} style={{ backgroundColor: "#fdf4ff", border: "1px solid #f5d0fe", padding: "12px", borderRadius: "6px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "13px", color: "#86198f" }}>{s.skill}</div>
                    <div style={{ fontSize: "12px", color: "#a21caf", marginTop: "4px" }}>{s.resource_suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
           )}
        </div>
        
        {cr.interview_tips && cr.interview_tips.length > 0 && (
          <div style={{ backgroundColor: "#fffbeb", padding: "15px 20px", borderRadius: "8px", border: "1px dashed #fcd34d" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#b45309", margin: "0 0 10px 0" }}>Personalized Interview Advice</h3>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#92400e", lineHeight: "1.5" }}>
              {cr.interview_tips.map((tip: string, idx: number) => (
                <li key={idx} style={{ marginBottom: "6px" }}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      )}

      {/* ======================= PAGE 3: INTERVIEWER QUALITY (Optional but requested) ======================= */}
      {printConfig.interviewerQuality && (
      <div style={{ pageBreakBefore: (printConfig.overview || printConfig.candidateFeedback) ? "always" : "auto", paddingTop: "10px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#111827", borderBottom: "3px solid #14b8a6", paddingBottom: "10px", marginBottom: "25px" }}>
          Interviewer Quality Audit
        </h1>
        
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "25px" }}>
          This section evaluates the quality of the technical interview to ensure fairness, comprehensive coverage, and effective assessment of the candidate based on the predefined job description.
        </p>

        <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
          <div style={{ flex: 1, backgroundColor: "#f0fdfa", padding: "15px", borderRadius: "8px", border: "1px solid #ccfbf1", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#0f766e", textTransform: "uppercase", fontWeight: "bold" }}>Interviewer Rating</div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "#115e59", marginTop: "4px" }}>{iq.interviewer_rating ?? "—"}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: "#f0fdfa", padding: "15px", borderRadius: "8px", border: "1px solid #ccfbf1", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#0f766e", textTransform: "uppercase", fontWeight: "bold" }}>Question Quality</div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "#115e59", marginTop: "4px" }}>{iq.question_quality_score ?? "—"}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: "#f0fdfa", padding: "15px", borderRadius: "8px", border: "1px solid #ccfbf1", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#0f766e", textTransform: "uppercase", fontWeight: "bold" }}>JD Coverage</div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "#115e59", marginTop: "4px" }}>{iq.competency_coverage_percent ? `${iq.competency_coverage_percent}%` : "—"}</div>
          </div>
        </div>

        <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "25px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#1e293b", margin: "0 0 10px 0" }}>Interviewer Feedback</h3>
          <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.6", margin: 0 }}>{iq.interviewer_feedback || "No direct feedback provided."}</p>
        </div>

        <div style={{ display: "flex", gap: "25px", marginBottom: "25px" }}>
          <div style={{ flex: 1 }}>
             <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1e293b", marginBottom: "8px" }}>Best Question Asked</h3>
             <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", margin: 0, padding: "12px", backgroundColor: "#f1f5f9", borderRadius: "6px" }}>
                {iq.best_question_asked || "Not identified"}
             </p>
          </div>
          <div style={{ flex: 1 }}>
             <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1e293b", marginBottom: "8px" }}>Missed Opportunity</h3>
             <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", margin: 0, padding: "12px", backgroundColor: "#f1f5f9", borderRadius: "6px" }}>
                {iq.missed_opportunity || "Not identified"}
             </p>
          </div>
        </div>

        {(iq.coverage_gaps?.length > 0 || iq.bias_indicators?.length > 0) && (
          <div style={{ display: "flex", gap: "25px" }}>
            {iq.coverage_gaps && iq.coverage_gaps.length > 0 && (
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#d97706", marginBottom: "8px" }}>JD Coverage Gaps</h3>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#92400e" }}>
                  {iq.coverage_gaps.map((gap: string, i: number) => <li key={i}>{gap}</li>)}
                </ul>
              </div>
            )}
            {iq.bias_indicators && iq.bias_indicators.length > 0 && (
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#dc2626", marginBottom: "8px" }}>Bias Indicators</h3>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#991b1b" }}>
                  {iq.bias_indicators.map((bias: string, i: number) => <li key={i}>{bias}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* ======================= PAGE 4: TRANSCRIPT TRACE ======================= */}
      {printConfig.transcript && pt && pt.length > 0 && (
        <div style={{ pageBreakBefore: (printConfig.overview || printConfig.candidateFeedback || printConfig.interviewerQuality) ? "always" : "auto", paddingTop: "10px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#111827", borderBottom: "3px solid #94a3b8", paddingBottom: "10px", marginBottom: "25px" }}>
            Analyzed Interview Transcript
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
            The following Q&A pairs were successfully extracted and evaluated by HireHand AI from the live interview audio.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {pt.map((qa: any, index: number) => (
              <div key={index} style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ backgroundColor: "#f1f5f9", padding: "10px 15px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#475569" }}>Q{qa.question_number || index + 1}</span>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#6366f1", backgroundColor: "#e0e7ff", padding: "2px 8px", borderRadius: "10px" }}>
                    {qa.topic_category || "General"}
                  </span>
                </div>
                <div style={{ padding: "15px" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Interviewer</span>
                    <p style={{ fontSize: "13px", color: "#1e293b", margin: 0, fontWeight: "500", lineHeight: "1.5" }}>{qa.interviewer_question}</p>
                  </div>
                  <div style={{ paddingLeft: "12px", borderLeft: "3px solid #cbd5e1" }}>
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Candidate</span>
                    <p style={{ fontSize: "13px", color: "#334155", margin: 0, lineHeight: "1.5" }}>{qa.candidate_answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professional Footer across all pages logically */}
      <div style={{ marginTop: "50px", paddingTop: "20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        <span>Confidential & Internal Use Only</span>
        <span>HireHand AI Interview Intelligence • {new Date().getFullYear()}</span>
      </div>
    </div>
  );
});

PrintableInterviewReport.displayName = "PrintableInterviewReport";
