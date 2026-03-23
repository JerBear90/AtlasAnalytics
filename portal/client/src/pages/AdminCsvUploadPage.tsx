import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/client';
import { IngestionResult, IngestionRecord } from '../types';

export default function AdminCsvUploadPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<IngestionRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/csv/history');
      setHistory(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    setHistoryLoading(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true); setResult(null); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/csv/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data);
      fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
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
            <label className="block text-[11px] uppercase text-[#a0a0b0] mb-1.5 tracking-[1px] font-semibold">Select CSV file</label>
            <input ref={fileRef} type="file" accept=".csv"
              className="block w-full text-sm text-[#a0a0b0] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#6c5dd3] file:text-white hover:file:bg-[#6c5dd3]/90 file:cursor-pointer" />
          </div>
          <button onClick={handleUpload} disabled={uploading}
            className="px-5 py-2.5 bg-[#6c5dd3] hover:bg-[#6c5dd3]/90 disabled:opacity-50 text-white text-sm font-medium rounded-md transition whitespace-nowrap">
            {uploading ? 'Uploading...' : 'Upload & Process'}
          </button>
        </div>

        {error && <div className="bg-[rgba(220,53,69,0.1)] border border-[#dc3545] text-[#dc3545] px-4 py-3 rounded-lg text-sm">{error}</div>}

        {result && (
          <div className={`rounded-lg p-4 text-sm ${result.success ? 'bg-[rgba(25,135,84,0.1)] border border-[#198754] text-[#198754]' : 'bg-[rgba(253,126,20,0.1)] border border-[#fd7e14] text-[#fd7e14]'}`}>
            <p className="font-medium mb-2">{result.success ? 'All rows valid' : 'Completed with errors'}</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>Total: {result.totalRows}</div>
              <div>Valid: {result.validRows}</div>
              <div>Invalid: {result.invalidRows}</div>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                {result.errors.slice(0, 20).map((e, i) => (
                  <div key={i} className="text-xs">Row {e.row}, {e.column}: {e.message} (value: "{e.value}")</div>
                ))}
                {result.errors.length > 20 && <div className="text-xs text-[#a0a0b0]">...and {result.errors.length - 20} more</div>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] overflow-x-auto">
        <div className="px-5 py-4 border-b border-[#2d2d44]">
          <h2 className="text-base font-semibold text-white">Upload History</h2>
        </div>
        {historyLoading ? (
          <div className="p-6 text-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#6c5dd3] mx-auto"></div></div>
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
              {history.map(h => (
                <tr key={h.id} className="border-b border-[#2d2d44] last:border-0 hover:bg-[rgba(108,93,211,0.05)]">
                  <td className="px-4 py-3 text-white">{h.filename}</td>
                  <td className="px-4 py-3 text-white">{new Date(h.uploadedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-white">{h.totalRows}</td>
                  <td className="px-4 py-3 text-[#198754]">{h.validRows}</td>
                  <td className="px-4 py-3 text-[#dc3545]">{h.invalidRows}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
