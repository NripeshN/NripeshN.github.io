// Runs the hero shader. The GLSL ES is CrossTL's own output for lanes.cgl (content/targets/lanes.webgl.txt),
// split into its two stages by the #ifdef guards CrossTL emits (WebGL reserves GL_* macro names, so the
// browser cannot define them itself). Nothing in the shader text is edited.
import source from '../../content/targets/lanes.webgl.txt?raw';

export function splitStages(src: string): { vertex: string; fragment: string } {
  const pick = (keep: string) => {
    let inside: string | null = null;
    return src
      .split('\n')
      .filter((line) => {
        const m = line.match(/^#ifdef (GL_VERTEX_SHADER|GL_FRAGMENT_SHADER)/);
        if (m) { inside = m[1]!; return false; }
        if (/^#endif/.test(line) && inside) { inside = null; return false; }
        return inside === null || inside === keep;
      })
      .join('\n');
  };
  return { vertex: pick('GL_VERTEX_SHADER'), fragment: pick('GL_FRAGMENT_SHADER') };
}

export interface Lanes { setSource(glsl: string): void; stop(): void }

export function startLanes(canvas: HTMLCanvasElement, initial: string = source): Lanes | null {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'low-power' });
  if (!gl) return null;
  let prog: WebGLProgram;
  let ubo: WebGLBuffer;

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(sh) ?? 'shader'; gl.deleteShader(sh); throw new Error(log); }
    return sh;
  };
  // Builds a program from CrossTL's WebGL output and binds its Uniforms block to slot 0.
  const build = (glsl: string): WebGLProgram => {
    const { vertex, fragment } = splitStages(glsl);
    const p = gl.createProgram()!;
    const vs = compile(gl.VERTEX_SHADER, vertex);
    const fs = compile(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(p, vs); gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { const log = gl.getProgramInfoLog(p) ?? 'link'; gl.deleteProgram(p); throw new Error(log); }
    const idx = gl.getUniformBlockIndex(p, 'Uniforms');
    if (idx === 0xffffffff) { gl.deleteProgram(p); throw new Error('no Uniforms block'); }
    gl.uniformBlockBinding(p, idx, 0);
    return p;
  };
  prog = build(initial);
  gl.useProgram(prog);

  // One triangle covers the viewport; a_pos is @location(0) in lanes.cgl.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // cbuffer Uniforms { float u_time; vec2 u_resolution; } — std140: float at 0, vec2 at 8.
  ubo = gl.createBuffer()!;
  const block = new Float32Array(4);
  gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
  gl.bufferData(gl.UNIFORM_BUFFER, block, gl.DYNAMIC_DRAW);
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, ubo);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  };
  const draw = (t: number) => {
    block[0] = t; block[2] = canvas.width; block[3] = canvas.height;
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, block);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0; let visible = true; let start = performance.now();
  const ro = new ResizeObserver(() => { resize(); if (reduced) draw(12); });
  ro.observe(canvas);
  resize();
  const setSource = (glsl: string) => {
    const next = build(glsl); // throws on a bad shader; the old program keeps running
    gl.deleteProgram(prog); prog = next; gl.useProgram(prog);
    if (reduced) draw(12);
  };
  if (reduced) { draw(12); return { setSource, stop: () => ro.disconnect() }; }

  const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; if (visible && !raf) loop(); });
  io.observe(canvas);
  const loop = () => {
    if (!visible || document.hidden) { raf = 0; return; }
    draw((performance.now() - start) / 1000);
    raf = requestAnimationFrame(loop);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) { start = performance.now() - block[0]! * 1000; loop(); } });
  loop();
  return { setSource, stop: () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); } };
}
