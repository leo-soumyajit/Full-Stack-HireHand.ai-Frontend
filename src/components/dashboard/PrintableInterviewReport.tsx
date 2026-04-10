import React from "react";
import { type InterviewAnalysisFull } from "@/lib/interviewIntelligenceApi";

interface Props {
  detail: InterviewAnalysisFull;
}

export const PrintableInterviewReport = React.forwardRef<HTMLDivElement, Props>(({ detail }, ref) => {
  const ir = detail.interviewer_report || {};
  const cr = detail.candidate_report || {};
  const iq = detail.interviewer_quality || {};

  return (
    <div
      ref={ref}
      style={{
        width: "800px", // A4 width proportion
        backgroundColor: "white",
        color: "black",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: "20px", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#111827" }}>
          Interview Report: {detail.candidate_name}
        </h1>
        <p style={{ fontSize: "14px", color: "#4b5563", marginTop: "8px" }}>
          Role: <strong>{detail.position_title}</strong> | Duration: {Math.round(detail.duration_seconds / 60)} min | Date: {detail.created_at?.slice(0, 10)}
          <span style={{ marginLeft: "12px", padding: "2px 8px", backgroundColor: "#e0e7ff", color: "#3730a3", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
            Round L{detail.interview_round ?? 1}
          </span>
        </p>
      </div>

      {/* Score & Verdict Box */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div style={{ backgroundColor: "#f3f4f6", padding: "20px", borderRadius: "8px", flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#4b5563", textTransform: "uppercase", fontWeight: "bold" }}>Overall Score</div>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: "#111827", marginTop: "5px" }}>{detail.overall_score ?? "—"}</div>
        </div>
        <div style={{ backgroundColor: "#f3f4f6", padding: "20px", borderRadius: "8px", flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#4b5563", textTransform: "uppercase", fontWeight: "bold" }}>Verdict</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", marginTop: "10px" }}>{detail.verdict ?? "PENDING"}</div>
        </div>
      </div>

      {/* Executive Summary */}
      {ir.executive_summary && (
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px", color: "#111827" }}>Executive Summary</h2>
          <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", marginTop: "10px" }}>{ir.executive_summary}</p>
        </div>
      )}

      {/* Competency Summary */}
      {ir.competency_summary && (
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px", color: "#111827" }}>Competency Scores</h2>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
            <div style={{ textAlign: "center", padding: "10px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", width: "30%" }}>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#2563eb" }}>{ir.competency_summary.technical_avg ?? "N/A"}</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", textTransform: "uppercase" }}>Technical</div>
            </div>
            <div style={{ textAlign: "center", padding: "10px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", width: "30%" }}>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#8b5cf6" }}>{ir.competency_summary.behavioral_avg ?? "N/A"}</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", textTransform: "uppercase" }}>Behavioral</div>
            </div>
            <div style={{ textAlign: "center", padding: "10px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", width: "30%" }}>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#10b981" }}>{ir.competency_summary.communication_avg ?? "N/A"}</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", textTransform: "uppercase" }}>Communication</div>
            </div>
          </div>
        </div>
      )}

      {/* Strengths & Concerns */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        {ir.key_strengths && ir.key_strengths.length > 0 && (
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#059669", marginBottom: "10px" }}>Key Strengths</h2>
            <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "13px", color: "#374151" }}>
              {ir.key_strengths.map((s: any, idx: number) => (
                <li key={idx} style={{ marginBottom: "8px" }}>
                  <strong>{s.strength}:</strong> {s.evidence}
                </li>
              ))}
            </ul>
          </div>
        )}
        {ir.key_concerns && ir.key_concerns.length > 0 && (
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#dc2626", marginBottom: "10px" }}>Key Concerns</h2>
            <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "13px", color: "#374151" }}>
              {ir.key_concerns.map((c: any, idx: number) => (
                <li key={idx} style={{ marginBottom: "8px" }}>
                  <strong>{c.concern}:</strong> {c.evidence}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Page Break for Candidate Feedback */}
      <div style={{ pageBreakBefore: "always", paddingTop: "20px" }}>
        <div style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: "10px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", margin: 0 }}>Candidate Feedback Summary</h2>
        </div>
        
        {cr.overall_performance && (
          <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", marginBottom: "20px" }}>{cr.overall_performance}</p>
        )}

        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          {cr.strengths && cr.strengths.length > 0 && (
            <div style={{ flex: 1, backgroundColor: "#f0fdf4", padding: "15px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#166534", marginBottom: "10px" }}>What went well</h3>
              <ul style={{ paddingLeft: "15px", margin: 0, fontSize: "13px", color: "#374151" }}>
                {cr.strengths.map((s: any, idx: number) => (
                  <li key={idx} style={{ marginBottom: "6px" }}><strong>{s.area}</strong></li>
                ))}
              </ul>
            </div>
          )}
          {cr.improvements && cr.improvements.length > 0 && (
            <div style={{ flex: 1, backgroundColor: "#fef2f2", padding: "15px", borderRadius: "8px", border: "1px solid #fecaca" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#991b1b", marginBottom: "10px" }}>Areas for Improvement</h3>
              <ul style={{ paddingLeft: "15px", margin: 0, fontSize: "13px", color: "#374151" }}>
                {cr.improvements.map((i: any, idx: number) => (
                  <li key={idx} style={{ marginBottom: "6px" }}><strong>{i.area}</strong></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer across pages automatically handled by html2pdf if needed, but we output it statically here */}
      <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e5e7eb", textAlign: "center", fontSize: "12px", color: "#9ca3af" }}>
        Securely generated by HireHand AI Interview Intelligence • {new Date().toLocaleDateString()}
      </div>
    </div>
  );
});

PrintableInterviewReport.displayName = "PrintableInterviewReport";
