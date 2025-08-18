/**
 * Fetches data from Google Sheets using service account authentication
 * The sheet must be shared with the service account email
 */
export declare function fetchFromGoogleSheets(): Promise<any[]>;
/**
 * Maps sheet row to party data
 */
export declare function mapSheetRowToParty(row: any[], index: number): any;
//# sourceMappingURL=sheets-client.d.ts.map