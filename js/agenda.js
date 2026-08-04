/* Agenda: lê /data/agenda.json (que a função /api/agenda mantém fresco a
   partir do Songkick) e desenha as datas, a fita do topo e a pré-visualização
   que segue o cursor. Se o pedido falhar, mostra-se o erro em vez de uma
   lista vazia — uma agenda em branco é pior do que dizer que houve problema. */

import { reduzido } from './movimento.js';

const MESES = {
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  en: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
};

const SELOS = {
  esgotado: { pt: 'Esgotado', en: 'Sold out' },
  breve: { pt: 'Em breve', en: 'Soon' },
};

const BILHETES = { pt: 'Bilhetes', en: 'Tickets' };

/* Não repetir a cidade quando o título já a diz ("Fado em Lisboa · Lisboa"). */
const semRepetir = (ev) => (ev.titulo[lingua].includes(ev.cidade) ? '' : ` · ${ev.cidade}`);

let eventos = [];   // o que ainda está para vir
let passados = [];  // o que acabou de acontecer
let lingua = 'pt';

function linhaData(ev) {
  const d = new Date(ev.data + 'T12:00:00Z');
  // sem dia marcado, o mês passa a ser o número grande — "—" não diz nada a ninguém
  const dia = ev.semDia
    ? MESES[lingua][d.getUTCMonth()].toUpperCase()
    : String(d.getUTCDate()).padStart(2, '0');
  const mes = ev.semDia
    ? String(d.getUTCFullYear())
    : `${MESES[lingua][d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
  const local = `${ev.cidade}, ${ev.pais[lingua]}`;
  const detalhe = ev.detalhe?.[lingua] ? ` · ${ev.detalhe[lingua]}` : '';

  const art = document.createElement('article');
  art.className = 'data sobe-i';
  art.dataset.id = ev.id;
  art.innerHTML = `
    <div class="data__d">
      <span class="data__dia num">${dia}</span>
      <span class="data__mes num">${mes}</span>
    </div>
    <div class="data__q">
      <h3 class="data__t">${ev.titulo[lingua]}</h3>
      <p class="data__l">${local}${detalhe}</p>
    </div>
    <div class="data__a"></div>`;

  const acao = art.querySelector('.data__a');
  if (ev.estado === 'bilhetes' && ev.bilhetes) {
    const a = document.createElement('a');
    a.className = 'cap data__bt';
    a.href = ev.bilhetes;
    a.rel = 'noopener';
    a.target = '_blank';
    a.dataset.mag = '';
    a.innerHTML = `<span>${BILHETES[lingua]}</span>`;
    acao.append(a);
  } else if (SELOS[ev.estado]) {
    const s = document.createElement('span');
    s.className = `selo selo--${ev.estado}`;
    s.textContent = SELOS[ev.estado][lingua];
    acao.append(s);
  }
  return art;
}

/* Datas passadas: uma linha compacta, sem botão de bilhetes. Com o Tomorrowland
   acabado de acontecer, isto é currículo — e é o que convence quem programa. */
function linhaPassada(ev) {
  const d = new Date(ev.data + 'T12:00:00Z');
  const quando = `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[lingua][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  const li = document.createElement('li');
  li.className = 'passada';
  li.innerHTML = `
    <span class="passada__d num">${quando}</span>
    <span class="passada__t">${ev.titulo[lingua]}</span>
    <span class="passada__l">${ev.cidade}, ${ev.pais[lingua]}</span>`;
  return li;
}

function fitaHtml() {
  const azulejo = '<svg aria-hidden="true"><use href="#azulejo"/></svg>';
  // sem datas marcadas, a fita passa a ser assinatura em vez de ficar vazia
  if (!eventos.length) {
    const frase = lingua === 'en'
      ? 'MARTA ROSA · FADO A CÉU ABERTO · NEW DATES SOON · BOOKING FADO@ONOFRIANA.PT'
      : 'MARTA ROSA · FADO A CÉU ABERTO · DATAS NOVAS EM BREVE · BOOKING FADO@ONOFRIANA.PT';
    return `<span class="fita__i">${frase} ${azulejo}</span>`.repeat(3);
  }
  return eventos
    .map((ev) => {
      const d = new Date(ev.data + 'T12:00:00Z');
      const quando = ev.semDia
        ? MESES[lingua][d.getUTCMonth()]
        : `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[lingua][d.getUTCMonth()]}`;
      return `<span class="fita__i"><b>${quando}</b> ${ev.titulo[lingua]}${semRepetir(ev)} ${azulejo}</span>`;
    })
    .join('');
}

function espreitar(lista) {
  const cx = document.getElementById('espreita');
  if (!cx || reduzido || matchMedia('(pointer:coarse)').matches) return;
  const rotulo = document.getElementById('espreitaT');
  let x = 0, y = 0, ax = 0, ay = 0, ligado = false;

  lista.querySelectorAll('.data').forEach((linha) => {
    linha.addEventListener('pointerenter', () => {
      linha.classList.add('tocada');
      cx.classList.add('vis');
      ligado = true;
      const ev = eventos.find((e) => e.id === linha.dataset.id);
      if (rotulo && ev) rotulo.textContent = `${ev.cidade.toUpperCase()} · 1200 × 800`;
    });
    linha.addEventListener('pointerleave', () => {
      linha.classList.remove('tocada');
      cx.classList.remove('vis');
      ligado = false;
    });
  });

  lista.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });

  (function ciclo() {
    if (ligado) {
      ax += (x - ax) * 0.14;
      ay += (y - ay) * 0.14;
      cx.style.translate = `${ax.toFixed(1)}px ${ay.toFixed(1)}px`;
    } else {
      ax = x; ay = y;
    }
    requestAnimationFrame(ciclo);
  })();
}

