/* POST /api/booking — pedido de contratação.
 *
 * Valida, trava spam e entrega. A entrega fica de propósito num sítio só
 * (enviar()), para se ligar ao CRM da Onofriana sem mexer no resto.
 *
 * Variáveis de ambiente:
 *   BOOKING_EMAIL     destino (por omissão fado@onofriana.pt)
 *   RESEND_API_KEY    envio de email
 *   ONOFRIANA_HOOK    webhook opcional que cria o pedido no CRM
 */

const DESTINO = process.env.BOOKING_EMAIL || 'fado@onofriana.pt';
const TIPOS = new Set(['Sala, teatro ou festival', 'Programação cultural', 'Evento privado', 'Outro',
  'Venue, theatre or festival', 'Cultural programming', 'Private event', 'Other']);

/* limite simples por IP: 5 pedidos por hora, em memória da instância */
const visto = new Map();
function demasiados(ip) {
  const agora = Date.now();
  const janela = 60 * 60 * 1000;
  const lista = (visto.get(ip) || []).filter((t) => agora - t < janela);
  lista.push(agora);
  visto.set(ip, lista);
  if (visto.size > 5000) visto.clear();
  return lista.length > 5;
}

const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

async function enviar(pedido) {
  const linhas = [
    `Nome: ${pedido.nome}`,
    `Email: ${pedido.email}`,
    `Tipo: ${pedido.tipo}`,
    `Data prevista: ${pedido.data || '—'}`,
    '',
    pedido.mensagem,
  ].join('\n');

  if (process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Site da Marta <site@martarosa.pt>',
        to: [DESTINO],
        reply_to: pedido.email,
        subject: `Booking · ${pedido.nome} · ${pedido.data || 'sem data'}`,
        text: linhas,
      }),
      signal: AbortSignal.timeout(8000),
    });
  }

  if (process.env.ONOFRIANA_HOOK) {
    await fetch(process.env.ONOFRIANA_HOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origem: 'site-marta', ...pedido }),
      signal: AbortSignal.timeout(8000),
    });
  }

  if (!process.env.RESEND_API_KEY && !process.env.ONOFRIANA_HOOK) {
    console.log('[booking · sem destino configurado]\n' + linhas);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'método não permitido' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconhecido';
  if (demasiados(ip)) return res.status(429).json({ erro: 'demasiados pedidos' });

  const c = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

  // campo-armadilha: preenchido = robô
  if (texto(c.empresa, 50)) return res.status(200).json({ ok: true });

  const pedido = {
    nome: texto(c.nome, 120),
    email: texto(c.email, 160),
    tipo: TIPOS.has(texto(c.tipo, 60)) ? texto(c.tipo, 60) : 'Outro',
    data: texto(c.data, 20),
    mensagem: texto(c.mensagem, 4000),
  };

  if (!pedido.nome || !emailValido(pedido.email) || pedido.mensagem.length < 10) {
    return res.status(400).json({ erro: 'dados incompletos' });
  }

  try {
    await enviar(pedido);
    return res.status(200).json({ ok: true });
  } catch (erro) {
    console.error('booking:', erro.message);
    return res.status(502).json({ erro: 'não foi possível entregar o pedido' });
  }
}
