/**
 * generateFitmentPDF — Generates a professional styled EOS-IA Fitment Report PDF
 * Uses jsPDF with programmatic drawing for pixel-perfect results.
 */
import jsPDF from 'jspdf';
import type { FitmentReport } from '@/types/psychometric';

// Palette
const C = {
  bg: '#0f1117',
  card: '#161b27',
  border: '#1e2535',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  muted: '#64748b',
  text: '#f1f5f9',
  subtext: '#94a3b8',
  emerald: '#34d399',
  yellow: '#fbbf24',
  red: '#f87171',
  white: '#ffffff',
};

function hex(color: string): [number, number, number] {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return [r, g, b];
}

function verdictColor(v: string) {
  if (v === 'GO') return C.emerald;
  if (v === 'NO-GO') return C.red;
  return C.yellow;
}

function riskColor(r: string) {
  if (r === 'LOW') return C.emerald;
  if (r === 'HIGH') return C.red;
  return C.yellow;
}

function traitBarColor(score: number) {
  if (score >= 8) return C.emerald;
  if (score >= 6) return C.yellow;
  return C.red;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth);
}

export async function generateFitmentPDF(
  report: FitmentReport,
  candidateName: string,
  positionTitle: string,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 14;
  const contentW = W - margin * 2;
  let y = 0;

  // ── Helper functions ──────────────────────────────────────────────────────
  const fillRect = (x: number, yy: number, w: number, h: number, color: string) => {
    doc.setFillColor(...hex(color));
    doc.rect(x, yy, w, h, 'F');
  };

  const roundRect = (x: number, yy: number, w: number, h: number, r: number, color: string) => {
    doc.setFillColor(...hex(color));
    doc.roundedRect(x, yy, w, h, r, r, 'F');
  };

  const text = (txt: string, x: number, yy: number, color: string, size: number, style: 'normal' | 'bold' = 'normal') => {
    doc.setTextColor(...hex(color));
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.text(txt, x, yy);
  };

  // ── PAGE BACKGROUND ───────────────────────────────────────────────────────
  fillRect(0, 0, W, 297, C.bg);

  // ── HEADER GRADIENT BAND ──────────────────────────────────────────────────
  fillRect(0, 0, W, 36, '#1a1f35');

  // EOS-IA logo circle
  doc.setFillColor(...hex(C.primary));
  doc.circle(margin + 5, 18, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('EOS', margin + 2.2, 18.8);

  // Header title
  text('EOS-IA Psychometric Intelligence Report', margin + 14, 14, C.text, 11, 'bold');
  text('Confidential — For Internal HR Use Only', margin + 14, 21, C.muted, 7);

  // Date top right
  const dateStr = report.generated_at?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  doc.setTextColor(...hex(C.subtext));
  doc.setFontSize(7);
  doc.text(dateStr, W - margin, 14, { align: 'right' });
  doc.text(`Position: ${positionTitle}`, W - margin, 21, { align: 'right' });

  // Divider line
  doc.setDrawColor(...hex(C.primary));
  doc.setLineWidth(0.5);
  doc.line(margin, 36, W - margin, 36);

  y = 45;

  // ── CANDIDATE NAME SECTION ────────────────────────────────────────────────
  text(candidateName, margin, y, C.white, 16, 'bold');
  y += 5;
  text('Candidate Psychometric Assessment', margin, y, C.subtext, 8);
  y += 10;

  // ── VERDICT BANNER ────────────────────────────────────────────────────────
  const vColor = verdictColor(report.verdict.decision);
  const vBgHex = report.verdict.decision === 'GO'
    ? '#0d2b1e' : report.verdict.decision === 'NO-GO'
    ? '#2b0d0d' : '#2b220d';
  roundRect(margin, y, contentW, 22, 3, vBgHex);
  // Left accent bar
  doc.setFillColor(...hex(vColor));
  doc.rect(margin, y, 3, 22, 'F');

  // Verdict text
  text(report.verdict.decision, margin + 8, y + 8, vColor, 14, 'bold');
  text(`${report.composite_psych_score}%`, margin + 8 + (report.verdict.decision.length * 3.8), y + 8, vColor, 14, 'bold');

  // Rationale
  doc.setFontSize(7.5);
  doc.setTextColor(...hex(C.subtext));
  const rationaleLines = doc.splitTextToSize(report.verdict.rationale, contentW - 20);
  doc.text(rationaleLines.slice(0, 2), margin + 8, y + 14);
  y += 28;

  // ── TWO COLUMN SECTION ────────────────────────────────────────────────────
  const col1X = margin;
  const col2X = margin + contentW / 2 + 3;
  const colW = contentW / 2 - 4;

  // ── LEFT: TRAIT SCORING MATRIX ────────────────────────────────────────────
  const matrixStartY = y;
  roundRect(col1X, y, colW, 4, 0, C.card);
  text('↗  Trait Scoring Matrix', col1X + 3, y + 3, C.primaryLight, 8, 'bold');
  y += 6;

  // Card bg
  const matrixH = report.trait_matrix.length * 18 + 4;
  roundRect(col1X, y, colW, matrixH, 2, C.card);
  y += 4;

  report.trait_matrix.forEach(t => {
    // Trait name + score
    text(t.trait, col1X + 3, y + 3.5, C.text, 7, 'bold');
    const scoreStr = `${t.score}/10`;
    const scoreCol = t.score >= 8 ? C.emerald : t.score >= 6 ? C.yellow : C.red;
    doc.setTextColor(...hex(scoreCol));
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(scoreStr, col1X + colW - 3, y + 3.5, { align: 'right' });

    // Progress bar track
    const barY = y + 5.5;
    const barW = colW - 6;
    roundRect(col1X + 3, barY, barW, 2.2, 1, '#1e2535');
    const fill = Math.max(2, (t.score / 10) * barW);
    roundRect(col1X + 3, barY, fill, 2.2, 1, traitBarColor(t.score));

    // Interpretation (1 line)
    doc.setFontSize(5.8);
    doc.setTextColor(...hex(C.muted));
    doc.setFont('helvetica', 'normal');
    const interp = doc.splitTextToSize(t.interpretation, colW - 6);
    doc.text(interp[0] || '', col1X + 3, y + 10);

    y += 18;
  });

  // ── RIGHT COLUMN ──────────────────────────────────────────────────────────
  let rightY = matrixStartY;

  // Pattern Cluster card
  const clusterSentColor =
    report.pattern_cluster.sentiment === 'positive' ? C.emerald
    : report.pattern_cluster.sentiment === 'negative' ? C.red
    : C.primaryLight;

  roundRect(col2X, rightY, colW, 4, 0, C.card);
  text('✦  Pattern Cluster', col2X + 3, rightY + 3, C.primaryLight, 8, 'bold');
  rightY += 6;

  roundRect(col2X, rightY, colW, 32, 2, C.card);
  roundRect(col2X + 3, rightY + 4, colW - 6, 7, 2, '#1a1f35');
  text(report.pattern_cluster.name, col2X + 6, rightY + 9, clusterSentColor, 8, 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...hex(C.subtext));
  const clusterLines = doc.splitTextToSize(report.pattern_cluster.description, colW - 6);
  doc.text(clusterLines.slice(0, 3), col2X + 3, rightY + 16);
  rightY += 37;

  // Psychometric Risk card
  const rColor = riskColor(report.risk.level);
  roundRect(col2X, rightY, colW, 4, 0, C.card);
  text('⚠  Psychometric Risk', col2X + 3, rightY + 3, C.primaryLight, 8, 'bold');
  rightY += 6;

  roundRect(col2X, rightY, colW, 36, 2, C.card);
  // Risk badge
  roundRect(col2X + colW - 22, rightY + 3, 19, 5.5, 2, '#1e2535');
  doc.setTextColor(...hex(rColor));
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(report.risk.level, col2X + colW - 12.5, rightY + 7, { align: 'center' });

  text(report.risk.statement, col2X + 3, rightY + 11, C.text, 7, 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...hex(C.subtext));
  doc.setFont('helvetica', 'normal');
  const riskLines = doc.splitTextToSize(report.risk.role_specific_risk, colW - 6);
  doc.text(riskLines.slice(0, 4), col2X + 3, rightY + 17);
  rightY += 41;

  // Adjust y to max of left and right
  y = Math.max(y + 4, rightY);

  // ── COACHING NOTE ─────────────────────────────────────────────────────────
  roundRect(margin, y, contentW, 4, 0, C.card);
  text('📌  Coaching Recommendation', margin + 3, y + 3, C.primaryLight, 8, 'bold');
  y += 6;

  const coachLines = doc.splitTextToSize(report.verdict.coaching_note, contentW - 8);
  const coachH = Math.min(coachLines.length, 4) * 4 + 8;
  roundRect(margin, y, contentW, coachH, 2, C.card);
  // Accent line left
  doc.setFillColor(...hex(C.primary));
  doc.rect(margin, y, 2.5, coachH, 'F');
  doc.setFontSize(7);
  doc.setTextColor(...hex(C.text));
  doc.setFont('helvetica', 'normal');
  doc.text(coachLines.slice(0, 4), margin + 6, y + 6);
  y += coachH + 10;

  // ── FOOTER ────────────────────────────────────────────────────────────────
  fillRect(0, 280, W, 17, '#1a1f35');
  doc.setDrawColor(...hex(C.border));
  doc.setLineWidth(0.3);
  doc.line(margin, 280, W - margin, 280);

  text('EOS-IA Psychometric Intelligence System', margin, 287, C.muted, 7);
  text('Confidential — Not for distribution', margin, 292, C.muted, 6);
  text(`Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`, W - margin, 287, C.muted, 6.5);
  doc.setTextColor(...hex(C.primary));
  doc.setFontSize(6.5);
  doc.text('HireHand · EOS-IA v3.0', W - margin, 292, { align: 'right' });

  // ── WATERMARK ─────────────────────────────────────────────────────────────
  doc.setTextColor(255, 255, 255);
  doc.setGState(new (doc as any).GState({ opacity: 0.03 }));
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  doc.text('EOS-IA', W / 2, 160, { align: 'center', angle: 45 });
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  // ── SAVE ──────────────────────────────────────────────────────────────────
  const fileName = `EOS-IA_${candidateName.replace(/\s+/g, '_')}_FitmentReport_${dateStr}.pdf`;
  doc.save(fileName);
}
