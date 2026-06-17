// =========================================================================
// Clause Type Frequency Bar Chart (Recharts)
// =========================================================================
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ClauseFrequencyChart = ({ contracts }) => {
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

  // Warm editorial bar colors
  const COLORS = ['#cc785c', '#d4a017', '#5db872', '#8b7355', '#a9583e', '#6c6a64', '#3d3d3a'];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6c6a64', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#6c6a64', fontSize: 9 }} 
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#faf9f5', 
              borderColor: '#e6dfd8', 
              borderRadius: '8px',
              color: '#141413',
              fontSize: '11px'
            }}
            cursor={{ fill: 'rgba(204, 120, 92, 0.06)' }}
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
