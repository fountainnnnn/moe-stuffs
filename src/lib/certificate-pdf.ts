type CertificatePdfData = {
  name: string;
  classCode: string;
  title: string;
  tier: string;
  aura: number;
  questsDone: number;
  requiredQuests: number;
  awardedDate: string;
  certificateId: string;
  example?: boolean;
};

const PAGE_WIDTH = 960;

function pdfText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/([\\()])/g, "\\$1");
}

function textWidth(value: string, size: number, bold = false): number {
  return pdfText(value).length * size * (bold ? 0.56 : 0.52);
}

function centeredText(
  value: string,
  y: number,
  size: number,
  options: { bold?: boolean; color?: string } = {},
): string {
  const bold = options.bold ?? false;
  const x = Math.max(36, (PAGE_WIDTH - textWidth(value, size, bold)) / 2);
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${options.color ?? "0.07 0.07 0.07"} rg ${x.toFixed(1)} ${y} Td (${pdfText(value)}) Tj ET`;
}

function centeredAt(
  value: string,
  centerX: number,
  y: number,
  size: number,
  options: { bold?: boolean; color?: string } = {},
): string {
  const bold = options.bold ?? false;
  const x = centerX - textWidth(value, size, bold) / 2;
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${options.color ?? "0.07 0.07 0.07"} rg ${x.toFixed(1)} ${y} Td (${pdfText(value)}) Tj ET`;
}

function leftText(
  value: string,
  x: number,
  y: number,
  size: number,
  options: { bold?: boolean; color?: string } = {},
): string {
  return `BT /${options.bold ? "F2" : "F1"} ${size} Tf ${options.color ?? "0.07 0.07 0.07"} rg ${x} ${y} Td (${pdfText(value)}) Tj ET`;
}

function makePdf(objects: string[]): Buffer {
  const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1");
  const parts: Buffer[] = [header];
  const offsets = [0];
  let length = header.length;

  objects.forEach((object, index) => {
    offsets.push(length);
    const part = Buffer.from(`${index + 1} 0 obj\n${object}\nendobj\n`, "latin1");
    parts.push(part);
    length += part.length;
  });

  const xrefOffset = length;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    `startxref\n${xrefOffset}`,
    "%%EOF\n",
  ].join("\n");
  parts.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(parts);
}

export function generateCertificatePdf(data: CertificatePdfData): Buffer {
  const content = [
    "0.984 0.969 0.933 rg 0 0 960 540 re f",
    "0.07 0.07 0.07 RG 4 w 20 20 920 500 re S",
    "0.07 0.07 0.07 RG 1.5 w 31 31 898 478 re S",
    "0.72 0.98 0.24 rg 41 447 878 55 re f",
    centeredText("CERTIFICATE OF AI LITERACY", 474, 13, { bold: true }),
    centeredText("PROJECTAI", 430, 25, { bold: true }),
    centeredText("AWARDED TO", 376, 11, { bold: true, color: "0.38 0.38 0.38" }),
    centeredText(data.name, 337, 34, { bold: true }),
    centeredText(`CLASS ${data.classCode}`, 311, 12, { bold: true, color: "0.34 0.34 0.34" }),
    "0.72 0.98 0.24 rg 320 266 320 30 re f",
    "0.07 0.07 0.07 RG 2 w 320 266 320 30 re S",
    centeredText(`${data.title.toUpperCase()}  |  ${data.tier.toUpperCase()} TIER`, 276, 12, { bold: true }),
    "0.07 0.07 0.07 RG 2 w 268 174 190 66 re S",
    "0.07 0.07 0.07 RG 2 w 502 174 190 66 re S",
    centeredAt("TOTAL AURA", 363, 218, 9, { bold: true, color: "0.38 0.38 0.38" }),
    centeredAt("QUESTS CLEARED", 597, 218, 9, { bold: true, color: "0.38 0.38 0.38" }),
    centeredAt(String(data.aura), 363, 187, 24, { bold: true }),
    centeredAt(`${data.questsDone} / ${data.requiredQuests}`, 597, 187, 24, { bold: true }),
    centeredText("For practical prompting, careful verification and responsible AI judgment.", 137, 11, {
      color: "0.28 0.28 0.28",
    }),
    "0.07 0.07 0.07 RG 1.5 w 48 98 m 912 98 l S",
    leftText(data.awardedDate, 49, 68, 12, { bold: true }),
    leftText("DATE AWARDED", 49, 51, 8, { bold: true, color: "0.42 0.42 0.42" }),
    leftText(`PROJECTAI  |  VERIFIED ${data.questsDone}/${data.requiredQuests}`, 665, 68, 9, {
      bold: true,
      color: "0.34 0.34 0.34",
    }),
    leftText(`ID ${data.certificateId}`, 773, 51, 8, { bold: true, color: "0.42 0.42 0.42" }),
    ...(data.example
      ? [
          "0.47 0.82 0.98 rg 792 472 118 25 re f",
          "0.07 0.07 0.07 RG 1.5 w 792 472 118 25 re S",
          leftText("EXAMPLE", 826, 480, 10, { bold: true }),
        ]
      : []),
  ].join("\n");

  return makePdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 960 540] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ]);
}
