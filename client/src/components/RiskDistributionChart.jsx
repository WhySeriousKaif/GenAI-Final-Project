// =========================================================================
// Risk Distribution Donut Chart (Recharts)
// =========================================================================
import React from 'react';
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
    Financial: '#cc785c',    // coral (primary)
    Operational: '#d4a017',  // warm amber
    Legal: '#5db872',        // sage green
    Reputational: '#8b7355'  // warm brown
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
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || (isDark ? '#80838d' : '#8e8b82')} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#111216' : '#faf9f5', 
              borderColor: isDark ? '#1d1f24' : '#e6dfd8', 
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#141413',
              fontSize: '11px'
            }} 
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span style={{ color: isDark ? '#80838d' : '#6c6a64', fontSize: '11px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskDistributionChart;
