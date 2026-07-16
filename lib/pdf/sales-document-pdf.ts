import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatMoney } from "@/lib/money";
import { siteConfig } from "@/lib/site-config";

export type PdfDocumentKind = "INVOICE" | "RECEIPT" | "QUOTATION";

export type PdfDocumentItem = {
  productName: string;
  optionLabel?: string | null;
  sellingUnit?: string | null;
  quantity: number;
  unitCents: number;
  totalCents: number;
};

export type PdfDocumentInput = {
  kind: PdfDocumentKind;
  number?: string | null;
  date: Date | string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  paymentLabel?: string;
  statusLabel?: string;
  items: PdfDocumentItem[];
  subtotalCents: number;
  totalCents: number;
  note?: string | null;
};

type PdfObject = string | Buffer;

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 38;
const logoPath = join(process.cwd(), "public", "logo.jpg");

export function salesDocumentFilename(input: Pick<PdfDocumentInput, "kind" | "number"> & { customerName?: string | null }) {
  const number = (input.number || "draft").replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "");
  const customer = (input.customerName || "customer").replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "");
  return `Sunspark_${titleCase(input.kind)}_${customer}_${number}.pdf`;
}

export function createSalesDocumentPdf(input: PdfDocumentInput) {
  const logo = readFileSync(logoPath);
  const { width: logoWidth, height: logoHeight } = jpegSize(logo);
  const objects: PdfObject[] = [];
  const logoObject = addObject(objects, logoImageObject(logo, logoWidth, logoHeight));
  const fontRegular = addObject(objects, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = addObject(objects, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const contentObject = addObject(objects, buildPageContent(input, logoObject, logoWidth, logoHeight));
  const pageObject = addObject(
    objects,
    `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> /XObject << /Logo ${logoObject} 0 R >> >> /Contents ${contentObject} 0 R >>`
  );
  const pagesObject = addObject(objects, `<< /Type /Pages /Kids [${pageObject} 0 R] /Count 1 >>`);
  objects[pageObject - 1] = String(objects[pageObject - 1]).replace("/Parent 0 0 R", `/Parent ${pagesObject} 0 R`);
  const catalogObject = addObject(objects, `<< /Type /Catalog /Pages ${pagesObject} 0 R >>`);

  return writePdf(objects, catalogObject);
}

function buildPageContent(input: PdfDocumentInput, _logoObject: number, logoWidth: number, logoHeight: number) {
  const date = new Date(input.date).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
  const visibleEmail = printableEmail(input.customerEmail);
  const lines: string[] = ["q", "1 1 1 rg 0 0 595.28 841.89 re f", "Q"];
  const text = (x: number, y: number, value: string, size = 10, bold = false, color = rgb(24, 32, 45)) => {
    lines.push("BT", `/${bold ? "F2" : "F1"} ${size} Tf`, `${color} rg`, `${x.toFixed(2)} ${y.toFixed(2)} Td`, `(${escapePdf(value)}) Tj`, "ET");
  };
  const fitText = (x: number, y: number, value: string, maxWidth: number, size = 10, bold = false, color = rgb(24, 32, 45)) => {
    text(x, y, truncateByWidth(value, maxWidth, size), size, bold, color);
  };
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    lines.push("q", `${color} rg`, `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`, "Q");
  };

  const logoW = 92;
  const logoH = logoW * (logoHeight / logoWidth);
  lines.push("q", `${logoW.toFixed(2)} 0 0 ${logoH.toFixed(2)} ${margin} ${(pageHeight - margin - logoH).toFixed(2)} cm`, "/Logo Do", "Q");

  let y = pageHeight - margin - 12;
  fitText(146, y, siteConfig.name, 250, 15, true, rgb(14, 82, 164));
  y -= 15;
  wrapText(siteConfig.location, 55, 2).forEach((line) => {
    fitText(146, y, line, 255, 8.2, false, rgb(82, 91, 107));
    y -= 10;
  });
  fitText(146, y, `${siteConfig.phone} | ${siteConfig.email} | ${siteConfig.url.replace(/^https?:\/\//, "")}`, 255, 8.2, false, rgb(82, 91, 107));

  rect(426, pageHeight - 110, 130, 72, rgb(239, 246, 255));
  rect(426, pageHeight - 110, 5, 72, rgb(14, 82, 164));
  text(444, pageHeight - 60, titleCase(input.kind), 18, true, rgb(14, 82, 164));
  fitText(444, pageHeight - 78, input.number || "Pending", 96, 9.5, true);
  text(444, pageHeight - 94, date, 8.8, false, rgb(82, 91, 107));
  rect(margin, pageHeight - 126, pageWidth - margin * 2, 2.5, rgb(243, 111, 33));

  const summaryTop = pageHeight - 154;
  rect(margin, summaryTop - 49, 250, 52, rgb(248, 250, 252));
  rect(308, summaryTop - 49, 249, 52, rgb(248, 250, 252));
  text(margin + 10, summaryTop - 12, "Bill to", 8, true, rgb(82, 91, 107));
  fitText(margin + 10, summaryTop - 27, input.customerName, 220, 11, true);
  if (input.customerPhone) fitText(margin + 10, summaryTop - 40, input.customerPhone, 96, 9);
  if (visibleEmail) fitText(155, summaryTop - 40, visibleEmail, 122, 9);
  text(318, summaryTop - 12, "Document details", 8, true, rgb(82, 91, 107));
  const detailLines = [
    input.paymentLabel ? `Payment: ${input.paymentLabel}` : null,
    input.statusLabel ? `Status: ${input.statusLabel}` : null
  ].filter(Boolean) as string[];
  detailLines.slice(0, 2).forEach((line, index) => fitText(318, summaryTop - 29 - index * 14, line, 216, 9.5));

  let tableY = summaryTop - 76;
  rect(margin, tableY - 19, pageWidth - margin * 2, 22, rgb(14, 82, 164));
  text(margin + 10, tableY - 12, "No.", 8.5, true, rgb(255, 255, 255));
  text(margin + 48, tableY - 12, "Item description", 8.5, true, rgb(255, 255, 255));
  text(340, tableY - 12, "Qty", 8.5, true, rgb(255, 255, 255));
  text(390, tableY - 12, "Unit price", 8.5, true, rgb(255, 255, 255));
  text(492, tableY - 12, "Amount", 8.5, true, rgb(255, 255, 255));
  tableY -= 31;

  input.items.slice(0, 18).forEach((item, index) => {
    if (index % 2 === 0) rect(margin, tableY - 16, pageWidth - margin * 2, 24, rgb(250, 252, 255));
    text(margin + 10, tableY, String(index + 1), 9);
    fitText(margin + 48, tableY, item.productName, 238, 9.5, true);
    if (item.optionLabel) fitText(margin + 48, tableY - 10, item.optionLabel, 205, 7.5, false, rgb(82, 91, 107));
    text(340, tableY, String(item.quantity), 9);
    text(390, tableY, formatMoney(item.unitCents), 9);
    text(492, tableY, formatMoney(item.totalCents), 9, true);
    tableY -= 25;
  });

  const totalsTop = Math.max(152, tableY - 20);
  const totalsY = totalsTop - 58;
  rect(372, totalsY, 184, 58, rgb(248, 250, 252));
  text(386, totalsY + 37, "Subtotal", 9);
  fitText(474, totalsY + 37, formatMoney(input.subtotalCents), 74, 9, true);
  text(386, totalsY + 16, "Total", 13, true, rgb(14, 82, 164));
  fitText(462, totalsY + 16, formatMoney(input.totalCents), 86, 13, true, rgb(14, 82, 164));

  text(margin, totalsTop - 14, "Notes", 9, true);
  wrapText(input.note ?? "Thank you for choosing Sunspark Electrical and Solar.", 72, 2).forEach((line, index) => {
    fitText(margin, totalsTop - 29 - index * 11, line, 300, 8.5, false, rgb(82, 91, 107));
  });
  text(margin, 34, "This document is computer generated by Sunspark Electrical and Solar.", 7.5, false, rgb(100, 116, 139));

  const content = lines.join("\n");
  return `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`;
}

function addObject(objects: PdfObject[], object: PdfObject) {
  objects.push(object);
  return objects.length;
}

function writePdf(objects: PdfObject[], catalogObject: number) {
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n")];
  const offsets: number[] = [0];
  let offset = chunks[0].length;
  objects.forEach((object, index) => {
    offsets.push(offset);
    const body = Buffer.isBuffer(object) ? object : Buffer.from(object);
    const chunk = Buffer.concat([Buffer.from(`${index + 1} 0 obj\n`), body, Buffer.from("\nendobj\n")]);
    chunks.push(chunk);
    offset += chunk.length;
  });
  const xrefOffset = offset;
  const xref = [`xref`, `0 ${objects.length + 1}`, "0000000000 65535 f "]
    .concat(offsets.slice(1).map((item) => `${String(item).padStart(10, "0")} 00000 n `))
    .join("\n");
  chunks.push(Buffer.from(`\n${xref}\ntrailer\n<< /Size ${objects.length + 1} /Root ${catalogObject} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`));
  return Buffer.concat(chunks);
}

function logoImageObject(image: Buffer, width: number, height: number) {
  return Buffer.concat([
    Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),
    image,
    Buffer.from("\nendstream")
  ]);
}

function jpegSize(buffer: Buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return { width: 600, height: 300 };
}

function escapePdf(value: string) {
  return value.replace(/[\\()]/g, "\\$&").replace(/\r?\n/g, " ");
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1)}...` : value;
}

function printableEmail(email?: string | null) {
  if (!email) return null;
  return /^(walkin|invoice)-.+@sunsparkelectricals\.co\.ke$/i.test(email) ? null : email;
}

function truncateByWidth(value: string, width: number, fontSize: number) {
  const maxChars = Math.max(6, Math.floor(width / (fontSize * 0.52)));
  return truncate(value, maxChars);
}

function wrapText(value: string, length: number, maxLines: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > length && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.length ? lines : [value];
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function rgb(red: number, green: number, blue: number) {
  return [red, green, blue].map((value) => (value / 255).toFixed(4)).join(" ");
}
