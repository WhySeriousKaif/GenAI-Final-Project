// =========================================================================
// Risk Badge & Market Status Renderer Component
// =========================================================================
// Color associations:
// - Green/Safe: Favourable terms (0-30 risk score)
// - Yellow/Caution: Unusual/Medium terms (31-70 risk score)
// - Red/Warning: Unfavourable/High terms (71-100 risk score)
//
// NOTE: Uses theme-aware CSS classes from index.css (.badge-*) instead of
// hardcoded Tailwind color utilities so badges correctly adapt to dark mode.

import React from 'react';

/**
 * Renders a pill badge showing the numeric score and a descriptor (Low/Medium/High).
 * @param {number} score - Risk score from 0 to 100
 */
export const RiskScoreBadge = ({ score }) => {
  const numScore = Number(score);
  let label = 'Low';
  let badgeClass = 'badge-low';

  if (numScore > 70) {
    label = 'High Risk';
    badgeClass = 'badge-high';
  } else if (numScore > 30) {
    label = 'Medium Risk';
    badgeClass = 'badge-medium';
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
      badgeClass = 'badge-market-favourable';
      break;
    case 'Unfavourable':
      badgeClass = 'badge-market-unfavourable';
      break;
    case 'Unusual':
      badgeClass = 'badge-market-unusual';
      break;
  }

  return (
    <span className={badgeClass}>
      {status}
    </span>
  );
};
