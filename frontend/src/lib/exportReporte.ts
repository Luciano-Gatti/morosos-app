import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ReporteMetaInfo {
  organismo: string;
  titulo: string;
  subtitulo?: string;
  filtros?: string[];
  kpis?: { label: string; value: string }[];
  generadoEn: Date;
}

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function pageHeader(doc: jsPDF, meta: ReporteMetaInfo) {
  const w = doc.internal.pageSize.getWidth();

  // Banda azul institucional
  doc.setFillColor(28, 53, 92);
  doc.rect(0, 0, w, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(meta.organismo, 14, 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Sistema de Gestión de Morosidad", 14, 15);

  doc.setFontSize(8);
  doc.text(`Generado: ${dateFmt.format(meta.generadoEn)}`, w - 14, 9, { align: "right" });
  doc.text("Reporte interno", w - 14, 15, { align: "right" });

  // Título reporte
  doc.setTextColor(20, 30, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(meta.titulo, 14, 33);

  if (meta.subtitulo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(85, 95, 110);
    doc.text(meta.subtitulo, 14, 39);
  }

  // Filtros aplicados
  let y = meta.subtitulo ? 45 : 41;
  if (meta.filtros && meta.filtros.length) {
    doc.setFontSize(8.5);
    doc.setTextColor(85, 95, 110);
    doc.text("Filtros: " + meta.filtros.join(" · "), 14, y);
    y += 6;
  }
  return y + 2;
}

function pageFooter(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  // total pages helper
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 225, 235);
    doc.line(14, h - 14, w - 14, h - 14);
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 145);
    doc.text("Documento de uso interno — AOSC", 14, h - 8);
    doc.text(`Página ${i} de ${pageCount}`, w - 14, h - 8, { align: "right" });
  }
}

function drawKpis(doc: jsPDF, kpis: { label: string; value: string }[], yStart: number): number {
  const w = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 4;
  const cols = Math.min(kpis.length, 4);
  const cardW = (w - margin * 2 - gap * (cols - 1)) / cols;
  const cardH = 18;

  kpis.slice(0, cols).forEach((kpi, idx) => {
    const x = margin + idx * (cardW + gap);
    doc.setFillColor(245, 247, 251);
    doc.setDrawColor(220, 225, 235);
    doc.roundedRect(x, yStart, cardW, cardH, 1.5, 1.5, "FD");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 120, 135);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label.toUpperCase(), x + 4, yStart + 6);
    doc.setFontSize(13);
    doc.setTextColor(28, 53, 92);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x + 4, yStart + 14);
  });

  return yStart + cardH + 6;
}

async function captureChart(elementId: string): Promise<string | null> {
  const el = document.getElementById(elementId);
  if (!el) return null;
  const svg = el.querySelector("svg");
  if (!svg) return null;
  try {
    // Convert SVG to data URL via canvas
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const image64 = "data:image/svg+xml;base64," + svg64;
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = image64;
    });
    const rect = svg.getBoundingClientRect();
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, rect.width, rect.height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export interface ExportPdfOptions {
  meta: ReporteMetaInfo;
  chartElementIds?: string[];
  table: {
    head: string[];
    body: (string | number)[][];
    columnStyles?: Record<number, Partial<{ halign: "left" | "right" | "center"; cellWidth: number }>>;
  };
  filename: string;
}

export async function exportarReportePdf(opts: ExportPdfOptions) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let y = pageHeader(doc, opts.meta);

  if (opts.meta.kpis && opts.meta.kpis.length) {
    y = drawKpis(doc, opts.meta.kpis, y);
  }

  if (opts.chartElementIds && opts.chartElementIds.length) {
    for (const id of opts.chartElementIds) {
      const img = await captureChart(id);
      if (img) {
        const w = doc.internal.pageSize.getWidth();
        const imgW = w - 28;
        const imgH = 70;
        if (y + imgH > doc.internal.pageSize.getHeight() - 25) {
          doc.addPage();
          y = pageHeader(doc, opts.meta);
        }
        doc.addImage(img, "PNG", 14, y, imgW, imgH);
        y += imgH + 6;
      }
    }
  }

  autoTable(doc, {
    head: [opts.table.head],
    body: opts.table.body,
    startY: y,
    margin: { left: 14, right: 14, bottom: 18 },
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [40, 50, 65] },
    headStyles: {
      fillColor: [28, 53, 92],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: { fillColor: [247, 249, 252] },
    columnStyles: opts.table.columnStyles,
  });

  pageFooter(doc);
  doc.save(opts.filename);
}

export interface ExportXlsxOptions {
  sheets: { name: string; head: string[]; body: (string | number)[][] }[];
  filename: string;
}

export function exportarReporteXlsx(opts: ExportXlsxOptions) {
  const wb = XLSX.utils.book_new();
  opts.sheets.forEach((s) => {
    const aoa = [s.head, ...s.body];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Auto column widths (rough)
    const widths = s.head.map((h, i) => {
      const maxLen = Math.max(
        String(h).length,
        ...s.body.map((row) => String(row[i] ?? "").length),
      );
      return { wch: Math.min(40, Math.max(10, maxLen + 2)) };
    });
    (ws as XLSX.WorkSheet)["!cols"] = widths;
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  });
  XLSX.writeFile(wb, opts.filename);
}