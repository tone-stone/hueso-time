import { describe, expect, it } from 'vitest';

import { parseCsv } from '../lib/csv';
import { googleSheetCsvUrl, parseGoogleSheetUrl } from '../lib/googleSheetsImport';

describe('csv', () => {
  it('parses simple and quoted csv', () => {
    const rows = parseCsv('Artist,Title\n"Fobia","Vivo, en vivo"\nCafé,Eres\n');
    expect(rows[0]).toEqual(['Artist', 'Title']);
    expect(rows[1]).toEqual(['Fobia', 'Vivo, en vivo']);
    expect(rows[2]).toEqual(['Café', 'Eres']);
  });
});

describe('googleSheetsImport urls', () => {
  it('parses spreadsheet id and gid', () => {
    const parsed = parseGoogleSheetUrl(
      'https://docs.google.com/spreadsheets/d/abc123XYZ/edit#gid=456',
    );
    expect(parsed).toEqual({ id: 'abc123XYZ', gid: '456' });
  });

  it('returns null for invalid urls', () => {
    expect(parseGoogleSheetUrl('https://example.com')).toBeNull();
  });

  it('builds export csv urls', () => {
    expect(googleSheetCsvUrl('abc', '0')).toContain('/export?format=csv');
    expect(googleSheetCsvUrl('abc', '0')).not.toContain('gid=');
    expect(googleSheetCsvUrl('abc', '99')).toContain('gid=99');
  });
});
