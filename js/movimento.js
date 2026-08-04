/* Movimento partilhado: cursor desenhado, botões magnéticos, revelação ao
   rolar, paralaxe e o comportamento da barra de navegação. Tudo num único
   ciclo de animação — dois observadores e um rAF, não vinte. */

export const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── cursor ───────────────────────────────────────────────── */
export function cursor() {
  const el = document.getElementById('cur');
  if (!el || reduzido || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  const ponto = el.querySelector('.cur__p');
  const anel = el.querySelector('.cur__a');
  let x = innerWidth / 2, y = innerHeight / 2, ax = x, ay = y;

  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    document.body.classList.add('tem-cur');
  }, { passive: true });

  addEventListener('pointerleave', () => document.body.classList.remove('tem-cur'));

  const mag = [...document.querySelectorAll('[data-mag]')];
  mag.forEach((b) => {
    b.addEventListener('pointerenter', () => document.body.classList.add('cur-mag'));
    b.addEventListener('pointerleave', () => {
      document.body.classList.remove('cur-mag');
      b.style.transform = '';
    });
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
      b.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    });
  });

  (function ciclo() {
    ax += (x - ax) * 0.18;
    ay += (y - ay) * 0.18;
    ponto.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
    anel.style.translate = `${ax}px ${ay}px`;
    requestAnimationFrame(ciclo);
  })();
}

/* ── títulos: uma linha de cada vez ───────────────────────── */
export function partirTitulos() {
  document.querySelectorAll('.ani').forEach((h) => {
    if (h.dataset.partido === '1') return;
    const html = h.innerHTML;
    h.dataset.original = html;
    // uma linha só; o efeito é a linha inteira a subir da máscara
    h.innerHTML = `<span class="ani__l" style="--i:0">${html}</span>`;
    h.dataset.partido = '1';
  });
}

/* ── revelação + paralaxe + nav, num só rAF ───────────────── */
export function rolagem() {
  const nav = document.getElementById('nav');
  const alvos = [...document.querySelectorAll('.ani, .sobe-i, .sec, .cheia')];
  const par = [...document.querySelectorAll('[data-parallax]')];

  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  alvos.forEach((a) => obs.observe(a));

  // rede de segurança: saltos instantâneos (âncora, tecla Fim) não deixam nada por revelar
  const varrer = () => {
    const lim = innerHeight * 0.94;
    alvos.forEach((a) => { if (a.getBoundingClientRect().top < lim) a.classList.add('vis'); });
  };

  let ultimo = scrollY, pendente = false;

  function passo() {
    pendente = false;
    const y = scrollY;

    if (nav) {
      nav.classList.toggle('colada', y > 40);
      nav.classList.toggle('escondida', y > ultimo && y > 340);
    }
    ultimo = y;

    if (!reduzido) {
      par.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const meio = r.top + r.height / 2 - innerHeight / 2;
        el.style.translate = `0 ${(-meio * parseFloat(el.dataset.parallax)).toFixed(1)}px`;
      });
    }
  }

  addEventListener('scroll', () => {
    varrer();
    if (!pendente) { pendente = true; requestAnimationFrame(passo); }
  }, { passive: true });
  addEventListener('resize', passo, { passive: true });
  varrer();
  passo();
}

/* ── fitas infinitas (datas e Instagram) ──────────────────── */
export function fita(elemento, velocidade = 0.4) {
  if (!elemento || reduzido) return;
  const pista = elemento.firstElementChild;
  if (!pista) return;

  // duplica até cobrir duas vezes a largura visível
  const base = pista.innerHTML;
  let voltas = 1;
  while (pista.scrollWidth < elemento.offsetWidth * 2 && voltas < 8) {
    pista.innerHTML += base;
    voltas++;
  }

  const largura = pista.scrollWidth / 2;
  let x = 0, parado = false;

  elemento.addEventListener('pointerenter', () => { parado = true; });
  elemento.addEventListener('pointerleave', () => { parado = false; });

  (function ciclo() {
    if (!parado) {
      x -= velocidade;
      if (-x >= largura) x += largura;
      pista.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    }
    requestAnimationFrame(ciclo);
  })();
}

/* ── rolo horizontal com arrasto ──────────────────────────── */
export function rolo(elemento, barra) {
  if (!elemento) return;
  let a_arrastar = false, xInicio = 0, esqInicio = 0;

  elemento.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return; // o toque já rola sozinho
    a_arrastar = true;
    xInicio = e.clientX;
    esqInicio = elemento.scrollLeft;
    elemento.classList.add('arrasta');
    elemento.setPointerCapture(e.pointerId);
  });
  elemento.addEventListener('pointermove', (e) => {
    if (!a_arrastar) return;
    elemento.scrollLeft = esqInicio - (e.clientX - xInicio) * 1.35;
  });
  const largar = (e) => {
    if (!a_arrastar) return;
    a_arrastar = false;
    elemento.classList.remove('arrasta');
    if (e.pointerId != null && elemento.hasPointerCapture(e.pointerId)) elemento.releasePointerCapture(e.pointerId);
  };
  elemento.addEventListener('pointerup', largar);
  elemento.addEventListener('pointercancel', largar);

  // roda do rato vertical → deslocamento horizontal
  elemento.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const antes = elemento.scrollLeft;
    elemento.scrollLeft += e.deltaY;
    if (elemento.scrollLeft !== antes) e.preventDefault();
  }, { passive: false });

  if (barra) {
    const pintar = () => {
      const max = elemento.scrollWidth - elemento.clientWidth;
      const p = max > 0 ? elemento.scrollLeft / max : 0;
      barra.style.transform = `translateX(${(p * (100 / 0.22 - 100) * 0.22).toFixed(2)}%)`;
    };
    elemento.addEventListener('scroll', pintar, { passive: true });
    addEventListener('resize', pintar, { passive: true });
    pintar();
  }
}
