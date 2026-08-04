/* Céu do hero — WebGL puro, sem bibliotecas.
   Um campo de nuvens em ruído fractal que anda devagar, com a luz a vir de
   um ponto que segue o rato. Pausa quando sai do ecrã ou o separador fica
   escondido; se não houver WebGL, o CSS do fundo trata do assunto. */

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 cor;
uniform vec2  uTam;
uniform float uT;
uniform vec2  uRato;
uniform vec3  uAlto;    // céu no topo
uniform vec3  uBaixo;   // céu junto ao horizonte
uniform vec3  uNuvem;
uniform vec3  uLuz;
uniform float uEscuro;

float ruido(vec2 x){
  vec2 i = floor(x), f = fract(x);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 x){
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 6; i++){
    v += a * ruido(x);
    x = rot * x * 2.02;
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uTam;
  float prop = uTam.x / max(uTam.y, 1.0);
  vec2 q = vec2(uv.x * prop, uv.y);

  // três camadas a velocidades diferentes: dá profundidade sem custo
  float t = uT * 0.014;
  float n1 = fbm(q * 2.4 + vec2(t, t * 0.25));
  float n2 = fbm(q * 4.8 + vec2(-t * 1.7, n1 * 0.6));
  float n3 = fbm(q * 9.0 + vec2(t * 2.6, -t * 0.8));
  float nuvens = smoothstep(0.30, 0.80, n1 * 0.62 + n2 * 0.28 + n3 * 0.10);

  // gradiente de céu, mais claro em baixo
  vec3 ceu = mix(uBaixo, uAlto, pow(uv.y, 0.85));

  // luz: segue o rato, com queda suave
  vec2 luzP = vec2(uRato.x * prop, uRato.y);
  float d = distance(q, luzP);
  float halo = exp(-d * d * 4.2);
  // no claro a luz é um toque; no escuro é ela que dá o céu de noite
  ceu += uLuz * halo * (0.15 + 0.4 * uEscuro);

  // nuvens iluminadas do lado da luz
  float lado = clamp(1.0 - d * 0.9, 0.0, 1.0);
  vec3 c = mix(ceu, uNuvem, nuvens * (0.55 + 0.45 * lado));

  // esbatimento em baixo, para o conteúdo respirar
  c = mix(c, uBaixo, smoothstep(0.46, 0.02, uv.y) * 0.82);

  // vinheta discreta
  float vin = smoothstep(1.25, 0.35, distance(uv, vec2(0.5)));
  c *= 0.86 + 0.14 * vin;

  cor = vec4(c, 1.0);
}`;

const hex = (s) => {
  const v = s.trim().replace('#', '');
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
};

function compilar(gl, tipo, fonte) {
  const s = gl.createShader(tipo);
  gl.shaderSource(s, fonte);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('shader:', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

export function iniciarCeu(canvas, { reduzido = false } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) {
    canvas.style.background = 'linear-gradient(180deg, var(--ceu), var(--papel))';
    return { destruir() {} };
  }

  const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
  const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return { destruir() {} };

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (n) => gl.getUniformLocation(prog, n);
  const uTam = u('uTam'), uT = u('uT'), uRato = u('uRato');
  const uAlto = u('uAlto'), uBaixo = u('uBaixo'), uNuvem = u('uNuvem'), uLuz = u('uLuz'), uEscuro = u('uEscuro');

  const rato = { x: 0.5, y: 0.62 };
  const alvo = { x: 0.5, y: 0.62 };
  let paleta = null;

  function lerPaleta() {
    const e = getComputedStyle(document.documentElement);
    const escuro = document.documentElement.dataset.tema === 'escuro';
    // o topo é céu a sério, não o azul lavado do resto do site: é o que faz
    // as nuvens lerem-se e o nome recortar-se por cima
    paleta = {
      alto: hex(escuro ? '#0B2A48' : '#5D9CD6'),
      baixo: hex(e.getPropertyValue('--papel') || '#EEF5FC'),
      nuvem: hex(escuro ? '#1A4A79' : '#FFFFFF'),
      luz: hex(escuro ? '#2A6296' : '#FFF3DC'),
      escuro: escuro ? 1 : 0,
    };
  }
  lerPaleta();

  let larg = 0, alt = 0;
  function medir() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const r = canvas.getBoundingClientRect();
    larg = Math.max(1, Math.round(r.width * dpr));
    alt = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== larg || canvas.height !== alt) {
      canvas.width = larg;
      canvas.height = alt;
      gl.viewport(0, 0, larg, alt);
    }
  }

  const aoRato = (e) => {
    alvo.x = e.clientX / window.innerWidth;
    alvo.y = 1 - e.clientY / window.innerHeight;
  };
  window.addEventListener('pointermove', aoRato, { passive: true });

  let visivel = true;
  const obs = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }, { threshold: 0 });
  obs.observe(canvas);

  let corre = true, inicio = performance.now(), pedido = 0;

  function quadro(agora) {
    pedido = requestAnimationFrame(quadro);
    if (!corre || !visivel || document.hidden) return;

    rato.x += (alvo.x - rato.x) * 0.045;
    rato.y += (alvo.y - rato.y) * 0.045;

    medir();
    gl.uniform2f(uTam, larg, alt);
    gl.uniform1f(uT, reduzido ? 0 : (agora - inicio) / 1000);
    gl.uniform2f(uRato, rato.x, rato.y);
    gl.uniform3fv(uAlto, paleta.alto);
    gl.uniform3fv(uBaixo, paleta.baixo);
    gl.uniform3fv(uNuvem, paleta.nuvem);
    gl.uniform3fv(uLuz, paleta.luz);
    gl.uniform1f(uEscuro, paleta.escuro);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  pedido = requestAnimationFrame(quadro);

  return {
    tema: lerPaleta,
    destruir() {
      corre = false;
      cancelAnimationFrame(pedido);
      obs.disconnect();
      window.removeEventListener('pointermove', aoRato);
    },
  };
}
