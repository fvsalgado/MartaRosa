/* Conteúdo que vem dos JSON: canais, discografia, vídeo e imprensa.
   Regra que atravessa este ficheiro: só entra na página o que está
   confirmado. Um link para a conta de outra pessoa é pior do que link
   nenhum — por isso `canais.json` tem um interruptor `verificado`. */

import { reduzido } from './movimento.js';

let CANAIS = [];
let lingua = 'pt';

async function ler(caminho) {
  const r = await fetch(caminho, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${caminho}: HTTP ${r.status}`);
  return r.json();
}

/* ── canais ───────────────────────────────────────────────── */
export async function canais(lang) {
  lingua = lang;
  try {
    CANAIS = (await ler('/data/canais.json')).canais.filter((c) => c.verificado && c.url);
  } catch (e) {
    console.warn('canais:', e.message);
    CANAIS = [];
  }

  const cx = document.getElementById('plats');
  if (cx) {
    cx.innerHTML = CANAIS.map((c) => `
      <a class="plat" href="${c.url}" target="_blank" rel="noopener" data-mag>
        <span class="plat__n">${c.nome}</span>
        <span class="plat__s">${c.descricao[lingua]}</span>
        <span class="plat__a" aria-hidden="true">↗</span>
      </a>`).join('');
  }

  const pe = document.getElementById('peCanais');
  if (pe) {
    pe.innerHTML = CANAIS.map((c) => `<li><a href="${c.url}" target="_blank" rel="noopener" data-mag>${c.nome}</a></li>`).join('');
  }
  return CANAIS;
}

/* ── ouvir: leitor oficial + discografia ──────────────────── */
export async function ouvir(lang) {
  lingua = lang;
  let disco;
  try {
    disco = await ler('/data/disco.json');
  } catch (e) {
    console.warn('disco:', e.message);
    return;
  }

  // leitor: o embed do Spotify toca a sério, não é figura de estilo
  const spotify = (CANAIS.find((c) => c.chave === 'spotify') || {}).embed;
  const leitor = document.getElementById('leitor');
  if (leitor && spotify) {
    const f = document.createElement('iframe');
    f.src = spotify;
    f.title = 'Marta Rosa no Spotify';
    f.loading = 'lazy';
    f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    f.setAttribute('frameborder', '0');
    f.className = 'leitor__f';
    leitor.append(f);
  }

  const lista = document.getElementById('lancamentos');
  if (lista) {
    lista.innerHTML = (disco.lancamentos || []).map((l) => `
      <li class="lanc">
        <a class="lanc__a" href="${l.url}" target="_blank" rel="noopener" data-mag>
          <span class="lanc__ano num">${l.ano}</span>
          <span class="lanc__q">
            <span class="lanc__t">${l.titulo}</span>
            <span class="lanc__s">${l.tipo[lingua]}${l.creditos[lingua] ? ` · ${l.creditos[lingua]}` : ''}</span>
          </span>
          <span class="lanc__i" aria-hidden="true">↗</span>
        </a>
      </li>`).join('');
  }

  // ficha do disco de estreia
  const ficha = document.getElementById('ficha');
  if (ficha && disco.principal) {
    const p = disco.principal;
    const porConfirmar = lingua === 'en' ? 'and five more to confirm' : 'e mais cinco por confirmar';
    ficha.innerHTML = `
      <p class="rot">${p.colecao} · ${p.ano}</p>
      <p class="ficha__s">${p.sobre[lingua]}</p>
      <p class="ficha__f"><b>${lingua === 'en' ? 'Tracks' : 'Temas'}:</b> ${p.faixas.join(' · ')}${p.faixasCompletas ? '' : ` · ${porConfirmar}`}</p>
      <p class="ficha__f"><b>${lingua === 'en' ? 'With' : 'Com'}:</b> ${p.musicos.join(' · ')}</p>`;
  }

  video(disco);
}

/* ── vídeo: só carrega o YouTube depois do clique ─────────── */
function video(disco) {
  const cx = document.getElementById('video');
  if (!cx) return;
  const com = (disco.lancamentos || []).find((l) => l.video);
  if (!com) return;

  cx.innerHTML = `
    <button class="video__bt" type="button" aria-label="${lingua === 'en' ? 'Play the video' : 'Ver o vídeo'}">
      <img class="video__img" src="https://i.ytimg.com/vi/${com.video}/maxresdefault.jpg" alt="" loading="lazy" onerror="this.remove()" />
      <span class="video__seta" aria-hidden="true">▶</span>
    </button>`;

  cx.querySelector('.video__bt').addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${com.video}?autoplay=1&rel=0`;
    f.title = `Marta Rosa — ${com.titulo}`;
    f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.setAttribute('frameborder', '0');
    cx.textContent = '';
    cx.append(f);
  });
}

/* ── imprensa ─────────────────────────────────────────────── */
export async function imprensa(lang) {
  lingua = lang;
  let dados;
  try {
    dados = await ler('/data/imprensa.json');
  } catch (e) {
    console.warn('imprensa:', e.message);
    return;
  }

  const cits = document.getElementById('citacoes');
  if (cits) {
    cits.innerHTML = (dados.citacoes || []).map((c) => `
      <blockquote class="cit">
        <p class="cit__t">${c.texto[lingua]}</p>
        <span class="cit__f">${c.quem} · ${c.onde}, ${typeof c.quando === 'string' ? c.quando : c.quando[lingua]}</span>
      </blockquote>`).join('');
  }

  const pecas = document.getElementById('pecas');
  if (pecas) {
    pecas.innerHTML = (dados.pecas || []).map((p) => `
      <li class="peca">
        <a href="${p.url}" target="_blank" rel="noopener" data-mag>
          <span class="peca__o">${p.onde}</span>
          <span class="peca__t">${p.titulo}</span>
          <span class="peca__a num">${p.ano}</span>
        </a>
      </li>`).join('');
  }
}

/* ── onda ambiente por baixo do leitor ────────────────────── */
export function onda(canvas) {
  if (!canvas) return;
  const c2d = canvas.getContext('2d');
  const cor = () => getComputedStyle(document.documentElement).getPropertyValue('--cobalto').trim() || '#1B4FA0';

  function medir() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  medir();
  addEventListener('resize', medir, { passive: true });

  let t = 0;
  (function ciclo() {
    requestAnimationFrame(ciclo);
    if (document.hidden) return;

    const L = canvas.width, A = canvas.height;
    c2d.clearRect(0, 0, L, A);

    const barras = Math.max(24, Math.floor(L / 6));
    const larg = L / barras;
    c2d.fillStyle = cor();
    t += reduzido ? 0 : 0.02;

    for (let i = 0; i < barras; i++) {
      // repouso: uma onda lenta, com o desenho de uma forma de onda
      {
        const f = i / barras;
        var v = 0.18 + 0.16 * Math.sin(f * 9 + t) * Math.sin(f * 3.1 - t * 0.6) + 0.06 * Math.sin(f * 21 + t * 1.7);
      }
      const h = Math.max(1, v * A * 0.9);
      c2d.globalAlpha = 0.25 + v * 0.75;
      c2d.fillRect(i * larg, (A - h) / 2, Math.max(1, larg - 1.5), h);
    }
    c2d.globalAlpha = 1;
  })();
}
