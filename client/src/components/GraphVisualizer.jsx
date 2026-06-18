// =========================================================================
// Interactive Clause Graph Visualizer (SVG-based Node-Link Diagram)
// =========================================================================
// This component renders a graphical representation of the contract and its 
// constituent clauses, along with cross-references.
//
// DESIGN & PHYSICS:
// - Center Node: Represents the main Contract document.
// - Orbital Nodes: Represent clauses arranged in a mathematical circle around the center.
// - Connectors (CONTAINS): Lines pointing from the Contract to each Clause.
// - Cross-references (REFERENCES): Colored arc/lines pointing from one Clause to another.
// - Interactive: Clicking a clause node triggers a highlight callback on the parent page.

import { useState } from 'react';


const GraphVisualizer = ({ graphData, onNodeClick }) => {
  const [hoveredNode, setHoveredNode] = useState(null);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="h-96 glass-card flex items-center justify-center text-slate-400">
        No graph relationships to display.
      </div>
    );
  }

  const { nodes, links, isConnected } = graphData;

  // Viewbox Dimensions
  const width = 600;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 130; // Radius of clause orbit

  // 1. Calculate positions for nodes in a circle
  // We place the main contract node in the center.
  // Other clause nodes are placed uniformly around it.
  const clauseNodes = nodes.filter(n => n.type === 'clause');
  const contractNode = nodes.find(n => n.type === 'contract') || nodes[0];

  const nodePositions = {};
  
  // Set position for the center contract node
  nodePositions[contractNode.id] = { x: centerX, y: centerY };

  // Set positions for the satellite clause nodes
  clauseNodes.forEach((node, index) => {
    const angle = (index * 2 * Math.PI) / clauseNodes.length;
    nodePositions[node.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  // Helper to determine node color based on risk score
  const getNodeColor = (node) => {
    if (node.type === 'contract') return '#f59e0b'; // Amber Gold for contract

    const score = Number(node.riskScore);
    if (score > 70) return '#f43f5e'; // Rose Red (High Risk)
    if (score > 30) return '#f59e0b'; // Amber Yellow (Medium Risk)
    return '#10b981'; // Emerald Green (Low Risk)
  };

  return (
    <div className="glass-card p-6 relative">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Clause Relationship Graph
          </h3>
          <p className="text-xs text-slate-400">
            Visualizes clauses containing cross-references (REFERENCES) to other clauses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            isConnected 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
          }`}>
            {isConnected ? 'Neo4j Active' : 'MongoDB Graph Helper'}
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex justify-center bg-navy-950/60 rounded-xl overflow-hidden border border-navy-800">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl h-96 select-none">
          {/* Define Arrowheads for references */}
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>
          </defs>

          {/* 1. DRAW LINKS / EDGES */}
          {links.map((link, idx) => {
            const start = nodePositions[link.source];
            const end = nodePositions[link.target];

            if (!start || !end) return null;

            const isReference = link.label === 'REFERENCES';

            // We draw REFERENCES as slightly curved red lines to distinguish them,
            // and CONTAINS as dashed neutral lines.
            if (isReference) {
              // Calculate control point for curved path
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const dr = Math.sqrt(dx * dx + dy * dy);
              // Simple quadratic curve
              const pathData = `M${start.x},${start.y} A${dr},${dr} 0 0,1 ${end.x},${end.y}`;

              return (
                <path
                  key={`link-${idx}`}
                  d={pathData}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  markerEnd="url(#arrow)"
                  className="opacity-70 hover:opacity-100 transition-opacity"
                />
              );
            } else {
              // Straight dashed line from center to satellite
              return (
                <line
                  key={`link-${idx}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  className="opacity-40"
                />
              );
            }
          })}

          {/* 2. DRAW NODES */}
          {nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            const isContract = node.type === 'contract';
            const size = isContract ? 24 : 14;
            const nodeColor = getNodeColor(node);
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => !isContract && onNodeClick && onNodeClick(node.clauseType)}
              >
                {/* Outer Glow Halo on Hover */}
                <circle
                  r={size + (isHovered ? 8 : 4)}
                  fill={nodeColor}
                  opacity={isHovered ? 0.35 : 0.15}
                  className="transition-all duration-200"
                />

                {/* Main Node Circle */}
                <circle
                  r={size}
                  fill={isContract ? '#1e293b' : nodeColor}
                  stroke={nodeColor}
                  strokeWidth="2.5"
                  className="transition-transform duration-200"
                />

                {/* Label text inside or adjacent */}
                <text
                  y={size + 15}
                  textAnchor="middle"
                  fill={isHovered ? '#f8fafc' : '#94a3b8'}
                  fontSize={isContract ? 11 : 9}
                  fontWeight={isContract ? 'bold' : 'normal'}
                  className="pointer-events-none select-none transition-colors"
                >
                  {isContract ? 'CONTRACT' : node.clauseType}
                </text>

                {/* Contract Icon (simple representation) */}
                {isContract && (
                  <path
                    d="M-6 -8 L2 -8 L8 -2 L8 8 L-6 8 Z"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Details Panel Overlay */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-700/60 rounded-lg p-2.5 backdrop-blur-sm transition-all">
            {(() => {
              const node = nodes.find(n => n.id === hoveredNode);
              if (!node) return null;
              if (node.type === 'contract') {
                return (
                  <div>
                    <span className="text-xs text-amber-500 font-bold">Document Center</span>
                    <h4 className="text-sm font-semibold text-slate-100">{node.label}</h4>
                  </div>
                );
              } else {
                return (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-400">Clause Node ({node.clauseType})</span>
                      <h4 className="text-sm font-semibold text-slate-200">
                        Risk Score: <span className={Number(node.riskScore) > 70 ? 'text-rose-400' : Number(node.riskScore) > 30 ? 'text-amber-400' : 'text-emerald-400'}>{node.riskScore}%</span>
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 italic">Click to jump to clause details</span>
                  </div>
                );
              }
            })()}
          </div>
        )}
      </div>

      {/* Legend Block */}
      <div className="flex flex-wrap gap-4 items-center justify-center mt-4 text-xs text-slate-400 border-t border-navy-800/80 pt-4">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 opacity-20 border border-emerald-500"></span>
          Low Risk (&lt;=30%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 opacity-20 border border-amber-500"></span>
          Medium Risk (31-70%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 opacity-20 border border-rose-500"></span>
          High Risk (&gt;70%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="border-t-2 border-dashed border-red-500 w-6 h-0 inline-block mr-1"></span>
          Cross Reference Line
        </span>
      </div>
    </div>
  );
};

export default GraphVisualizer;