function pintar() {
  const lista = document.getElementById('datas');
  if (!lista) return;

  lista.textContent = '';
  if (eventos.length) {
    eventos.forEach((ev) => lista.append(linhaData(ev)));
    espreitar(lista);
  } else {
    const p = document.createElement('p');
    p.className = 'datas__vazio';
    p.textContent = lingua === 'en'
      ? 'No dates on sale right now. Follow on Songkick and you hear first.'
      : 'Sem datas à venda de momento. Segue no Songkick e ficas a saber primeiro.';
    lista.append(p);
  }
  lista.dataset.estado = 'pronto';

  const cxPassadas = document.getElementById('recentes');
  const listaPassadas = document.getElementById('passadas');
  if (cxPassadas && listaPassadas) {
    listaPassadas.textContent = '';
    passados.forEach((ev) => listaPassadas.append(linhaPassada(ev)));
    cxPassadas.hidden = passados.length === 0;
  }

  const t = document.getElementById('fitaT');
  if (t) t.innerHTML = fitaHtml();

  pintarProximo();
}

/* A pastilha do hero: o que vem a seguir, ou o que acabou de acontecer. */
function pintarProximo() {
  const cx = document.getElementById('prox');
  const alvo = document.getElementById('proxQ');
  const rotulo = cx?.querySelector('[data-t="prox"]');
  if (!cx || !alvo) return;

  const seguinte = eventos[0];
  if (seguinte) {
    const d = new Date(seguinte.data + 'T12:00:00Z');
    const quando = seguinte.semDia
      ? `${MESES[lingua][d.getUTCMonth()].toUpperCase()} ${d.getUTCFullYear()}`
      : `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[lingua][d.getUTCMonth()].toUpperCase()} ${d.getUTCFullYear()}`;
    alvo.textContent = `${quando} · ${seguinte.titulo[lingua]}${semRepetir(seguinte)}`;
    if (rotulo) rotulo.textContent = lingua === 'en' ? 'Up next' : 'A seguir';
    return;
  }

  const ultimo = passados[0];
  if (ultimo) {
    const d = new Date(ultimo.data + 'T12:00:00Z');
    alvo.textContent = `${ultimo.titulo[lingua]}${semRepetir(ultimo)} · ${MESES[lingua][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    if (rotulo) rotulo.textContent = lingua === 'en' ? 'Just played' : 'Acabou de tocar';
  } else {
    cx.hidden = true;
  }
}

export async function agenda(lang) {
  lingua = lang;
  const lista = document.getElementById('datas');
  try {
    const r = await fetch('/data/agenda.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const dados = await r.json();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const todos = dados.eventos || [];
    const futuro = (e) => new Date(e.data + 'T23:59:59Z') >= hoje;

    eventos = todos.filter(futuro).sort((a, b) => a.data.localeCompare(b.data));
    passados = todos
      .filter((e) => !futuro(e))
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 6);

    pintar();
  } catch (err) {
    console.warn('agenda:', err);
    lista.innerHTML = `<p class="datas__vazio">${lingua === 'en'
      ? 'Could not load the dates. Try again in a moment.'
      : 'Não foi possível carregar as datas. Tenta daqui a pouco.'}</p>`;
  }
}

export function agendaLingua(lang) {
  lingua = lang;
  if (eventos.length || passados.length) pintar();
}
