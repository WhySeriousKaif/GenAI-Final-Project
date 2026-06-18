// =========================================================================
// Clause Type Frequency Bar Chart (Recharts)
// =========================================================================
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../context/ThemeContext';

const ClauseFrequencyChart = ({ contracts }) => {
  const { isDark } = useTheme();
  const frequencies = {
    'Indemnity': 0,
    'Limitation of Liability': 0,
    'Governing Law': 0,
    'Termination': 0,
    'IP Ownership': 0,
    'Payment Terms': 0,
    'Confidentiality': 0
  };

  contracts.forEach(contract => {
    if (contract.extractedClauses) {
      contract.extractedClauses.forEach(clause => {
        if (frequencies[clause.clauseType] !== undefined) {
          frequencies[clause.clauseType]++;
        }
      });
    }
  });

  const data = Object.keys(frequencies).map(key => ({
    name: key,
    frequency: frequencies[key]
  })).filter(item => item.frequency > 0);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted text-xs">
        No clause frequency data available. Upload contracts to view charts.
      </div>
    );
  }

  // Dark/Light aware colors
  const COLORS = isDark 
    ? ['#3b82f6', '#ff9a2e', '#ffffff', '#10b981', '#9a8df2', '#ec4899', '#f43f5e']
    : ['#2563eb', '#ea580c', '#16a34a', '#7c3aed', '#db2777', '#4b5563', '#1f2937'];

  const labelColor = isDark ? '#80838d' : '#6c6a64';

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <XAxis 
            dataKey="name" 
            tick={{ fill: labelColor, fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: labelColor, fontSize: 9 }} 
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: isDark ? '#111216' : '#faf9f5', 
              borderColor: isDark ? '#1d1f24' : '#e6dfd8', 
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#141413',
              fontSize: '11px'
            }}
            cursor={{ fill: isDark ? 'rgba(59, 130, 246, 0.04)' : 'rgba(37, 99, 235, 0.06)' }}
          />
          <Bar dataKey="frequency" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClauseFrequencyChart;
