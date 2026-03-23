import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { ChartDataSet } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BarChart({ dataset }: { dataset: ChartDataSet }) {
  return (
    <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-5">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
        <div className="text-base font-semibold text-white">{dataset.label}</div>
        <div className="flex gap-2">
          <button className="bg-transparent border border-[#2d2d44] text-[#a0a0b0] px-2.5 py-1 rounded-md text-xs cursor-pointer hover:text-white transition">View Details</button>
        </div>
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
              barThickness: 40,
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
              x: { ticks: { color: '#a0a0b0' }, grid: { display: false } },
              y: { ticks: { color: '#a0a0b0' }, grid: { color: '#2d2d44' }, beginAtZero: true },
            },
          }}
        />
      </div>
    </div>
  );
}
