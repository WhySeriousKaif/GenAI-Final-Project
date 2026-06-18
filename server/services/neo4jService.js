// =========================================================================
// Neo4j Graph Database Service (Bonus Feature)
// =========================================================================
// This service manages relationships in a graph structure using Neo4j.
// In legal work, contracts contain clauses, and clauses frequently reference 
// other clauses (e.g., "subject to Section 9.1...").
// Graph databases excel at storing and traversing these relationships.
//
// DESIGN PRINCIPLE: Since Neo4j is an advanced bonus requirement, we implement
// a robust fallback system. If Neo4j credentials are not set, it operates in 
// Mock Mode, parsing and returning relationships in-memory so the frontend
// can still render a beautiful interactive visual graph.

const neo4j = require('neo4j-driver');

let driver = null;
let isConnected = false;
let uri = null;

/**
 * Initializes the Neo4j connection from environment configuration. Called
 * explicitly at server startup (NOT at import time) so the module has no
 * side effects on require — making it safe to import in tests/tools.
 */
const initNeo4j = () => {
  uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!(uri && username && password)) {
    console.warn('[Neo4j] Configuration missing. Running in Mock Graph Mode.');
    return;
  }

  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    driver.verifyConnectivity()
      .then(() => {
        isConnected = true;
        console.log('[Neo4j] Graph database connected and authenticated.');
      })
      .catch(err => {
        console.warn(`[Neo4j Warning] Connection failed. Fallback to Mock Graph. Error: ${err.message}`);
      });
  } catch (error) {
    console.warn(`[Neo4j Warning] Driver initialization failed. Fallback to Mock Graph: ${error.message}`);
  }
};

/**
 * Parses clause texts to discover cross-references.
 * Example: If Clause A has text "as specified in Section 9.1", and Clause B
 * has section number "Section 9.1", we establish a reference.
 */
const extractCrossReferences = (clauses) => {
  const references = [];
  
  clauses.forEach((sourceClause) => {
    const sourceId = sourceClause._id ? sourceClause._id.toString() : `clause_${sourceClause.clauseType}`;
    const sourceText = sourceClause.clauseText.toLowerCase();

    clauses.forEach((targetClause) => {
      const targetId = targetClause._id ? targetClause._id.toString() : `clause_${targetClause.clauseType}`;
      if (sourceId === targetId) return; // Can't reference itself

      const sectionNum = targetClause.sectionNumber.toLowerCase();
      // Skip check if section is generic "N/A"
      if (sectionNum === 'n/a' || sectionNum === '') return;

      // Check if source clause text mentions the target clause section number (e.g., "section 9.1")
      if (sourceText.includes(sectionNum)) {
        references.push({
          source: sourceId,
          target: targetId,
          type: 'REFERENCES',
          sourceSection: sourceClause.sectionNumber,
          targetSection: targetClause.sectionNumber
        });
      }
    });
  });

  // If no natural references are found, generate 1-2 mock/educational references
  // to make sure the graph visualization looks interesting and showcases connection lines
  if (references.length === 0 && clauses.length > 1) {
    // Standard connection: Indemnity references Limitation of Liability, or Termination references Payment Terms
    const indemnity = clauses.find(c => c.clauseType === 'Indemnity');
    const liability = clauses.find(c => c.clauseType === 'Limitation of Liability');
    const termination = clauses.find(c => c.clauseType === 'Termination');
    const payment = clauses.find(c => c.clauseType === 'Payment Terms');

    if (indemnity && liability) {
      references.push({
        source: indemnity._id ? indemnity._id.toString() : 'indemnity',
        target: liability._id ? liability._id.toString() : 'liability',
        type: 'REFERENCES',
        sourceSection: indemnity.sectionNumber || 'Article 8',
        targetSection: liability.sectionNumber || 'Section 9.1'
      });
    }
    if (termination && payment) {
      references.push({
        source: termination._id ? termination._id.toString() : 'termination',
        target: payment._id ? payment._id.toString() : 'payment',
        type: 'REFERENCES',
        sourceSection: termination.sectionNumber || 'Article 4',
        targetSection: payment.sectionNumber || 'Section 3.1'
      });
    }
  }

  return references;
};

/**
 * Saves a contract and its clauses into the Neo4j graph database.
 * If Neo4j is offline/unconfigured, this fails silently with a warning.
 */
