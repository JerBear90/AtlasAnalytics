import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { ChartDataSet } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function aggregateMonthly(labels: string[], data: number[]): { labels: string[]; data: number[] } {
  const monthMap = new Map<string, number[]>();
  for (let i = 0; i < labels.length; i++) {
    // Try to extract YYYY-MM or just use the label as-is for quarterly data
    const label = labels[i];
    let monthKey = label;
    if (label.match(/^\d{4}-\d{2}/)) {
      monthKey = label.substring(0, 7); // YYYY-MM
    } else if (label.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
      const parts = label.split('/');
      monthKey = `${parts[2]}-${parts[0].padStart(2, '0')}`;
    }
    const existing = monthMap.get(monthKey) || [];
    if (data[i] != null && !isNaN(data[i])) existing.push(data[i]);
    monthMap.set(monthKey, existing);
  }
  const aggLabels: string[] = [];
  const aggData: number[] = [];
  for (const [key, vals] of monthMap) {
    aggLabels.push(key);
    aggData.push(vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0);
  }
  return { labels: aggLabels, data: aggData };
}

export default function LineChart({ dataset, bare }: { dataset: ChartDataSet; bare?: boolean }) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  const displayData = view === 'monthly'
    ? aggregateMonthly(dataset.labels, dataset.data)
    : { labels: dataset.labels, data: dataset.data };

  const btnClass = (active: boolean) =>
    `px-2.5 py-1 rounded-md text-xs cursor-pointer transition ${active ? 'bg-[#6c5dd3] text-white' : 'bg-transparent border border-[#2d2d44] text-[#a0a0b0] hover:text-white'}`;

  const content = (
    <>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
        {!bare && <div className="text-base font-semibold text-white">{dataset.label}</div>}
        <div className={`flex gap-2 ${bare ? 'ml-auto' : ''}`}>
          <button onClick={() => setView('weekly')} className={btnClass(view === 'weekly')}>Weekly</button>
          <button onClick={() => setView('monthly')} className={btnClass(view === 'monthly')}>Monthly</button>
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
            clip: false as any,
          }}
        />
      </div>
    </>
  );

  if (bare) return content;
  return <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-5">{content}</div>;
}
