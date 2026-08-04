/* GET /api/instagram — as 8 publicações mais recentes.
 *
 * A Basic Display API foi desligada a 4 de dezembro de 2024. O caminho oficial
 * é a Instagram API com Instagram Login (Graph), que exige conta de criador ou
 * de empresa e um token de longa duração renovado de 60 em 60 dias.
 *
 * Variáveis de ambiente:
 *   IG_TOKEN    token de longa duração
 *   IG_USER_ID  id da conta profissional
 *
 * As imagens do Instagram vêm com URL assinado e curto — por isso o site
 * guarda-as e serve o instantâneo, em vez de depender do link expirar.
 */

const CAMPOS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

export default async function handler(req, res) {
  const token = process.env.IG_TOKEN;
  const utilizador = process.env.IG_USER_ID;

  if (!token || !utilizador) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    return res.status(200).json({ publicacoes: null, nota: 'IG_TOKEN por configurar' });
  }

  try {
    const url = `https://graph.instagram.com/v21.0/${utilizador}/media?fields=${CAMPOS}&limit=8&access_token=${token}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`instagram HTTP ${r.status}`);

    const dados = await r.json();
    const publicacoes = (dados.data || [])
      .filter((p) => p.media_type !== 'VIDEO' || p.thumbnail_url)
      .map((p) => ({
        id: p.id,
        url: p.permalink,
        imagem: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
        legenda: (p.caption || '').slice(0, 140),
        quando: p.timestamp,
      }));

    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json({ atualizado: new Date().toISOString(), publicacoes });
  } catch (erro) {
    console.error('instagram:', erro.message);
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(200).json({ publicacoes: null, erro: erro.message });
  }
}