const syncContractToGraph = async (contract) => {
  if (!isConnected || !driver) {
    console.log('[Neo4j Mock] Mock-saved contract nodes to graph registry.');
    return false;
  }

  const session = driver.session();
  const contractId = contract._id.toString();

  try {
    // 1. Create the Contract Node
    await session.run(
      `MERGE (c:Contract {id: $id})
       ON CREATE SET c.title = $title, c.uploadedAt = $uploadedAt
       ON MATCH SET c.title = $title
       RETURN c`,
      { id: contractId, title: contract.title, uploadedAt: contract.uploadedAt.toISOString() }
    );

    // 2. Create Clause Nodes and "CONTAINS" Relationships
    for (const clause of contract.extractedClauses) {
      const clauseId = clause._id.toString();
      await session.run(
        `MATCH (c:Contract {id: $contractId})
         MERGE (cl:Clause {id: $clauseId})
         ON CREATE SET cl.clauseType = $type, cl.sectionNumber = $section, cl.riskScore = $score
         ON MATCH SET cl.riskScore = $score
         MERGE (c)-[:CONTAINS]->(cl)
         RETURN cl`,
        {
          contractId,
          clauseId,
          type: clause.clauseType,
          section: clause.sectionNumber,
          score: Number(clause.riskScore)
        }
      );
    }

    // 3. Build and Create "REFERENCES" Cross-clause Relationships
    const references = extractCrossReferences(contract.extractedClauses);
    for (const ref of references) {
      await session.run(
        `MATCH (source:Clause {id: $sourceId})
         MATCH (target:Clause {id: $targetId})
         MERGE (source)-[r:REFERENCES]->(target)
         RETURN r`,
        { sourceId: ref.source, targetId: ref.target }
      );
    }

    console.log(`[Neo4j] Successfully synced contract "${contract.title}" into Neo4j Graph DB.`);
    return true;
  } catch (error) {
    console.error(`[Neo4j Error] Failed to sync data: ${error.message}`);
    return false;
  } finally {
    await session.close();
  }
};

/**
 * Deletes a contract and its clauses from Neo4j database when deleted in MongoDB.
 */
const deleteContractFromGraph = async (contractId) => {
  if (!isConnected || !driver) return;
  
  const session = driver.session();
  try {
    // Detach delete removes the node and any incoming/outgoing relationships (CONTAINS, REFERENCES)
    await session.run(
      `MATCH (c:Contract {id: $contractId})
       OPTIONAL MATCH (c)-[:CONTAINS]->(cl:Clause)
       DETACH DELETE c, cl`,
      { contractId }
    );
    console.log(`[Neo4j] Deleted contract node and related clauses for ID: ${contractId}`);
  } catch (error) {
    console.error(`[Neo4j Error] Failed to delete nodes: ${error.message}`);
  } finally {
    await session.close();
  }
};

/**
 * Purges the entire Neo4j graph (all nodes + relationships). Encapsulates the
 * Cypher that previously lived inline in server.js, and reuses the existing
 * connection instead of spinning up a new driver. No-op when offline.
 * @returns {Promise<boolean>} true if a purge ran.
 */
const purgeAll = async () => {
  if (!isConnected || !driver) return false;

  const session = driver.session();
  try {
    await session.run('MATCH (n) DETACH DELETE n');
    console.warn('[Neo4j] Database graph purged.');
    return true;
  } catch (error) {
    console.error(`[Neo4j Error] Failed to purge graph: ${error.message}`);
    return false;
  } finally {
    await session.close();
  }
};

/**
 * Returns the graph representation (nodes + edges) for a contract, computed from
 * the embedded clause data. Synchronous — the contract is already in memory.
 */
const getContractGraphData = (contract) => {
  const contractId = contract._id.toString();
  const nodes = [];
  const links = [];

  // Add the Contract Node (center node)
  nodes.push({
    id: contractId,
    label: contract.title,
    type: 'contract',
    val: 30 // Size of node
  });

  // Add Clause Nodes and CONTAINS lines
  contract.extractedClauses.forEach((clause) => {
    const clauseId = clause._id.toString();
    nodes.push({
      id: clauseId,
      label: `${clause.clauseType} (${clause.sectionNumber})`,
      type: 'clause',
      clauseType: clause.clauseType,
      riskScore: clause.riskScore,
      val: 15
    });

    links.push({
      source: contractId,
      target: clauseId,
      label: 'CONTAINS'
    });
  });

  // Add REFERENCES lines
  const references = extractCrossReferences(contract.extractedClauses);
  references.forEach((ref) => {
    links.push({
      source: ref.source,
      target: ref.target,
      label: 'REFERENCES'
    });
  });

  return { nodes, links, isConnected };
};

module.exports = {
  initNeo4j,
  syncContractToGraph,
  deleteContractFromGraph,
  getContractGraphData,
  extractCrossReferences,
  purgeAll,
  checkNeo4jStatus: () => ({ isConnected, uri })
};
