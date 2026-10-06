import catalog from './preloadedRepertoire.json';
import { dataSchema } from './schemas.js';
import type { AppData } from './types.js';

/** Public Excel catalog; user-specific files always take priority. */
export function initialCatalog(): AppData {
  return dataSchema.parse(catalog) as AppData;
}

/** A backup may replace an untouched starter catalog, never an edited repertoire. */
export function isInitialCatalog(data: AppData): boolean {
  return JSON.stringify(data) === JSON.stringify(initialCatalog());
}
