// Simple Dijkstra algorithm implementation

function dijkstra(graph, start) {
  const distances = {};
  const visited = new Set();

  for (let node in graph) {
    distances[node] = Infinity;
  }
  distances[start] = 0;

  while (visited.size < Object.keys(graph).length) {
    const [closest] = Object.entries(distances)
      .filter(([n]) => !visited.has(n))
      .reduce((a, b) => (a[1] < b[1] ? a : b), [null, Infinity]);

    if (!closest) break;
    visited.add(closest);

    for (let neighbor in graph[closest]) {
      const newDist = distances[closest] + graph[closest][neighbor];
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
      }
    }
  }

  return distances;
}

module.exports = dijkstra;
