import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import type { ProductSpec } from "./schemas.ts";

const W = 612; // US Letter, points
const H = 792;
const M = 48;

function hex(color: string, fallback: RGB): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** The built-in PDF fonts only cover Latin-1, so map smart punctuation and drop the rest (emoji etc.). */
export function sanitize(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "*")
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of sanitize(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

function drawLines(page: PDFPage, lines: string[], x: number, y: number, font: PDFFont, size: number, color: RGB, center?: number): number {
  for (const l of lines) {
    const dx = center ? (center - font.widthOfTextAtSize(l, size)) / 2 : 0;
    page.drawText(l, { x: x + dx, y, size, font, color });
    y -= size * 1.3;
  }
  return y;
}

export async function renderPdf(spec: ProductSpec, shopName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(sanitize(spec.title));
  doc.setAuthor(sanitize(shopName));
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.12, 0.12, 0.14);
  const primary = hex(spec.palette.primary, rgb(1, 0.31, 0.55));
  const accent = hex(spec.palette.accent, rgb(0.08, 0.72, 0.65));
  const bg = hex(spec.palette.background, rgb(1, 0.97, 0.94));
  const white = rgb(1, 1, 1);

  for (const p of spec.pages) {
    const page = doc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: bg });
    page.drawRectangle({ x: 0, y: 0, width: W, height: 10, color: accent });
    page.drawText(sanitize(shopName), { x: M, y: 22, size: 8, font: reg, color: ink });

    if (p.layout === "poster") {
      page.drawRectangle({ x: M / 2, y: H / 2 - 150, width: W - M, height: 300, color: primary });
      let y = H / 2 + 90;
      y = drawLines(page, wrap(p.heading, bold, 40, W - 2 * M - 20), M, y, bold, 40, white, W - 2 * M);
      y = drawLines(page, wrap(p.subheading, reg, 16, W - 2 * M - 20), M, y - 10, reg, 16, white, W - 2 * M);
      drawLines(page, wrap(p.items.join("\n"), reg, 13, W - 2 * M), M, H / 2 - 190, reg, 13, ink, W - 2 * M);
      continue;
    }

    page.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: primary });
    drawLines(page, wrap(p.heading, bold, 26, W - 2 * M).slice(0, 2), M, H - 55, bold, 26, white);
    drawLines(page, wrap(p.subheading, reg, 12, W - 2 * M).slice(0, 1), M, H - 98, reg, 12, white);
    const top = H - 140;

    if (p.layout === "list") {
      let y = top;
      p.items.forEach((item, i) => {
        if (y < 60) return;
        page.drawText(`${i + 1}.`, { x: M, y, size: 13, font: bold, color: primary });
        y = drawLines(page, wrap(item, reg, 13, W - 2 * M - 30), M + 30, y, reg, 13, ink) - 8;
      });
    } else {
      const cols = p.layout === "grid" ? 3 : 2;
      const rows = p.layout === "grid" ? 3 : 4;
      const cw = (W - 2 * M) / cols;
      const ch = (top - 50) / rows;
      p.items.slice(0, cols * rows).forEach((item, i) => {
        const x = M + (i % cols) * cw;
        const yTop = top - Math.floor(i / cols) * ch;
        page.drawRectangle({ x: x + 4, y: yTop - ch + 4, width: cw - 8, height: ch - 8, borderColor: accent, borderWidth: 1.5, borderDashArray: [4, 3], color: white });
        const size = p.layout === "grid" ? 12 : 14;
        const lines = wrap(item, bold, size, cw - 28).slice(0, 7);
        const startY = yTop - ch / 2 + (lines.length * size * 1.3) / 2 - size;
        drawLines(page, lines, x + 14, startY, bold, size, ink, cw - 28);
      });
    }
  }
  return doc.save();
}
