// =========================================================================
// Clause Type Frequency Bar Chart (Recharts)
// =========================================================================
// This component displays a bar chart of clause frequency across all ingested 
// documents. It helps users see which clauses are most commonly examined 
// (e.g. Indemnity, Payment Terms, Termination, etc.).


import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ClauseFrequencyChart = ({ contracts }) => {
  // Initialize type frequencies
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
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No clause frequency data available. Upload contracts to view charts.
      </div>
    );
  }

  // Curated color gradients or colors for bars
  const COLORS = ['#38bdf8', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              borderColor: '#334155', 
              borderRadius: '8px',
              color: '#f8fafc'
            }}
            cursor={{ fill: 'rgba(51, 65, 85, 0.3)' }}
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
