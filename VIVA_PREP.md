# 🎓 Legal Document Intelligence System: Viva Preparation Guide

This guide compiles potential questions university examiners and viva panels might ask about this project. The answers are written in a simple, first-person narrative ("In our project, we...") so you can easily study and repeat them during your presentation.

---

## 📂 Section 1: System Architecture & MERN Stack

### Q1: Why did you choose React + Vite for the frontend instead of vanilla HTML/JS?
**Answer:** 
> "We chose React because it is a component-based framework. This allows us to build reusable components, such as our `RiskBadge` and the `GraphVisualizer` SVG panel. Vite was selected because it is a modern, high-speed build tool that uses native ES modules, providing near-instantaneous Hot Module Replacement (HMR) during development. This makes our interface fast, responsive, and easy to maintain."

### Q2: What is Mongoose, and why did you use it instead of the native MongoDB driver?
**Answer:** 
> "Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. MongoDB is schema-less by nature, which can lead to unstructured data inconsistencies. Mongoose allows us to define a strict, typed schema (e.g. for `extractedClauses` and `summary`) with validation rules, ensuring that every contract uploaded complies with a predictable structure before saving to the database."

### Q3: How do you handle file uploads in Express?
**Answer:** 
> "We use **Multer**, which is a Node.js middleware for handling `multipart/form-data`. When a user drags and drops a PDF or DOCX file, Multer intercepts the request, validates the file type, and stores the file temporarily as a binary buffer in memory or disk. We then pass this buffer to our text extraction utility."

---

## 🤖 Section 2: AI, PDF Parsing, & Text Extraction

### Q4: How does the system extract text from binary files like PDF and DOCX?
**Answer:** 
> "We use two specific text extraction libraries in our backend:
> 1. For **PDFs**, we use `pdf-parse`, which parses the binary PDF stream, extracts the text contents page by page, and outputs a single concatenated raw string.
> 2. For **Word Documents (.docx)**, we use `mammoth`, which extracts the text by converting the DOCX XML structure directly into plain paragraph text, preventing formatting symbols from cluttering the raw string."

### Q5: If I don't have an internet connection or a Gemini API Key, how does the system analyze the clauses?
**Answer:** 
> "We implemented an **Offline Heuristic Engine (Fallback)**. When the backend initializes, it checks if `GEMINI_API_KEY` is present. If it is missing or network requests fail, the system engages regular expressions (regex) to search the raw text for legal keywords like *indemnify*, *net 30*, or *limitation of liability*. It then mocks standard scores and justifications so that the application remains fully functional and never crashes during a live demonstration."

---

## 🔍 Section 3: Retrieval-Augmented Generation (RAG)

### Q6: What is RAG, and why is it used in this project?
**Answer:** 
> "RAG stands for **Retrieval-Augmented Generation**. Commercial contracts can be 100+ pages long, exceeding the prompt size limits or token budgets of LLMs. Instead of sending the entire contract text to the LLM, RAG indexes the text into small chunks, finds the most relevant paragraphs using similarity matching, and sends *only* those relevant paragraphs to the Gemini API as context alongside the user's question. This makes answers highly accurate and keeps API costs low."

### Q7: Explain the step-by-step math/logic behind your RAG implementation.
**Answer:** 
> "Our RAG engine runs in four main steps:
> 1. **Chunking:** The raw contract text is split into small overlapping blocks (e.g., 500 characters each).
> 2. **Embedding / Indexing:** Each block is converted into a vector (array of numbers) representing its meaning, either using Gemini's embedding API or a lightweight TF-IDF keyword vectorizer.
> 3. **Similarity Query:** When the user asks a question, we vectorize that question and calculate the cosine similarity between the question vector and all contract chunks.
> 4. **Synthesis:** We retrieve the top 3 most similar chunks, inject them into a system prompt as 'Context', and ask Gemini to answer the question *only* using that context."

---

## 🕸️ Section 4: Graph Databases (Neo4j) & Visualizations

### Q8: What is the purpose of Neo4j in this project? What relationships do you map?
**Answer:** 
> "Neo4j is a Graph Database. While MongoDB is excellent for storing tabular or nested metadata, it is slow at querying recursive relationships, like clause cross-references. In Neo4j, we map:
> - **Nodes:** The main `Contract` and individual `Clauses`.
> - **Relationships:** `(:Contract)-[:CONTAINS]->(:Clause)` and `(:Clause)-[:REFERENCES]->(:Clause)`.
> This structure allows us to query and visualize the network of clauses and identify how changes in one clause (e.g., Indemnity) might affect referenced clauses (e.g., Liability limits)."

### Q9: How did you implement the graph visualizer on the frontend?
**Answer:** 
> "We chose to build a custom, interactive **SVG-based node-link diagram** using pure React. The contract node is drawn at the center, and the clause nodes are distributed in an orbit around it using trigonometry ($\sin$ and $\cos$). We draw dashed lines for `CONTAINS` relationships and solid red arrow paths for `REFERENCES` cross-references. This is responsive, requires no heavy external libraries, and runs efficiently in the browser."

---

## 🛡️ Section 5: Database Administration & Error Handling

### Q10: How does the system handle database resets?
**Answer:** 
> "In `server/server.js`, we exposed an admin utility endpoint `POST /api/admin/reset-db`. When triggered, it executes `deleteMany({})` on our MongoDB collections and runs a Cypher query `MATCH (n) DETACH DELETE n` in Neo4j to purge all nodes and relationships. This allows us to clear all experimental data and showcase the entire document ingestion pipeline from scratch."
