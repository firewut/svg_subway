export class PriorityNode {
  key: number;
  priority: number;

  constructor(key: number, priority: number) {
    this.key = key;
    this.priority = priority;
  }
}

export class PriorityQueue {
  nodes: PriorityNode[] = [];

  enqueue(priority: number, key: any) {
    this.nodes.push(new PriorityNode(key, priority));
    this.nodes.sort(
      function(a, b) {
        return a.priority - b.priority;
      }
    );
  }

  dequeue(): number {
    return this.nodes.shift().key;
  }

  empty(): boolean {
    return !this.nodes.length;
  }
}

export class Dijkstra {
  infinity = 1 / 0;
  vertices = {};

  addVertex(name: string, edges: any) {
    this.vertices[name] = edges;
  }

  addToVertex(name: string, edges: any) {
    edges = Object.assign(
      {},
      edges,
      this.getVertex(name),
    );
    this.addVertex(name, edges);
  }

  getVertex(name: string) {
    return this.vertices[name];
  }

  shortestPath(start: string, finish: string) {
    const nodes = new PriorityQueue(),
      distances = {},
      previous = {},
      path = [];

    let smallest: any,
      neighbor: any,
      alt: any;

    // Init the distances and queues variables
    for (const vertex in this.vertices) {
      if (vertex === start) {
        distances[vertex] = 0;
        nodes.enqueue(0, vertex);
      } else {
        distances[vertex] = this.infinity;
        nodes.enqueue(this.infinity, vertex);
      }

      previous[vertex] = null;
    }

    // continue as long as the queue haven't been emptied.
    while (!nodes.empty()) {
      smallest = nodes.dequeue();

      // we are the last node
      if (smallest === finish) {

        // Compute the path
        while (previous[smallest]) {
          path.push(smallest);
          smallest = previous[smallest];
        }
        break;
      }

      // No distance known. Skip.
      if (!smallest || distances[smallest] === this.infinity) {
        continue;
      }

      // Compute the distance for each neighbor
      for (neighbor in this.vertices[smallest]) {
        alt = distances[smallest] + this.vertices[smallest][neighbor];

        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = smallest;
          nodes.enqueue(alt, neighbor);
        }
      }
    }

    // the starting point isn't in the solution &
    // the solution is from end to start.
    return path.concat(start).reverse();
  }
}
