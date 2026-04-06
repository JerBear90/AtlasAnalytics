import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { ChartDataSet } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type ViewMode = 'raw' | 'monthly' | 'yearly';

function aggregate(labels: string[], data: number[], mode: ViewMode): { labels: string[]; data: number[] } {
  if (mode === 'raw') return { labels, data };

  const bucketMap = new Map<string, number[]>();
  for (let i = 0; i < labels.length; i++) {
    const val = data[i];
    if (val == null || isNaN(val)) continue;
    const label = labels[i] || '';
    let key = label;

    if (mode === 'monthly') {
      // Try YYYY-MM from various date formats
      if (label.match(/^\d{4}-\d{2}/)) key = label.substring(0, 7);
      else if (label.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
        const p = label.split('/');
        key = `${p[2]}-${p[0].padStart(2, '0')}`;
      } else if (label.match(/\d{4}\s*Q\d/)) key = label; // quarterly labels stay as-is
    } else if (mode === 'yearly') {
      // Extract year from "2020 Q2", "2020-01-01", "1/15/2020", etc.
      const yearMatch = label.match(/(\d{4})/);
      key = yearMatch ? yearMatch[1] : label;
    }

    const existing = bucketMap.get(key) || [];
    existing.push(val);
    bucketMap.set(key, existing);
  }

  const aggLabels: string[] = [];
  const aggData: number[] = [];
  for (const [key, vals] of bucketMap) {
    aggLabels.push(key);
    aggData.push(Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100);
  }
  return { labels: aggLabels, data: aggData };
}

export default function LineChart({ dataset, bare }: { dataset: ChartDataSet; bare?: boolean }) {
  // Detect data granularity
  const hasWeeklyDates = dataset.labels.some(l => l.match(/^\d{1,2}\/\d{1,2}\/\d{4}/));
  const hasQuarterlyLabels = dataset.labels.some(l => l.match(/Q\d/i));
  const isWeeklyGranularity = hasWeeklyDates && !hasQuarterlyLabels;

  const modes: { key: ViewMode; label: string }[] = isWeeklyGranularity
    ? [{ key: 'raw', label: 'Weekly' }, { key: 'monthly', label: 'Monthly' }]
    : hasQuarterlyLabels
    ? [{ key: 'raw', label: 'Quarterly' }, { key: 'yearly', label: 'Yearly' }]
    : [{ key: 'raw', label: 'All' }, { key: 'yearly', label: 'Yearly' }];

  const [view, setView] = useState<ViewMode>('raw');
  const displayData = aggregate(dataset.labels, dataset.data, view);

  const btnClass = (active: boolean) =>
    `px-2.5 py-1 rounded-md text-xs cursor-pointer transition ${active ? 'bg-[#6c5dd3] text-white' : 'bg-transparent border border-[#2d2d44] text-[#a0a0b0] hover:text-white'}`;

  const content = (
    <>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
        {!bare && <div className="text-base font-semibold text-white">{dataset.label}</div>}
        <div className={`flex gap-2 ${bare ? 'ml-auto' : ''}`}>
          {modes.map(m => (
            <button key={m.key} onClick={() => setView(m.key)} className={btnClass(view === m.key)}>{m.label}</button>
          ))}
        </div>
      </div>
      <div className="relative h-[350px]">
        <Line
          data={{
            labels: displayData.labels,
            datasets: [{
              label: dataset.label,
              data: displayData.data,
              borderColor: '#198754',
              borderWidth: 3,
              backgroundColor: 'rgba(25,135,84,0.08)',
              fill: true,
              tension: 0.4,
              pointRadius: displayData.labels.length > 30 ? 0 : 4,
              pointBackgroundColor: '#1e1e2f',
              pointBorderColor: '#198754',
              pointBorderWidth: 2,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8, color: '#a0a0b0' } },
              tooltip: { backgroundColor: '#1e1e2f', titleColor: '#fff', bodyColor: '#a0a0b0', borderColor: '#2d2d44', borderWidth: 1 },
            },
            scales: {
              x: { ticks: { color: '#a0a0b0', maxTicksLimit: 15 }, grid: { display: false } },
              y: { ticks: { color: '#a0a0b0' }, grid: { color: '#2d2d44' } },
            },
            layout: { padding: { right: 10 } },
          }}
        />
      </div>
    </>
  );

  if (bare) return content;
  return <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-5">{content}</div>;
}
