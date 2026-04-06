import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/client';

interface UploadResult {
  filename: string;
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  error?: string;
  errors?: { row: number; column: string; message: string; value: string }[];
}

export default function AdminCsvUploadPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replaceMode, setReplaceMode] = useState(false);

  const [historyError, setHistoryError] = useState('');

  const fetchHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const { data } = await api.get('/csv/history');
      setHistory(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setHistoryError(err.response?.data?.error || 'Failed to load history.');
    }
    setHistoryLoading(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleFileChange = () => {
    const files = fileRef.current?.files;
    if (files) setSelectedFiles(Array.from(files));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true); setResults([]); setError('');
    try {
      if (selectedFiles.length === 1) {
        const form = new FormData();
        form.append('file', selectedFiles[0]);
        if (replaceMode) form.append('replace', 'true');
        const { data } = await api.post('/csv/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        setResults([{ filename: selectedFiles[0].name, ...data }]);
      } else {
        const form = new FormData();
        for (const file of selectedFiles) {
          form.append('files', file);
        }
        if (replaceMode) form.append('replace', 'true');
        const { data } = await api.post('/csv/upload-multiple', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        setResults(data.results || []);
      }
      fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
      setSelectedFiles([]);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <DashboardLayout>
      <div>
        <div className="text-[#a0a0b0] text-sm">Admin &gt; CSV Upload</div>
        <h1 className="text-2xl font-semibold text-white mt-1">CSV Data Upload</h1>
      </div>

      <div className="bg-[#1e1e2f] rounded-xl p-6 border border-[#2d2d44] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-[11px] uppercase text-[#a0a0b0] mb-1.5 tracking-[1px] font-semibold">Select CSV files</label>
            <input ref={fileRef} type="file" accept=".csv" multiple onChange={handleFileChange}
              className="block w-full text-sm text-[#a0a0b0] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#6c5dd3] file:text-white hover:file:bg-[#6c5dd3]/90 file:cursor-pointer" />
          </div>
          <button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}
            className="px-5 py-2.5 bg-[#6c5dd3] hover:bg-[#6c5dd3]/90 disabled:opacity-50 text-white text-sm font-medium rounded-md transition whitespace-nowrap cursor-pointer">
            {uploading ? 'Uploading...' : `Upload & Process${selectedFiles.length > 1 ? ` (${selectedFiles.length} files)` : ''}`}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={replaceMode} onChange={e => setReplaceMode(e.target.checked)}
              className="w-4 h-4 rounded border-[#2d2d44] bg-[#181824] text-[#6c5dd3] focus:ring-[#6c5dd3] cursor-pointer" />
            <span className="text-sm text-[#a0a0b0]">Replace existing data</span>
          </label>
          <span className="text-xs text-[#a0a0b0]">
            {replaceMode ? '⚠ Old data for this file type will be deleted before importing' : 'New rows will be appended to existing data'}
          </span>
        </div>

        <div className="bg-[#181824] rounded-lg p-4 text-xs text-[#a0a0b0] space-y-2">
          <p className="text-sm text-white font-medium">How CSV Upload Works</p>
          <p>The system auto-detects the file type based on column headers. Supported formats:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Quarterly Time Series — columns: Date, Year, Quarter, Date2, US GDP (SAAR), Atlas Predicted (SAAR)</li>
            <li>Weekly Time Series — columns: Prediction Year-Quarter, Date, Year, Day of the Week, Month, Core GDP, etc.</li>
            <li>Weekly Financial Targets — contains "Atlas Analytics Price Targets" header</li>
            <li>NX Results — columns: Date, Year, Quarter, Date2, Trade Balance, Trade Balance (% Ch), NX Results</li>
            <li>PI Results — columns: Date, Year, Quarter, Date2, Private Inventories</li>
            <li>Academic GDP (Headline/Core/State) — columns: Date, Year, Quarter, Date 2, BEA Actual, Atlas Predictions (type detected from filename)</li>
          </ul>
          <p className="pt-1">To update data: upload the new CSV with "Replace existing data" checked. This clears the old data for that file type and imports the new file.</p>
          <p>To add data: upload without "Replace" checked. New rows are appended.</p>
          <p>CSVs with unrecognized columns will be rejected. Empty trailing rows from Excel exports are automatically skipped.</p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-1">
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-[#181824] rounded-lg px-3 py-2 text-sm">
                <span className="text-white">{f.name}</span>
                <button onClick={() => removeFile(i)} className="text-[#a0a0b0] hover:text-[#dc3545] text-xs cursor-pointer">✕</button>
              </div>
            ))}
          </div>
        )}

        {error && <div className="bg-[rgba(220,53,69,0.1)] border border-[#dc3545] text-[#dc3545] px-4 py-3 rounded-lg text-sm">{error}</div>}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`rounded-lg p-4 text-sm ${r.success ? 'bg-[rgba(25,135,84,0.1)] border border-[#198754] text-[#198754]' : r.error ? 'bg-[rgba(220,53,69,0.1)] border border-[#dc3545] text-[#dc3545]' : 'bg-[rgba(253,126,20,0.1)] border border-[#fd7e14] text-[#fd7e14]'}`}>
                <p className="font-medium mb-1">{r.filename}</p>
                {r.error ? (
                  <p className="text-xs">{r.error}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>Total: {r.totalRows}</div>
                    <div>Valid: {r.validRows}</div>
                    <div>Invalid: {r.invalidRows}</div>
                  </div>
                )}
                {r.errors && r.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                    {r.errors.slice(0, 10).map((e, j) => (
                      <div key={j} className="text-xs">Row {e.row}, {e.column}: {e.message}</div>
                    ))}
                    {r.errors.length > 10 && <div className="text-xs opacity-70">...and {r.errors.length - 10} more</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] overflow-x-auto">
        <div className="px-5 py-4 border-b border-[#2d2d44]">
          <h2 className="text-base font-semibold text-white">Upload History</h2>
        </div>
        {historyLoading ? (
          <div className="p-6 text-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#6c5dd3] mx-auto"></div></div>
        ) : historyError ? (
          <div className="p-6 text-center text-[#dc3545] text-sm">{historyError}</div>
        ) : history.length === 0 ? (
          <div className="p-6 text-center text-[#a0a0b0] text-sm">No uploads yet.</div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead><tr className="border-b border-[#2d2d44]">
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">File</th>
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">Date</th>
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">Total</th>
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">Valid</th>
              <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">Invalid</th>
            </tr></thead>
            <tbody>
              {history.map((h: any) => {
                const errors = (() => { try { return JSON.parse(h.errorDetails || '[]'); } catch { return []; } })();
                const hasErrors = h.invalidRows > 0;
                const isExpanded = expandedId === h.id;
                return (
                  <React.Fragment key={h.id}>
                    <tr className={`border-b border-[#2d2d44] last:border-0 hover:bg-[rgba(108,93,211,0.05)] ${hasErrors ? 'cursor-pointer' : ''}`}
                      onClick={() => hasErrors && setExpandedId(isExpanded ? null : h.id)}>
                      <td className="px-4 py-3 text-white flex items-center gap-2">
                        {hasErrors && <span className={`text-[10px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>}
                        {h.filename}
                      </td>
                      <td className="px-4 py-3 text-white">{new Date(h.uploadedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-white">{h.totalRows}</td>
                      <td className="px-4 py-3 text-[#198754]">{h.validRows}</td>
                      <td className="px-4 py-3 text-[#dc3545]">{h.invalidRows}</td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 bg-[#181824]">
                          {errors.length > 0 ? (
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              <p className="text-xs text-[#a0a0b0] mb-2">{errors.length} validation error{errors.length !== 1 ? 's' : ''}:</p>
                              {errors.map((e: any, i: number) => (
                                <div key={i} className="text-xs text-[#dc3545]">
                                  Row {e.row}, <span className="text-[#a0a0b0]">{e.column}</span>: {e.message} {e.value && <span className="text-[#a0a0b0]">(value: "{e.value}")</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[#a0a0b0]">{h.invalidRows} row{h.invalidRows !== 1 ? 's' : ''} skipped (empty or malformed rows from CSV export).</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
