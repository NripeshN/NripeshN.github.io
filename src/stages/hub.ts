// The hub-and-spoke graph: CrossGL in the middle, one spoke per target. The active spoke takes its
// language's colour and a dot travels hub → target; everything else stays ink on the stage.
// Loaded lazily (Three.js is the heaviest thing on the page) when the stage comes into view.
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, SphereGeometry, MeshBasicMaterial,
  BufferGeometry, Float32BufferAttribute, LineSegments, LineBasicMaterial, Color, Vector3,
} from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import gsap from 'gsap';

export interface Hub { focus(target: string): void; destroy(): void }

const LABELS: Record<string, string> = {
  metal: 'Metal', directx: 'HLSL', vulkan: 'SPIR-V', wgsl: 'WGSL', opengl: 'GLSL', cuda: 'CUDA',
  hip: 'HIP', slang: 'Slang', rust: 'Rust', mojo: 'Mojo', webgl: 'WebGL',
};
const HUE: Record<string, string> = {
  metal: '--lang-metal', directx: '--lang-hlsl', vulkan: '--lang-spirv', wgsl: '--lang-wgsl', opengl: '--lang-glsl',
  cuda: '--lang-cuda', hip: '--lang-hip', slang: '--lang-slang', rust: '--lang-rust', mojo: '--lang-mojo', webgl: '--lang-webgl',
};

export function createHub(container: HTMLElement, targets: string[], initial: string): Hub {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.documentElement);
  const hue = (t: string) => new Color(css.getPropertyValue(HUE[t] ?? '--stage-ink').trim() || '#ecebe6');
  const dim = new Color('#3b4049');
  const ink = new Color(css.getPropertyValue('--stage-ink').trim() || '#ecebe6');

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 4.9, 4.1);
  camera.lookAt(0, 0, 0.55);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer();
  labels.domElement.className = 'hub__labels';
  container.appendChild(labels.domElement);

  const group = new Group();
  group.rotation.x = 0;
  scene.add(group);

  const R = 2.05;
  const n = targets.length;
  const positions = targets.map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    return new Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
  });

  // Hub and nodes.
  const hubMesh = new Mesh(new SphereGeometry(0.13, 24, 16), new MeshBasicMaterial({ color: ink }));
  group.add(hubMesh);
  const nodeMats = targets.map(() => new MeshBasicMaterial({ color: dim }));
  const nodeGeo = new SphereGeometry(0.055, 16, 12);
  positions.forEach((p, i) => { const m = new Mesh(nodeGeo, nodeMats[i]); m.position.copy(p); group.add(m); });

  // Spokes, one line segment each, coloured per vertex.
  const linePos = new Float32Array(n * 6);
  const lineCol = new Float32Array(n * 6);
  positions.forEach((p, i) => { linePos.set([0, 0, 0, p.x, p.y, p.z], i * 6); });
  const lineGeo = new BufferGeometry();
  lineGeo.setAttribute('position', new Float32BufferAttribute(linePos, 3));
  lineGeo.setAttribute('color', new Float32BufferAttribute(lineCol, 3));
  const lines = new LineSegments(lineGeo, new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }));
  group.add(lines);

  // The dot that travels along the active spoke.
  const dot = new Mesh(new SphereGeometry(0.045, 12, 10), new MeshBasicMaterial({ color: ink }));
  group.add(dot);

  // Labels: CSS2D so the type stays crisp and in Archivo.
  const labelEls: HTMLDivElement[] = [];
  positions.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'hub__label';
    el.textContent = LABELS[targets[i]!] ?? targets[i]!;
    const obj = new CSS2DObject(el);
    obj.position.copy(p).multiplyScalar(1.17);
    obj.position.y -= 0.02;
    group.add(obj);
    labelEls.push(el);
  });
  const hubLabel = document.createElement('div');
  hubLabel.className = 'hub__label hub__label--hub';
  hubLabel.textContent = 'CrossGL';
  const hubObj = new CSS2DObject(hubLabel);
  hubObj.position.set(0, 0.32, 0);
  group.add(hubObj);

  let active = Math.max(0, targets.indexOf(initial));
  let activeColor = hue(targets[active]!);
  const paint = () => {
    const col = lineGeo.getAttribute('color') as Float32BufferAttribute;
    for (let i = 0; i < n; i++) {
      const c = i === active ? activeColor : dim;
      col.setXYZ(i * 2, c.r, c.g, c.b);
      col.setXYZ(i * 2 + 1, c.r, c.g, c.b);
      nodeMats[i]!.color.copy(i === active ? activeColor : dim);
      labelEls[i]!.classList.toggle('is-active', i === active);
      if (i === active) labelEls[i]!.style.color = `#${activeColor.getHexString()}`; else labelEls[i]!.style.color = '';
    }
    col.needsUpdate = true;
    (dot.material as MeshBasicMaterial).color.copy(activeColor);
  };
  paint();

  // Rotate so the active node faces the camera (+z).
  const targetRotation = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;
  const rot = { y: targetRotation(active) };
  group.rotation.y = rot.y;
  const turnTo = (i: number) => {
    let goal = targetRotation(i);
    const twoPi = Math.PI * 2;
    while (goal - rot.y > Math.PI) goal -= twoPi;
    while (rot.y - goal > Math.PI) goal += twoPi;
    if (reduced) { rot.y = goal; group.rotation.y = goal; render(); return; }
    gsap.to(rot, { y: goal, duration: 0.9, ease: 'power3.out', overwrite: true });
  };

  // Size and render.
  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(() => { resize(); render(); });
  ro.observe(container);
  resize();

  let raf = 0; let visible = false; let t0 = performance.now();
  const render = () => { renderer.render(scene, camera); labels.render(scene, camera); };
  const tick = () => {
    if (!visible || document.hidden || container.classList.contains('is-preview')) { raf = 0; return; }
    const t = (performance.now() - t0) / 1000;
    group.rotation.y = rot.y + (reduced ? 0 : Math.sin(t * 0.35) * 0.06);
    const u = (t * 0.55) % 1;
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    dot.position.copy(positions[active]!).multiplyScalar(e);
    (dot.material as MeshBasicMaterial).opacity = 1;
    render();
    raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(([en]) => { visible = !!en?.isIntersecting; if (visible && !raf) tick(); }, { rootMargin: '80px' });
  io.observe(container);
  if (reduced) { dot.position.copy(positions[active]!).multiplyScalar(0.6); render(); }

  return {
    focus(target: string) {
      const i = targets.indexOf(target);
      if (i < 0 || i === active) return;
      active = i;
      activeColor = hue(target);
      paint();
      turnTo(i);
      if (!visible) render();
    },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); container.innerHTML = ''; },
  };
}
