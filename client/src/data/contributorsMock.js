// =========================================================================
// Mock Contributor/Team Data
// =========================================================================
// This file contains sample data for displaying team contributions.
// These are mock avatars and contributor profiles for demonstration.
// In production, this would come from backend API.

export const contributors = [
  {
    id: 'c1',
    name: 'Sarah Chen',
    role: 'Legal Analyst',
    department: 'legal',
    initials: 'SC',
    avatarColor: 'from-sky-600 to-sky-500',
    contributions: 24,
  },
  {
    id: 'c2',
    name: 'Marcus Rivera',
    role: 'Finance Analyst',
    department: 'finance',
    initials: 'MR',
    avatarColor: 'from-emerald-600 to-emerald-500',
    contributions: 18,
  },
  {
    id: 'c3',
    name: 'Priya Patel',
    role: 'Ops Specialist',
    department: 'operations',
    initials: 'PP',
    avatarColor: 'from-amber-600 to-amber-500',
    contributions: 12,
  },
  {
    id: 'c4',
    name: 'James Wilson',
    role: 'Legal Analyst',
    department: 'legal',
    initials: 'JW',
    avatarColor: 'from-blue-600 to-blue-500',
    contributions: 16,
  },
  {
    id: 'c5',
    name: 'Emma Liu',
    role: 'AI Reviewer',
    department: 'operations',
    initials: 'EL',
    avatarColor: 'from-purple-600 to-purple-500',
    contributions: 14,
  },
];

// Sample analysis history for a contract
export const getSampleAnalysisHistory = () => [
  {
    step: 1,
    action: 'Extracted clauses',
    analyst: contributors[0],
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    step: 2,
    action: 'Assessed risks',
    analyst: contributors[1],
    timestamp: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000), // ~1.8 days ago
  },
  {
    step: 3,
    action: 'Reviewed & QA approved',
    analyst: contributors[2],
    timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000), // ~12 hours ago
  },
];

// Get a random analyst for mock data
export const getRandomAnalyst = () => {
  return contributors[Math.floor(Math.random() * contributors.length)];
};

// Get top 3 contributors
export const getTopContributors = () => {
  return contributors
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 3);
};

// Calculate total contributions
export const getTotalContributions = () => {
  return contributors.reduce((sum, c) => sum + c.contributions, 0);
};

// Get contribution percentage for a contributor
export const getContributionPercentage = (contributorId) => {
  const contributor = contributors.find(c => c.id === contributorId);
  if (!contributor) return 0;
  const total = getTotalContributions();
  return Math.round((contributor.contributions / total) * 100);
};
