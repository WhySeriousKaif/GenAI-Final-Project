// =========================================================================
// Risk Distribution Donut Chart (Recharts)
// =========================================================================
// This component aggregates clause risks and draws a beautiful, interactive 
// donut pie chart showing the density of risks by category.
// Categories: Financial, Operational, Legal, Reputational.


import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';

const RiskDistributionChart = ({ contracts }) => {
  const { isDark } = useTheme();
  const counts = {
    Financial: 0,
    Operational: 0,
    Legal: 0,
    Reputational: 0
  };

  contracts.forEach(contract => {
    if (contract.extractedClauses) {
      contract.extractedClauses.forEach(clause => {
        if (counts[clause.riskType] !== undefined) {
          counts[clause.riskType]++;
        }
      });
    }
  });

  const data = Object.keys(counts).map(key => ({
    name: key,
    value: counts[key]
  })).filter(item => item.value > 0);

  // Fallback if no data is available
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted text-xs">
        No clause risk data available. Upload a contract to populate graphs.
      </div>
    );
  }

  // Dark/Light aware palette
  const COLORS = isDark ? {
    Financial: '#3b82f6',    // Vibrant Blue (Primary)
    Operational: '#10b981',  // Emerald Green
    Legal: '#ff9a2e',        // Neon Orange
    Reputational: '#9a8df2'  // Soft Purple
  } : {
    Financial: '#2563eb',    // Vibrant Blue
    Operational: '#16a34a',  // High-Contrast Green
    Legal: '#ea580c',        // High-Contrast Orange
    Reputational: '#7c3aed'  // High-Contrast Purple
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || (isDark ? '#80838d' : '#94a3b8')} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#111216' : '#e8eff6',
              borderColor: isDark ? '#1d1f24' : '#dbe1e8',
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#0f172a',
              fontSize: '11px'
            }} 
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span style={{ color: isDark ? '#80838d' : '#64748b', fontSize: '11px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskDistributionChart;
