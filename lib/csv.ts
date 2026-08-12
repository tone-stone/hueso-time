/** Minimal CSV parser (quoted fields, commas, newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = '';
  };
  const pushRow = () => {
    // skip fully empty trailing rows
    if (row.some((c) => c.trim().length > 0)) rows.push(row);
    row = [];
  };

  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      pushCell();
    } else if (ch === '\n') {
      pushCell();
      pushRow();
    } else if (ch === '\r') {
      // ignore; handle \r\n via \n
    } else {
      cell += ch;
    }
  }
  pushCell();
  pushRow();
  return rows;
}
