// Simple Express server that exposes Dijkstra as an API

const express = require("express");
const app = express();
const dijkstra = require("./dijkstra");

app.use(express.json());

app.post("/shortest-path", (req, res) => {
  const { graph, start } = req.body;
  if (!graph || !start) {
    return res.status(400).json({ error: "graph and start are required" });
  }
  const result = dijkstra(graph, start);
  res.json({ result });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
