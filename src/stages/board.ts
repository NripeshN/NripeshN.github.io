// A small 3D chess board: procedural pieces (lathe profiles, no downloaded models), a lit board with
// soft shadows, and the position's last move played when the board comes into view. Used on the
// MetalFish stage (dark) and in the Chess section (paper). Loaded lazily; Three.js is shared with the hub.
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, MeshStandardMaterial, BoxGeometry, LatheGeometry,
  SphereGeometry, CylinderGeometry, Vector2, Vector3, DirectionalLight, HemisphereLight, PCFSoftShadowMap,
  ACESFilmicToneMapping, SRGBColorSpace, Shape, ExtrudeGeometry, Color, PlaneGeometry, ShadowMaterial,
} from 'three';
import gsap from 'gsap';

export interface BoardOptions {
  fen: string;            // the position after the last move
  lastMove?: string;      // e.g. "d2f2": the piece is shown on its origin square first, then moved
  side?: 'white' | 'black';
  theme?: 'stage' | 'paper';
}
export interface Board { replay(): void; destroy(): void }

const FILES = 'abcdefgh';
type PieceKind = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

function parseFen(fen: string): { kind: PieceKind; white: boolean; file: number; rank: number }[] {
  const out: { kind: PieceKind; white: boolean; file: number; rank: number }[] = [];
  const rows = fen.split(' ')[0]!.split('/');
  rows.forEach((row, r) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { f += Number(ch); continue; }
      out.push({ kind: ch.toLowerCase() as PieceKind, white: ch === ch.toUpperCase(), file: f, rank: 7 - r });
      f++;
    }
  });
  return out;
}
const sq = (s: string) => ({ file: FILES.indexOf(s[0]!), rank: Number(s[1]) - 1 });
const toWorld = (file: number, rank: number) => new Vector3(file - 3.5, 0, 3.5 - rank);

// Piece profiles as (radius, height) pairs for LatheGeometry. Square size is 1.
function lathe(points: [number, number][], segments = 28): LatheGeometry {
  return new LatheGeometry(points.map(([r, y]) => new Vector2(r, y)), segments);
}
const base: [number, number][] = [[0, 0], [0.34, 0], [0.36, 0.05], [0.3, 0.09], [0.26, 0.14]];
const PROFILES: Record<Exclude<PieceKind, 'n'>, [number, number][]> = {
  p: [...base, [0.17, 0.22], [0.15, 0.4], [0.2, 0.44], [0.12, 0.48], [0, 0.48]],
  r: [...base, [0.22, 0.2], [0.2, 0.5], [0.27, 0.54], [0.27, 0.66], [0.18, 0.66], [0.18, 0.6], [0, 0.6]],
  b: [...base, [0.18, 0.24], [0.15, 0.5], [0.22, 0.56], [0.2, 0.62], [0.1, 0.74], [0.04, 0.8], [0, 0.8]],
  q: [...base, [0.2, 0.24], [0.16, 0.56], [0.26, 0.66], [0.24, 0.72], [0.14, 0.8], [0.08, 0.86], [0, 0.86]],
  k: [...base, [0.2, 0.24], [0.17, 0.58], [0.27, 0.68], [0.24, 0.74], [0.12, 0.82], [0, 0.82]],
};
function knightGeometry(): Group {
  const g = new Group();
  const b = lathe([...base, [0.2, 0.2], [0.18, 0.28], [0, 0.28]]);
  g.add(new Mesh(b));
  const s = new Shape();
  // a stylised horse's head, side-on, in a 0.5 x 0.55 box
  s.moveTo(-0.16, 0); s.lineTo(0.16, 0); s.lineTo(0.14, 0.18); s.lineTo(0.2, 0.34); s.lineTo(0.12, 0.5);
  s.lineTo(0.0, 0.55); s.lineTo(-0.06, 0.48); s.lineTo(-0.22, 0.4); s.lineTo(-0.2, 0.33); s.lineTo(-0.08, 0.3);
  s.lineTo(-0.1, 0.16); s.lineTo(-0.16, 0);
  const head = new Mesh(new ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }));
  head.position.set(0, 0.27, -0.11);
  g.add(head);
  return g;
}

