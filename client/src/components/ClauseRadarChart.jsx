// =========================================================================
// Clause Risk Radar Chart (Recharts)
// =========================================================================
// Spider / radar plot visualising risk scores (0-100) for each of the 7
// extracted clause types. Arms are colour-zoned:
//   0-30   → green  (Low)
//   31-70  → amber  (Medium)
//   71-100 → red    (High)
//
// Props:
//   clauses  — contract.extractedClauses array
//   onSelect — optional callback(clauseType) when a legend item is clicked

import React, { useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

// Shorten long clause names so they fit on the radar axes
const SHORT_LABELS = {
  'Indemnity': 'Indemnity',
  'Limitation of Liability': 'Liab. Cap',
  'Governing Law': 'Gov. Law',
  'Termination': 'Termination',
  'IP Ownership': 'IP Rights',
  'Payment Terms': 'Payment',
  'Confidentiality': 'NDA',
};

// Custom dot on the radar polygon — colour-coded by score
const RiskDot = ({ cx, cy, value }) => {
  if (!cx || !cy) return null;
  let fill = '#10b981'; // green
  if (value > 70) fill = '#fa5252'; // red
  else if (value > 30) fill = '#ff9a2e'; // amber
  return <circle cx={cx} cy={cy} r={5} fill={fill} stroke="white" strokeWidth={1.5} />;
};

// Custom tooltip showing clause type + score + risk level label
const CustomTooltip = ({ active, payload, isDark }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const score = d.score;
  let level = 'Low';
  let color = '#10b981';
  if (score > 70) { level = 'High Risk'; color = '#fa5252'; }
  else if (score > 30) { level = 'Medium Risk'; color = '#ff9a2e'; }

  return (
    <div style={{
      backgroundColor: isDark ? '#111216' : '#faf9f5',
      border: `1px solid ${isDark ? '#1d1f24' : '#e6dfd8'}`,
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '11px',
      color: isDark ? '#ffffff' : '#141413',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      minWidth: '140px',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.fullName}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          display: 'inline-block',
          width: 8, height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }} />
        <span style={{ color }}>{score} / 100 — {level}</span>
      </div>
      {d.section && (
        <div style={{ color: isDark ? '#80838d' : '#6c6a64', marginTop: 4 }}>
          {d.section}
        </div>
      )}
    </div>
  );
};

// Custom axis tick — colours the label by its risk score
const RiskAngleTick = ({ x, y, payload, data, isDark }) => {
  const entry = data.find(d => d.subject === payload.value);
  const score = entry?.score ?? 0;
  let fill = isDark ? '#10b981' : '#5db872';
  if (score > 70) fill = isDark ? '#fa5252' : '#c64545';
  else if (score > 30) fill = isDark ? '#ff9a2e' : '#d4a017';

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill={fill}
      fontSize={10}
      fontWeight={600}
      fontFamily="Inter, sans-serif"
    >
      {payload.value}
    </text>
  );
};

const ClauseRadarChart = ({ clauses = [], onSelect }) => {
  const { isDark } = useTheme();
  const [hoveredClause, setHoveredClause] = useState(null);

  // Build radar data — one point per clause type
  const data = clauses.map(c => ({
    subject: SHORT_LABELS[c.clauseType] || c.clauseType,
    fullName: c.clauseType,
    score: Number(c.riskScore) || 0,
    section: c.sectionNumber,
  }));

  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-muted text-xs">
        No clause data available to render radar chart.
      </div>
    );
  }

  // Theme colours
  const radarFill     = isDark ? 'rgba(59,130,246,0.18)'  : 'rgba(204,120,92,0.14)';
  const radarStroke   = isDark ? '#3b82f6'                : '#cc785c';
  const gridStroke    = isDark ? '#1d1f24'                : '#e6dfd8';
  const radiusColor   = isDark ? '#4c4f59'                : '#8e8b82';

  // Score band reference lines rendered as a custom background element
  const bandOpacity = 0.06;

  return (
    <div className="w-full">
      {/* Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
            <PolarGrid
              gridType="polygon"
              stroke={gridStroke}
              strokeWidth={1}
            />
            {/* Radius axis (0-100 scale) */}
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tickCount={5}
              tick={{ fill: radiusColor, fontSize: 8 }}
              axisLine={false}
              stroke={gridStroke}
            />
            {/* Clause-type axis labels — colour coded by risk */}
            <PolarAngleAxis
              dataKey="subject"
              tick={(props) => (
                <RiskAngleTick {...props} data={data} isDark={isDark} />
              )}
            />
            <Radar
              name="Risk Score"
              dataKey="score"
              fill={radarFill}
              stroke={radarStroke}
              strokeWidth={2}
              dot={(props) => <RiskDot {...props} />}
              activeDot={{ r: 7, strokeWidth: 2 }}
              animationBegin={100}
              animationDuration={900}
              animationEasing="ease-out"
            />
            <Tooltip
              content={(props) => <CustomTooltip {...props} isDark={isDark} />}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk score legend below the chart */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-1 pb-1">
        {data.map((d) => {
          let dotColor = isDark ? '#10b981' : '#5db872';
          let label = 'Low';
          if (d.score > 70) { dotColor = isDark ? '#fa5252' : '#c64545'; label = 'High'; }
          else if (d.score > 30) { dotColor = isDark ? '#ff9a2e' : '#d4a017'; label = 'Med'; }

          return (
            <button
              key={d.fullName}
              onClick={() => onSelect && onSelect(d.fullName)}
              onMouseEnter={() => setHoveredClause(d.fullName)}
              onMouseLeave={() => setHoveredClause(null)}
              title={`Jump to ${d.fullName} clause`}
              className={`flex items-center gap-1.5 text-[10px] font-semibold rounded-md px-2 py-1 transition-all duration-150 cursor-pointer border ${
                hoveredClause === d.fullName
                  ? 'border-primary/40 bg-primary/5 scale-105'
                  : 'border-transparent hover:border-hairline'
              }`}
              style={{ color: dotColor }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: dotColor }}
              />
              {d.subject}
              <span
                className="ml-0.5 font-bold"
                style={{ color: dotColor }}
              >
                {d.score}
              </span>
            </button>
          );
        })}
      </div>

      {/* Zone reference */}
      <div className="flex items-center justify-center gap-5 mt-2 pb-1">
        {[
          { label: '0–30 Low',     color: isDark ? '#10b981' : '#5db872' },
          { label: '31–70 Medium', color: isDark ? '#ff9a2e' : '#d4a017' },
          { label: '71–100 High',  color: isDark ? '#fa5252' : '#c64545' },
        ].map(z => (
          <span key={z.label} className="flex items-center gap-1 text-[9px] font-medium text-muted">
            <span className="w-2 h-1.5 rounded-sm" style={{ backgroundColor: z.color }} />
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ClauseRadarChart;
