// =========================================================================
// Risk Distribution Donut Chart (Recharts)
// =========================================================================
// This component aggregates clause risks and draws a beautiful, interactive 
// donut pie chart showing the density of risks by category.
// Categories: Financial, Operational, Legal, Reputational.


import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RiskDistributionChart = ({ contracts }) => {
  // Aggregate data from all contracts
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
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No clause risk data available. Upload a contract to populate graphs.
      </div>
    );
  }

  // Curated professional color palette
  const COLORS = {
    Financial: '#fb7185',    // Rose
    Operational: '#fbbf24',  // Amber
    Legal: '#38bdf8',        // Sky
    Reputational: '#a78bfa'  // Purple
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
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              borderColor: '#334155', 
              borderRadius: '8px',
              color: '#f8fafc'
            }} 
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskDistributionChart;