export function createBoard(container: HTMLElement, opts: BoardOptions): Board {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const theme = opts.theme ?? 'stage';
  const side = opts.side ?? 'white';

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 60);
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  container.querySelectorAll('img').forEach((img) => { img.hidden = true; });
  container.appendChild(renderer.domElement);

  const dark = theme === 'stage';
  const light = new DirectionalLight(0xffffff, dark ? 2.4 : 2.0);
  light.position.set(-3, 7, 4);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = -5.5; light.shadow.camera.right = 5.5; light.shadow.camera.top = 5.5; light.shadow.camera.bottom = -5.5;
  light.shadow.camera.near = 1; light.shadow.camera.far = 20; light.shadow.bias = -0.0005; light.shadow.radius = 4;
  scene.add(light);
  scene.add(new HemisphereLight(0xffffff, dark ? 0x1b1e24 : 0xd9d6cc, dark ? 0.9 : 1.1));

  const world = new Group();
  world.rotation.y = side === 'black' ? Math.PI : 0;
  scene.add(world);

  // Board: two square colours, a thin rim, a shadow catcher under it.
  const lightSq = new MeshStandardMaterial({ color: dark ? 0xb9b4a6 : 0xe6e2d6, roughness: 0.9, metalness: 0 });
  const darkSq = new MeshStandardMaterial({ color: dark ? 0x4b4e55 : 0x8a8c90, roughness: 0.9, metalness: 0 });
  const tile = new BoxGeometry(1, 0.12, 1);
  const tiles: Mesh[] = [];
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
    const m = new Mesh(tile, (f + r) % 2 === 0 ? darkSq : lightSq);
    m.position.copy(toWorld(f, r)); m.position.y = -0.06;
    m.receiveShadow = true;
    world.add(m); tiles.push(m);
  }
  const rim = new Mesh(new BoxGeometry(8.5, 0.16, 8.5), new MeshStandardMaterial({ color: dark ? 0x25282e : 0x2b2b2b, roughness: 0.8 }));
  rim.position.y = -0.09; rim.receiveShadow = true; world.add(rim);
  const catcher = new Mesh(new PlaneGeometry(14, 14), new ShadowMaterial({ opacity: dark ? 0.5 : 0.22 }));
  catcher.rotation.x = -Math.PI / 2; catcher.position.y = -0.17; catcher.receiveShadow = true; scene.add(catcher);

  // Pieces.
  const whiteMat = new MeshStandardMaterial({ color: 0xe9e3d3, roughness: 0.55, metalness: 0.02 });
  const blackMat = new MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.5, metalness: 0.08 });
  const geos: Partial<Record<PieceKind, LatheGeometry>> = {};
  const pieceAt = new Map<string, Group>();
  const pieces = parseFen(opts.fen);
  const last = opts.lastMove ? { from: sq(opts.lastMove.slice(0, 2)), to: sq(opts.lastMove.slice(2, 4)) } : null;
  let moved: Group | null = null;
  for (const p of pieces) {
    const mat = p.white ? whiteMat : blackMat;
    let g: Group;
    if (p.kind === 'n') {
      g = knightGeometry();
      g.children.forEach((c) => { (c as Mesh).material = mat; c.castShadow = true; c.receiveShadow = true; });
      g.rotation.y = p.white ? Math.PI : 0;
    } else {
      geos[p.kind] ??= lathe(PROFILES[p.kind]);
      const m = new Mesh(geos[p.kind]!, mat); m.castShadow = true; m.receiveShadow = true;
      g = new Group(); g.add(m);
      if (p.kind === 'k') {
        const cross = new Group();
        const bar = new Mesh(new BoxGeometry(0.05, 0.2, 0.05), mat); bar.castShadow = true;
        const arm = new Mesh(new BoxGeometry(0.16, 0.05, 0.05), mat); arm.castShadow = true;
        cross.add(bar, arm); cross.position.y = 0.9; arm.position.y = 0.03; g.add(cross);
      }
      if (p.kind === 'q') { const ball = new Mesh(new SphereGeometry(0.06, 14, 10), mat); ball.position.y = 0.9; ball.castShadow = true; g.add(ball); }
    }
    const isMoved = last && p.file === last.to.file && p.rank === last.to.rank;
    const start = isMoved ? last!.from : { file: p.file, rank: p.rank };
    g.position.copy(toWorld(start.file, start.rank));
    world.add(g);
    pieceAt.set(`${p.file}${p.rank}`, g);
    if (isMoved) moved = g;
  }
  // Highlight the move's squares with a raised tile tint (monochrome, like a board's own marker).
  const mark = (s: { file: number; rank: number }, strength: number) => {
    const t = tiles[s.file * 8 + s.rank]!;
    const m = (t.material as MeshStandardMaterial).clone();
    m.color.lerp(new Color(dark ? 0xffffff : 0x000000), strength);
    t.material = m;
  };

  // Camera: from the chosen side, raised. A little closer to the moved piece's file.
  const cam = new Vector3(0.0, 11.2, 10.4);
  camera.position.copy(cam);
  camera.lookAt(0, -0.6, 0);

  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = w / h; camera.updateProjectionMatrix();
    render();
  };
  const render = () => renderer.render(scene, camera);
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  let played = false;
  const play = () => {
    if (!moved || !last) return;
    const g = moved;
    const to = toWorld(last.to.file, last.to.rank);
    if (reduced) { g.position.copy(to); mark(last.from, 0.18); mark(last.to, 0.28); render(); return; }
    const tl = gsap.timeline({ onUpdate: render, onComplete: () => { mark(last.from, 0.18); mark(last.to, 0.28); render(); } });
    tl.to(g.position, { y: 0.35, duration: 0.35, ease: 'power2.out' }, 0.2)
      .to(g.position, { x: to.x, z: to.z, duration: 0.8, ease: 'power2.inOut' }, 0.35)
      .to(g.position, { y: 0, duration: 0.3, ease: 'power3.in' }, 1.05)
      .to(camera.position, { x: 1.1, y: cam.y - 0.6, duration: 1.8, ease: 'power2.inOut', onUpdate: () => camera.lookAt(0, -0.6, 0) }, 0.1);
  };
  const io = new IntersectionObserver(([e]) => {
    if (e && e.intersectionRatio >= 0.5 && !played) { played = true; io.disconnect(); setTimeout(play, 500); }
  }, { threshold: [0.5] });
  io.observe(container);
  container.addEventListener('click', () => {
    if (!moved || !last) return;
    tiles.forEach((t, i) => { t.material = (Math.floor(i / 8) + (i % 8)) % 2 === 0 ? darkSq : lightSq; });
    moved.position.copy(toWorld(last.from.file, last.from.rank));
    camera.position.copy(cam); camera.lookAt(0, -0.6, 0);
    render(); play();
  });

  return {
    replay: play,
    destroy() { ro.disconnect(); io.disconnect(); renderer.dispose(); renderer.domElement.remove(); container.querySelectorAll('img').forEach((img) => { img.hidden = false; }); },
  };
}
