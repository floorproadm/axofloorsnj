// Compute a 3x3 homography that maps the unit square [(0,0),(1,0),(1,1),(0,1)]
// to four destination points (in pixels), then convert it to a CSS matrix3d string.
// Pure TypeScript, no dependencies.

export type Pt = { x: number; y: number };

function solve(A: number[][], b: number[]): number[] {
  // Gaussian elimination on an 8x8 system.
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let max = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[max][i])) max = k;
    }
    [M[i], M[max]] = [M[max], M[i]];
    const pivot = M[i][i] || 1e-12;
    for (let k = i + 1; k < n; k++) {
      const f = M[k][i] / pivot;
      for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / (M[i][i] || 1e-12);
  }
  return x;
}

// Returns the 3x3 homography H (row-major) so that H * [u,v,1]^T ~ [x,y,1]^T
// for the 4 src->dst correspondences (src is the unit square).
export function homographyFromUnitSquare(dst: [Pt, Pt, Pt, Pt]): number[] {
  const src: [Pt, Pt, Pt, Pt] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x: u, y: v } = src[i];
    const { x, y } = dst[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    b.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    b.push(y);
  }
  const h = solve(A, b);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

// CSS matrix3d is column-major 4x4. We extend the 3x3 H to 4x4 with z passthrough.
export function homographyToMatrix3d(H: number[]): string {
  const [a, b, c, d, e, f, g, h, i] = H;
  // 4x4:
  // | a b 0 c |
  // | d e 0 f |
  // | 0 0 1 0 |
  // | g h 0 i |
  const m = [
    a, d, 0, g,
    b, e, 0, h,
    0, 0, 1, 0,
    c, f, 0, i,
  ];
  return `matrix3d(${m.map((n) => (Number.isFinite(n) ? n : 0)).join(",")})`;
}
