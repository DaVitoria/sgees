import * as XLSX from "xlsx";
import { saveExcel } from "./fileDownload";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  columns?: ExcelColumn[];
}

export const exportToExcel = async (
  data: Record<string, any>[],
  options: ExcelExportOptions
): Promise<{ success: boolean; path?: string; error?: string }> => {
  const { filename, sheetName = "Dados", columns } = options;

  let exportData = data;
  
  // If columns are specified, reorder and rename data
  if (columns && columns.length > 0) {
    exportData = data.map(row => {
      const newRow: Record<string, any> = {};
      columns.forEach(col => {
        newRow[col.header] = row[col.key] ?? "";
      });
      return newRow;
    });
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths if specified
  if (columns && columns.length > 0) {
    ws["!cols"] = columns.map(col => ({ wch: col.width || 15 }));
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate file and trigger download
  return await saveExcel(wb, `${filename}.xlsx`, XLSX);
};

// Helper function to export multiple sheets
export const exportMultiSheetExcel = async (
  sheets: { name: string; data: Record<string, any>[]; columns?: ExcelColumn[] }[],
  filename: string
): Promise<{ success: boolean; path?: string; error?: string }> => {
  const wb = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    let exportData = sheet.data;
    
    if (sheet.columns && sheet.columns.length > 0) {
      exportData = sheet.data.map(row => {
        const newRow: Record<string, any> = {};
        sheet.columns!.forEach(col => {
          newRow[col.header] = row[col.key] ?? "";
        });
        return newRow;
      });
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    if (sheet.columns && sheet.columns.length > 0) {
      ws["!cols"] = sheet.columns.map(col => ({ wch: col.width || 15 }));
    }

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  return await saveExcel(wb, `${filename}.xlsx`, XLSX);
};
