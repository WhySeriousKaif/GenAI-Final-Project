// =========================================================================
// Risk Badge & Market Status Renderer Component
// =========================================================================
// Color associations:
// - Green/Safe: Favourable terms (0-30 risk score)
// - Yellow/Caution: Unusual/Medium terms (31-70 risk score)
// - Red/Warning: Unfavourable/High terms (71-100 risk score)



/**
 * Renders a pill badge showing the numeric score and a descriptor (Low/Medium/High).
 * @param {number} score - Risk score from 0 to 100
 */
export const RiskScoreBadge = ({ score }) => {
  const numScore = Number(score);
  let label = 'Low';
  let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40';

  if (numScore > 70) {
    label = 'High Risk';
    colorClass = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40';
  } else if (numScore > 30) {
    label = 'Medium Risk';
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40';
  }

  return (
    <span className={badgeClass}>
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
      {score}% - {label}
    </span>
  );
};

/**
 * Renders a pill badge describing the market standard alignment.
 * @param {string} status - Favourable, Unfavourable, or Unusual
 */
export const MarketStatusBadge = ({ status }) => {
  let badgeClass = 'badge-market-neutral';

  switch (status) {
    case 'Favourable':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40';
      break;
    case 'Unfavourable':
      colorClass = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40';
      break;
    case 'Unusual':
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40';
      break;
  }

  return (
    <span className={badgeClass}>
      {status}
    </span>
  );
};
