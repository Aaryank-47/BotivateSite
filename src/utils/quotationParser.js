// Reads an uploaded quotation (PDF) in the browser and extracts the order details:
// party, quotation no., date, total value, payment type, type of work and the
// systems table (Department Name / System Name / Description of System).
// Pure heuristics on the PDF text layer — review the pre-filled values before saving.

const Y_TOLERANCE = 3;

async function readPdfLines(file) {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const lines = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    const items = content.items
      .filter((it) => it.str && it.str.trim())
      .map((it) => ({ str: it.str.trim(), x: it.transform[4], y: it.transform[5], w: it.width || 0 }))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    let current = null;
    for (const it of items) {
      if (current && Math.abs(current.y - it.y) <= Y_TOLERANCE) current.items.push(it);
      else {
        current = { y: it.y, items: [it] };
        lines.push(current);
      }
    }
  }
  return lines.map((l) => {
    l.items.sort((a, b) => a.x - b.x);
    return { items: l.items, text: l.items.map((i) => i.str).join("  ") };
  });
}

const toIsoDate = (raw) => {
  const m = String(raw).match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (!m) return "";
  const [, d, mo, y] = m;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

const lastNumber = (text) => {
  const nums = text.match(/\d[\d,]*(?:\.\d+)?/g);
  return nums ? nums[nums.length - 1].replace(/,/g, "") : "";
};

const tidy = (s) => {
  const t = s.replace(/\s+/g, " ").trim();
  // ALL CAPS department names -> Title Case
  return t === t.toUpperCase() && /[A-Z]/.test(t)
    ? t.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : t;
};

// Join neighbouring text runs of a line into one cell segment (a bigger gap = a new cell).
const GAP = 8;
function toSegments(items) {
  const segs = [];
  for (const it of items) {
    const last = segs[segs.length - 1];
    if (last && it.x - last.end <= GAP) {
      last.str += " " + it.str;
      last.end = it.x + it.w;
    } else segs.push({ str: it.str, start: it.x, end: it.x + it.w });
  }
  return segs.map((s) => ({ ...s, center: (s.start + s.end) / 2 }));
}

function parseSystems(lines) {
  const headerIdx = lines.findIndex(
    (l) => /department/i.test(l.text) && /system\s*name/i.test(l.text) && /description/i.test(l.text)
  );
  if (headerIdx === -1) return [];

  // Column centres come from the header cells, so left / centred / right aligned tables
  // (with or without a Serial No column) all work.
  const headSegs = toSegments(lines[headerIdx].items);
  const find = (re) => headSegs.find((s) => re.test(s.str));
  const hDept = find(/department/i);
  const hName = find(/system\s*name/i);
  const hDesc = find(/description/i);
  if (!hDept || !hName || !hDesc) return [];
  const hSerial = find(/serial|s\.?\s*no|sr\.?\s*no/i);
  const cols = [
    ...(hSerial ? [{ key: "serial", c: hSerial.center }] : []),
    { key: "dept", c: hDept.center },
    { key: "name", c: hName.center },
    { key: "desc", c: hDesc.center },
  ];

  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const t = lines[i].text;
    // Stop at the first totals / charges line.
    if (/total/i.test(t) || /^(development|implementation|gst|payment|charges|terms)/i.test(t)) break;

    const cell = { serial: [], dept: [], name: [], desc: [] };
    for (const seg of toSegments(lines[i].items)) {
      const col = cols.reduce((best, c) => (Math.abs(c.c - seg.center) < Math.abs(best.c - seg.center) ? c : best));
      cell[col.key].push(seg.str);
    }
    const dept = cell.dept.join(" ");
    const name = cell.name.join(" ");
    const desc = cell.desc.join(" ");
    if (!dept && !name && desc && rows.length) {
      rows[rows.length - 1].description = `${rows[rows.length - 1].description} ${desc}`.trim();
    } else if (dept || name) {
      rows.push({ department: tidy(dept), name: tidy(name), description: desc.trim() });
    }
  }
  return rows.filter((r) => r.name);
}

