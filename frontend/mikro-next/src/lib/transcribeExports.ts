/**
 * Transcript export helpers — .txt and .pdf downloads used by both the
 * main Transcribe page and the Library detail view.
 *
 * The .pdf path dynamically imports jspdf so it's only pulled into the
 * bundle when the user actually clicks Download PDF.
 */

import type { TranscriptionSegment } from "./transcribe";
import { formatTimestamp } from "./transcribe";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 100) || "transcript";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function buildTranscriptText(
  segments: TranscriptionSegment[],
  fullText: string,
): string {
  if (segments.length === 0) return fullText || "";
  const header = "Transcript\n──────────\n\n";
  const lines = segments.map(
    (s) => `[${formatTimestamp(s.timeStart)} → ${formatTimestamp(s.timeEnd)}] ${s.text}`,
  );
  return header + lines.join("\n");
}

export function downloadTranscriptTxt(
  segments: TranscriptionSegment[],
  fullText: string,
  displayName: string,
) {
  const content = buildTranscriptText(segments, fullText);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${sanitizeFilename(displayName)}.txt`);
}

export async function downloadTranscriptPdf(
  segments: TranscriptionSegment[],
  fullText: string,
  displayName: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const MARGIN_X = 48;
  const MARGIN_TOP = 56;
  const MARGIN_BOTTOM = 56;
  const LINE_HEIGHT = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const usableW = pageW - MARGIN_X * 2;
  let cursorY = MARGIN_TOP;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(displayName, MARGIN_X, cursorY);
  cursorY += LINE_HEIGHT * 1.5;

  // Subtitle (segment count / date)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `${segments.length} segment${segments.length === 1 ? "" : "s"}  •  ` +
      `Exported ${new Date().toLocaleString()}`,
    MARGIN_X,
    cursorY,
  );
  cursorY += LINE_HEIGHT * 1.5;
  doc.setTextColor(0);

  doc.setFontSize(10);

  const emitLine = (text: string, opts?: { bold?: boolean; color?: [number, number, number] }) => {
    if (cursorY > pageH - MARGIN_BOTTOM) {
      doc.addPage();
      cursorY = MARGIN_TOP;
    }
    if (opts?.bold) {
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    if (opts?.color) {
      doc.setTextColor(opts.color[0], opts.color[1], opts.color[2]);
    } else {
      doc.setTextColor(0);
    }
    doc.text(text, MARGIN_X, cursorY);
    cursorY += LINE_HEIGHT;
  };

  const content = segments.length > 0 ? segments : null;

  if (content) {
    for (const seg of content) {
      // Timestamp line in blue
      emitLine(`[${formatTimestamp(seg.timeStart)} → ${formatTimestamp(seg.timeEnd)}]`, {
        bold: true,
        color: [0, 78, 137],
      });
      // Wrapped body text
      const wrapped: string[] = doc.splitTextToSize(seg.text.trim(), usableW);
      for (const line of wrapped) {
        emitLine(line);
      }
      cursorY += LINE_HEIGHT * 0.3;
    }
  } else if (fullText) {
    const wrapped: string[] = doc.splitTextToSize(fullText, usableW);
    for (const line of wrapped) {
      emitLine(line);
    }
  }

  doc.save(`${sanitizeFilename(displayName)}.pdf`);
}

/** AI result export — plain markdown (txt is fine), or rendered PDF. */
export function downloadAiResultTxt(
  content: string,
  presetLabel: string,
  displayName: string,
) {
  const header = `${presetLabel} — ${displayName}\n${"─".repeat(40)}\n\n`;
  const blob = new Blob([header + content], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${sanitizeFilename(displayName)}-${sanitizeFilename(presetLabel)}.txt`);
}

export async function downloadAiResultPdf(
  content: string,
  presetLabel: string,
  displayName: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const MARGIN_X = 48;
  const MARGIN_TOP = 56;
  const MARGIN_BOTTOM = 56;
  const LINE_HEIGHT = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const usableW = pageW - MARGIN_X * 2;
  let cursorY = MARGIN_TOP;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${presetLabel}`, MARGIN_X, cursorY);
  cursorY += LINE_HEIGHT * 1.3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`${displayName}`, MARGIN_X, cursorY);
  cursorY += LINE_HEIGHT;
  doc.text(`Exported ${new Date().toLocaleString()}`, MARGIN_X, cursorY);
  cursorY += LINE_HEIGHT * 1.5;
  doc.setTextColor(0);

  doc.setFontSize(11);
  // Render markdown as plain text — jspdf doesn't do markdown natively.
  // Users who want rendered markdown can copy to clipboard.
  const wrapped: string[] = doc.splitTextToSize(content, usableW);
  for (const line of wrapped) {
    if (cursorY > pageH - MARGIN_BOTTOM) {
      doc.addPage();
      cursorY = MARGIN_TOP;
    }
    doc.text(line, MARGIN_X, cursorY);
    cursorY += LINE_HEIGHT;
  }

  doc.save(`${sanitizeFilename(displayName)}-${sanitizeFilename(presetLabel)}.pdf`);
}
