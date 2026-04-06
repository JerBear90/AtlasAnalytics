import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { ChartDataSet } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BarChart({ dataset, bare }: { dataset: ChartDataSet; bare?: boolean }) {
  const [showDetails, setShowDetails] = useState(false);

  const content = (
    <>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
        {!bare && <div className="text-base font-semibold text-white">{dataset.label}</div>}
        <button onClick={() => setShowDetails(!showDetails)}
          className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition ${bare ? 'ml-auto ' : ''}${showDetails ? 'bg-[#6c5dd3] text-white' : 'bg-transparent border border-[#2d2d44] text-[#a0a0b0] hover:text-white'}`}>
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
      </div>
      <div className="relative h-[350px]">
        <Bar
          data={{
            labels: dataset.labels,
            datasets: [{
              label: dataset.label,
              data: dataset.data,
              backgroundColor: dataset.data.map((_, i) => {
                const colors = ['#fd7e14', '#dc3545', '#0d6efd', '#198754', '#6c5dd3'];
                return colors[i % colors.length] + 'b3';
              }),
              borderRadius: 4,
              barThickness: dataset.labels.length > 15 ? undefined : 40,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: '#1e1e2f', titleColor: '#fff', bodyColor: '#a0a0b0', borderColor: '#2d2d44', borderWidth: 1 },
            },
            scales: {
              x: { ticks: { color: '#a0a0b0', maxTicksLimit: 20 }, grid: { display: false } },
              y: { ticks: { color: '#a0a0b0' }, grid: { color: '#2d2d44' }, beginAtZero: true },
            },
          }}
        />
      </div>
      {showDetails && (
        <div className="mt-4 border-t border-[#2d2d44] pt-4 max-h-[250px] overflow-y-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2d2d44]">
                <th className="px-3 py-2 text-[#a0a0b0] font-medium text-xs uppercase">Label</th>
                <th className="px-3 py-2 text-[#a0a0b0] font-medium text-xs uppercase text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {dataset.labels.map((label, i) => (
                <tr key={i} className="border-b border-[#2d2d44] last:border-0 hover:bg-[rgba(108,93,211,0.05)]">
                  <td className="px-3 py-2 text-white">{label}</td>
                  <td className="px-3 py-2 text-white text-right">
                    {dataset.data[i] != null ? dataset.data[i].toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  if (bare) return content;
  return <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-5">{content}</div>;
}