/**
 * @returns {Promise<{ fields: object, systems: Array, filled: string[] }>}
 * @throws Error with a user-facing message when the file type is not supported.
 */
export async function readQuotation(file) {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) throw new Error("Auto-fill works with PDF quotations. Please fill the form manually for this file type.");

  const lines = await readPdfLines(file);
  if (!lines.length) throw new Error("No readable text found in this PDF (scanned image?). Please fill the form manually.");

  const all = lines.map((l) => l.text).join("\n");
  const fields = {};

  // Quotation number: labelled ("Quotation No: X") or an unlabelled code like BS/25-26/0034.
  const qNo =
    all.match(/(?:Quotation|Offer|Ref(?:erence)?)\s*(?:No|Number|#)\.?\s*[:-]?\s*([A-Za-z0-9][\w/.-]*\d)/i) ||
    all.match(/\b([A-Z]{1,6}\/\d{2,4}-\d{2,4}\/\d+)\b/);
  if (qNo) fields.quotation_number = qNo[1];

  // Date: labelled, otherwise the first date on the page (offer letters put it in the header).
  const date =
    all.match(/\bDate\b\s*[:-]?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i) ||
    all.match(/\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\b/);
  if (date) fields.start_date = toIsoDate(date[1]);

  // Party: the block under "To" - prefer the company line over the contact person's name.
  const toIdx = lines.findIndex((l) => /^(to|to,|to:|bill to|billed to|quotation for|client)$/i.test(l.text.trim()));
  if (toIdx !== -1 && lines[toIdx + 1]) {
    const block = lines
      .slice(toIdx + 1, toIdx + 6)
      .map((l) => l.text.replace(/\s{2,}/g, " ").trim());
    const company = block.find((t) => /\b(pvt|private|ltd|limited|llp|llc|inc|traders|industries|enterprises|mills|corporation|co\.)\b/i.test(t));
    fields.party_name = company || block[0];
  } else {
    const m = all.match(/(?:M\/s\.?|Client|Party|Customer)\s*[:-]\s*(.+)/i);
    if (m) fields.party_name = m[1].trim();
  }

  // Order value: the basic amount ("... 550000 (basic)") beats any tax-inclusive total.
  const basicLine = lines.find((l) => /\(\s*basic\s*\)/i.test(l.text) || /developing and implementing/i.test(l.text));
  const totalLine =
    basicLine ||
    lines.find((l) => /total\s*(quotation|order|project)?\s*(value|amount|cost)/i.test(l.text)) ||
    lines.find((l) => /grand\s*total/i.test(l.text)) ||
    [...lines].reverse().find((l) => /\btotal\b/i.test(l.text) && /\d/.test(l.text));
  if (totalLine) {
    const n = totalLine === basicLine
      ? (totalLine.text.replace(/\(\s*basic\s*\)/i, "").match(/\d[\d,]*(?:\.\d+)?/g) || []).pop()?.replace(/,/g, "")
      : lastNumber(totalLine.text);
    if (n) fields.value_of_order = n;
  }

  const lower = all.toLowerCase();
  if (/advance/.test(lower)) fields.payment_type = "Partly";
  else if (/monthly/.test(lower)) fields.payment_type = "Monthly";
  else if (/yearly|annual/.test(lower)) fields.payment_type = "Yearly";

  if (/\b(amc|annual maintenance|support contract|retainer)\b/.test(lower) && !/develop|implement/.test(lower))
    fields.type_of_work = "Service";
  else if (/develop|implement|project/.test(lower)) fields.type_of_work = "Project";

  // Projects default to a one-year term from the start date.
  if (fields.type_of_work === "Project" && fields.start_date) {
    const end = new Date(`${fields.start_date}T00:00:00Z`);
    end.setUTCFullYear(end.getUTCFullYear() + 1);
    fields.end_date = end.toISOString().slice(0, 10);
  }

  const systems = parseSystems(lines);
  const filled = Object.keys(fields);
  if (systems.length) filled.push("systems");
  return { fields, systems, filled };
}
