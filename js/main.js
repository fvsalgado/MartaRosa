/* Arranque. Pela ordem que importa: tema (para não piscar), pré-carregamento,
   língua, e só depois o que é caro — céu em WebGL, agenda, áudio. */

import { iniciarCeu } from './ceu.js';
import { cursor, partirTitulos, rolagem, fita, rolo, reduzido } from './movimento.js';
import { agenda, agendaLingua } from './agenda.js';
import { canais, ouvir, imprensa, onda } from './conteudo.js';
import { criarLingua } from './i18n.js';

/* ── tema ─────────────────────────────────────────────────── */
function tema() {
  const raiz = document.documentElement;
  const guardado = localStorage.getItem('mr-tema');
  const escuroSO = matchMedia('(prefers-color-scheme: dark)').matches;
  const inicial = guardado || (escuroSO ? 'escuro' : 'claro');
  raiz.dataset.tema = inicial;

  const bt = document.getElementById('btTema');
  const uso = document.getElementById('btTemaU');
  const pintarIcone = () => {
    const escuro = raiz.dataset.tema === 'escuro';
    uso?.setAttribute('href', escuro ? '#sol' : '#lua');
    bt?.setAttribute('aria-pressed', String(escuro));
  };
  pintarIcone();

  bt?.addEventListener('click', () => {
    raiz.dataset.tema = raiz.dataset.tema === 'escuro' ? 'claro' : 'escuro';
    localStorage.setItem('mr-tema', raiz.dataset.tema);
    pintarIcone();
    document.dispatchEvent(new CustomEvent('mr:tema'));
  });
}

/* ── pré-carregamento ─────────────────────────────────────── */
function carga() {
  const cx = document.getElementById('carga');
  const cont = document.getElementById('cargaCont');
  const barra = document.getElementById('cargaBarra');
  const nome = document.getElementById('cargaNome');
  if (!cx) return Promise.resolve();

  // o nome entra letra a letra
  if (nome && !reduzido) {
    nome.innerHTML = [...nome.textContent]
      .map((c, i) => `<i style="animation-delay:${i * 45}ms">${c === ' ' ? '&nbsp;' : c}</i>`)
      .join('');
  }

  return new Promise((resolve) => {
    let n = 0;
    const fim = () => {
      cx.classList.add('fora');
      document.documentElement.classList.remove('sem-rolar');
      document.body.classList.add('pronto');
      setTimeout(() => cx.remove(), 800);
      resolve();
    };

    document.documentElement.classList.add('sem-rolar');
    const passo = setInterval(() => {
      n = Math.min(100, n + Math.random() * 9 + 3);
      if (cont) cont.textContent = String(Math.round(n)).padStart(3, '0');
      if (barra) barra.style.width = `${n}%`;
      if (n >= 100) {
        clearInterval(passo);
        setTimeout(fim, reduzido ? 0 : 380);
      }
    }, reduzido ? 10 : 90);

    // rede de segurança: nunca deixar o ecrã de carga preso
    setTimeout(() => { clearInterval(passo); if (!cx.classList.contains('fora')) fim(); }, 4500);
  });
}

/* ── formulário ───────────────────────────────────────────── */
function formulario(lingua) {
  const form = document.getElementById('form');
  const msg = document.getElementById('formMsg');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.classList.remove('erro');

    if (!form.checkValidity()) {
      msg.textContent = lingua() === 'en' ? 'Fill in name, email and message.' : 'Falta o nome, o email ou a mensagem.';
      msg.classList.add('erro');
      form.reportValidity();
      return;
    }

    msg.textContent = lingua() === 'en' ? 'Sending…' : 'A enviar…';
    const corpo = Object.fromEntries(new FormData(form).entries());

    try {
      const r = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      form.reset();
      msg.textContent = lingua() === 'en'
        ? 'Received. We answer within two working days.'
        : 'Recebido. Respondemos em 48 horas úteis.';
    } catch {
      msg.classList.add('erro');
      msg.textContent = lingua() === 'en'
        ? 'Could not send. Write to fado@onofriana.pt and we sort it out.'
        : 'Não deu para enviar. Escreve para fado@onofriana.pt e resolvemos.';
    }
  });
}

/* ── arranque ─────────────────────────────────────────────── */
tema();
partirTitulos();
// cada letra do nome entra com o seu atraso
document.querySelectorAll('.nome__l').forEach((el, i) => el.style.setProperty('--i', i));

const i18n = criarLingua((l) => {
  agendaLingua(l);
  canais(l).then(() => { ouvir(l); imprensa(l); });
});

const ceu = iniciarCeu(document.getElementById('ceu'), { reduzido });
document.addEventListener('mr:tema', () => ceu.tema?.());

cursor();
rolagem();
rolo(document.getElementById('rolo'), document.getElementById('roloB'));
formulario(() => i18n.lingua());

onda(document.getElementById('onda'));

carga().then(async () => {
  agenda(i18n.lingua()).then(() => fita(document.getElementById('fita'), 0.45));
  // os canais vêm primeiro: é deles que sai o leitor da secção Ouvir
  await canais(i18n.lingua());
  ouvir(i18n.lingua());
  imprensa(i18n.lingua());
});
