import Papa from 'papaparse';

export interface ParsedCSVData {
  headers: string[];
  rows: Array<Record<string, string>>;
  errors: Papa.ParseError[];
}

/**
 * Parse CSV file and extract headers and rows
 * @param file - CSV file to parse
 * @returns Promise with parsed data including headers, rows, and errors
 */
export const parseCSVFile = (file: File): Promise<ParsedCSVData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim(),
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error('Failed to parse CSV file. Please check the file format.'));
          return;
        }

        const headers = results.meta.fields || [];
        const rows = results.data as Array<Record<string, string>>;

        // Filter out empty rows
        const validRows = rows.filter(row => 
          Object.values(row).some(value => value && value.trim() !== '')
        );

        resolve({
          headers,
          rows: validRows,
          errors: results.errors
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
};

/**
 * Convert CSV rows to recipients array format
 * Each row becomes a recipient object with all columns as properties
 */
export const convertRowsToRecipients = (rows: Array<Record<string, string>>): Array<Record<string, any>> => {
  return rows.map(row => {
    const recipient: Record<string, any> = {};
    Object.keys(row).forEach(key => {
      const value = row[key];
      if (value && value.trim() !== '') {
        recipient[key] = value.trim();
      }
    });
    return recipient;
  });
};

