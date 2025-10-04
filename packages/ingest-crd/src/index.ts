import pdfParse from "pdf-parse";
import { RawDisclosure, rawDisclosureSchema } from "@blackroad/disclosures/src/types";

const SECTION_KEYWORDS: Record<string, string> = {
  Criminal: "Criminal",
  Regulatory: "Regulatory",
  Civil: "Civil",
  Customer: "Customer",
  Financial: "Financial",
  Termination: "Termination",
  "Judgment/Lien": "Judgment",
};

async function extractPdfText(buffer: Buffer, hint: string): Promise<string> {
  try {
    const result = await pdfParse(buffer);
    if (result.text && result.text.trim().length > 0) {
      return result.text;
    }
  } catch (err) {
    console.warn(`[ingest] Failed to parse PDF via pdf-parse for ${hint}: ${err}`);
  }

  const text = buffer.toString("utf8");
  if (text.trim().length > 0) {
    return text;
  }

  // OCR stub
  throw new Error(
    `Unable to extract text for ${hint}. TODO: Integrate OCR engine (e.g., Tesseract).`
  );
}

function buildRawDisclosure(part: string, source: "BrokerCheck" | "IAPD", discoveredAt: string): RawDisclosure | null {
  const lines = part
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const heading = lines[0];
  let section = "Other";
  for (const key of Object.keys(SECTION_KEYWORDS)) {
    if (heading.toLowerCase().includes(key.toLowerCase())) {
      section = SECTION_KEYWORDS[key];
      break;
    }
  }

  const fields: Record<string, string> = {};
  const anchorMatch = heading.match(/page\s*(\d+)/i);
  let anchor: string | undefined = anchorMatch ? `page-${anchorMatch[1]}` : undefined;

  lines.slice(1).forEach((line) => {
    const [label, ...rest] = line.split(/:\s*/);
    if (rest.length > 0) {
      fields[label.trim()] = rest.join(": ").trim();
    }
    if (!anchor && /page\s*\d+/i.test(line)) {
      const pageMatch = line.match(/page\s*(\d+)/i);
      if (pageMatch) {
        anchor = `page-${pageMatch[1]}`;
      }
    }
  });

  if (anchor) {
    fields.__anchor = anchor;
  }

  const raw: RawDisclosure = {
    source,
    section,
    discoveredAt,
    rawText: part.trim(),
    fields,
  };

  return rawDisclosureSchema.parse(raw);
}

function parseTextBlock(
  text: string,
  source: "BrokerCheck" | "IAPD",
  discoveredAt: string
): RawDisclosure[] {
  const blocks: RawDisclosure[] = [];
  const parts = text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  parts.forEach((part) => {
    if (/no disclosures reported/i.test(part)) {
      return;
    }
    const match = part.match(/(Customer|Criminal|Regulatory|Civil|Financial|Termination|Judgment)/i);
    if (!match && part.length < 40) {
      return;
    }
    const disclosure = buildRawDisclosure(part, source, discoveredAt);
    if (disclosure) {
      blocks.push(disclosure);
    }
  });
  return blocks;
}

export async function parseBrokerCheckPDF(buffer: Buffer): Promise<RawDisclosure[]> {
  const text = await extractPdfText(buffer, "BrokerCheck");
  return parseTextBlock(text, "BrokerCheck", new Date().toISOString());
}

export async function parseIAPDPDF(buffer: Buffer): Promise<RawDisclosure[]> {
  const text = await extractPdfText(buffer, "IAPD");
  return parseTextBlock(text, "IAPD", new Date().toISOString());
}

export async function parseTextExport(
  text: string,
  source: "BrokerCheck" | "IAPD",
  discoveredAt: string
): Promise<RawDisclosure[]> {
  return parseTextBlock(text, source, discoveredAt);
}

export function needsHumanReviewFromParse(rawDisclosures: RawDisclosure[]): boolean {
  if (rawDisclosures.length === 0) return true;
  const ambiguous = rawDisclosures.some((raw) => !raw.section || raw.section === "Other");
  return ambiguous;
}
