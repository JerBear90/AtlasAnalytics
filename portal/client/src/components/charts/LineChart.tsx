import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { ChartDataSet } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function LineChart({ dataset }: { dataset: ChartDataSet }) {
  return (
    <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-5">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
        <div className="text-base font-semibold text-white">{dataset.label}</div>
        <div className="flex gap-2">
          <button className="bg-transparent border border-[#2d2d44] text-[#a0a0b0] px-2.5 py-1 rounded-md text-xs cursor-pointer hover:text-white transition">Weekly</button>
          <button className="bg-transparent border border-[#2d2d44] text-[#a0a0b0] px-2.5 py-1 rounded-md text-xs cursor-pointer hover:text-white transition">Monthly</button>
        </div>
      </div>
      <div className="relative h-[350px]">
        <Line
          data={{
            labels: dataset.labels,
            datasets: [{
              label: dataset.label,
              data: dataset.data,
              borderColor: '#198754',
              borderWidth: 3,
              backgroundColor: 'rgba(25,135,84,0.08)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
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
              x: { ticks: { color: '#a0a0b0' }, grid: { display: false } },
              y: { ticks: { color: '#a0a0b0' }, grid: { color: '#2d2d44' } },
            },
          }}
        />
      </div>
    </div>
  );
}
