import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getUsageColor } from '@/lib/format';

interface UsagePieChartProps {
  percentage: number;
  size?: number;
  className?: string;
}

export function UsagePieChart({
  percentage,
  size = 40,
  className,
}: UsagePieChartProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  const data = [
    { name: 'used', value: clampedPercentage },
    { name: 'available', value: 100 - clampedPercentage },
  ];

  const color = getUsageColor(clampedPercentage);

  return (
    <div className={className} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.5}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell key="used" fill={color} />
            <Cell key="available" fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}