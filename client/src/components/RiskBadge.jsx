// =========================================================================
// Risk Badge & Market Status Renderer Component
// =========================================================================
// This reusable helper displays formatted, color-coded badges indicating:
// 1. Risk Severity Levels (Low, Medium, High scores)
// 2. Market Alignment Statuses (Favourable, Unfavourable, Unusual)
// 
// Color associations:
// - Green/Safe: Favourable terms (0-30 risk score)
// - Yellow/Caution: Unusual/Medium terms (31-70 risk score)
// - Red/Warning: Unfavourable/High terms (71-100 risk score)



/**
 * Renders a pill badge showing the numeric score and a descriptor (Low/Medium/High).
 * 
 * @param {number} score - Risk score from 0 to 100
 */
export const RiskScoreBadge = ({ score }) => {
  const numScore = Number(score);
  let label = 'Low';
  let colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  if (numScore > 70) {
    label = 'High Risk';
    colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (numScore > 30) {
    label = 'Medium Risk';
    colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {score}% - {label}
    </span>
  );
};

/**
 * Renders a pill badge describing the market standard alignment.
 * 
 * @param {string} status - Favourable, Unfavourable, or Unusual
 */
export const MarketStatusBadge = ({ status }) => {
  let colorClass = 'bg-slate-700/50 text-slate-300 border-slate-600/50';

  switch (status) {
    case 'Favourable':
      colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      break;
    case 'Unfavourable':
      colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      break;
    case 'Unusual':
      colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
};
