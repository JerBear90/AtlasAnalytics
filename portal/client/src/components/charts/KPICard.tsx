import { KPIData } from '../../types';

const valueColors = ['#198754', '#fd7e14', '#dc3545', '#0d6efd', '#6c5dd3'];

export default function KPICard({ kpi, index = 0 }: { kpi: KPIData; index?: number }) {
  const color = valueColors[index % valueColors.length];
  const trendColor = kpi.trend.direction === 'up' ? '#198754' : kpi.trend.direction === 'down' ? '#dc3545' : '#a0a0b0';
  const arrow = kpi.trend.direction === 'up' ? '▲' : kpi.trend.direction === 'down' ? '▼' : '';
  const barWidth = Math.min(Math.abs(kpi.value) * 15, 100);

  return (
    <div className="bg-[#1e1e2f] p-5 rounded-xl border border-[#2d2d44] relative overflow-hidden">
      <h3 className="text-sm text-[#a0a0b0] font-normal mb-2.5">{kpi.label}</h3>
      <div className="text-[28px] font-bold mb-1" style={{ color }}>
        {kpi.value.toLocaleString()}{kpi.unit === '%' ? '%' : ''}
        {kpi.unit !== '%' && <span className="text-sm text-[#a0a0b0] ml-1">{kpi.unit}</span>}
      </div>
      <div className="text-xs flex items-center gap-1.5" style={{ color: trendColor }}>
        {arrow && <span>{arrow}</span>}
        <span>{Math.abs(kpi.trend.delta).toFixed(2)} vs prev</span>
      </div>
      <div className="h-1 w-full bg-[#2d2d44] mt-4 rounded-sm">
        <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${barWidth}%`, background: color }} />
      </div>
    </div>
  );
}
