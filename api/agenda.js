/* GET /api/agenda — datas do Songkick, guardadas e servidas daqui.
 *
 * Porquê passar por aqui e não chamar o Songkick do browser: a chave de API
 * não pode ir no bundle público, o Songkick não devolve CORS, e assim o site
 * continua a mostrar a última agenda boa mesmo quando eles estão em baixo.
 *
 * Variáveis de ambiente (Vercel → Settings → Environment Variables):
 *   SONGKICK_API_KEY   chave atribuída pelo Songkick
 *   SONGKICK_ARTIST_ID id numérico do perfil da Marta
 *
 * Sem chave configurada, devolve o instantâneo em /data/agenda.json — que é
 * exatamente o que o site mostra hoje.
 */

const CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400';

const PAISES_PT = { Belgium: 'Bélgica', Portugal: 'Portugal', Spain: 'Espanha', France: 'França', Netherlands: 'Países Baixos' };

function converter(evento) {
  const inicio = evento.start?.date;
  if (!inicio) return null;
  const local = evento.venue?.metroArea || {};
  const pais = local.country?.displayName || '';
  return {
    id: `sk-${evento.id}`,
    data: inicio,
    titulo: { pt: evento.displayName, en: evento.displayName },
    detalhe: { pt: evento.venue?.displayName || '', en: evento.venue?.displayName || '' },
    cidade: local.displayName || '',
    pais: { pt: PAISES_PT[pais] || pais, en: pais },
    estado: evento.status === 'cancelled' ? 'breve' : 'bilhetes',
    bilhetes: evento.uri || null,
  };
}

export default async function handler(req, res) {
  const chave = process.env.SONGKICK_API_KEY;
  const artista = process.env.SONGKICK_ARTIST_ID;

  if (!chave || !artista) {
    res.setHeader('Cache-Control', CACHE);
    return res.status(200).json({ fonte: 'instantâneo', eventos: null, nota: 'SONGKICK_API_KEY por configurar' });
  }

  try {
    const url = `https://api.songkick.com/api/3.0/artists/${artista}/calendar.json?apikey=${chave}&per_page=50`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`songkick HTTP ${r.status}`);

    const dados = await r.json();
    const eventos = (dados.resultsPage?.results?.event || []).map(converter).filter(Boolean);

    res.setHeader('Cache-Control', CACHE);
    return res.status(200).json({ atualizado: new Date().toISOString(), fonte: 'songkick', eventos });
  } catch (erro) {
    // falhar em silêncio para o utilizador: o site fica com o instantâneo
    console.error('agenda:', erro.message);
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(200).json({ fonte: 'instantâneo', eventos: null, erro: erro.message });
  }
}
