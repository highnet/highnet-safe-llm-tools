import type { DatasetRow, Label } from './types';

// Geometry for the scope map, in view units (the plot's 0–100 box), y pointing up.
export const VIEW = 100;
const PAD = 4;

export type Point = { x: number; y: number };

export const mapScale = (points: Point[]) => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const span = Math.max(x1 - x0, y1 - y0, 1e-9);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const unit = (VIEW - 2 * PAD) / span;
  return {
    x: (x: number) => VIEW / 2 + (x - cx) * unit,
    y: (y: number) => VIEW / 2 - (y - cy) * unit,
    unit,
  };
};

// The class's marker shape centred on (x, y). Each class wears the shape its ink already has on
// the RAG pages, so an ink and shape pair means one thing site-wide: in = green triangle,
// adjacent = blue circle, out = umber square, injection = violet diamond.
export const markerPath = (label: Label, x: number, y: number, r: number): string => {
  const f = (n: number) => n.toFixed(2);
  switch (label) {
    case 'in':
      return `M${f(x)} ${f(y - r * 1.15)}L${f(x + r * 1.1)} ${f(y + r * 0.85)}L${f(x - r * 1.1)} ${f(y + r * 0.85)}Z`;
    case 'adjacent':
      return `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
    case 'out':
      return `M${f(x - r * 0.9)} ${f(y - r * 0.9)}h${f(r * 1.8)}v${f(r * 1.8)}h${f(-r * 1.8)}Z`;
    default:
      return `M${f(x)} ${f(y - r * 1.25)}L${f(x + r * 1.25)} ${f(y)}L${f(x)} ${f(y + r * 1.25)}L${f(x - r * 1.25)} ${f(y)}Z`;
  }
};

// The labels a visitor's edit puts on the prompts: a moved topic takes its new class.
export const labelWith =
  (edit: Record<string, Label>) =>
  (row: Pick<DatasetRow, 'topic' | 'label'>): Label =>
    edit[row.topic] ?? row.label;

export const mapDistance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

// Andrew's monotone chain: the convex hull of the points, counter-clockwise.
export const convexHull = (points: Point[]): Point[] => {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length < 3) return sorted;
  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (list: Point[]) => {
    const out: Point[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
};

export const insideHull = (hull: Point[], p: Point) =>
  hull.length >= 3 &&
  hull.every((a, i) => {
    const b = hull[(i + 1) % hull.length];
    return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= 0;
  });

export type Cell = { x0: number; y0: number; x1: number; y1: number; count: number };

// A grid over the points' bounding box; cells whose centre lies inside the hull count as "inside
// the spread". Empty inside cells are the sparse regions the coverage page marks.
export const densityGrid = (points: Point[], size: number) => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const w = (Math.max(...xs) - x0) / size || 1;
  const h = (Math.max(...ys) - y0) / size || 1;
  const counts = Array.from({ length: size * size }, () => 0);
  for (const p of points) {
    const i = Math.min(Math.floor((p.x - x0) / w), size - 1);
    const j = Math.min(Math.floor((p.y - y0) / h), size - 1);
    counts[j * size + i] += 1;
  }
  const hull = convexHull(points);
  const cells: Cell[] = counts.map((count, n) => {
    const [i, j] = [n % size, Math.floor(n / size)];
    return { x0: x0 + i * w, y0: y0 + j * h, x1: x0 + (i + 1) * w, y1: y0 + (j + 1) * h, count };
  });
  const inside = cells.filter((c) =>
    insideHull(hull, { x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 }),
  );
  return { inside, empty: inside.filter((c) => c.count === 0) };
};
