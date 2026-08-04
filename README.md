# Marta Rosa — site

Site oficial da **Marta Rosa**, fadista, violista, letrista e compositora.
Conceito: **fado a céu aberto** — azul de azulejo de Lisboa contra luz de céu alto,
que é exatamente o caminho dela, da casa de fados ao Mainstage do Tomorrowland.

Primeira versão completa e navegável, já com o conteúdo real: discografia,
leitor do Spotify, vídeo oficial e imprensa. Faltam as fotografias — cada
caixa diz que imagem falta e em que tamanho.

## Como se abre

Não há passo de compilação. É HTML, CSS e módulos de JavaScript.

```bash
cd marta
python3 -m http.server 8787     # http://localhost:8787
```

Para as funções de `api/` (agenda, Instagram, booking):

```bash
npx vercel dev
```

## O que está cá dentro

```
index.html          uma página, com âncoras
css/site.css        um único ficheiro, com os tokens no topo
js/
  main.js           arranque: tema, pré-carregamento, língua, o resto
  ceu.js            o céu do hero — WebGL2 puro, sem bibliotecas
  movimento.js      cursor, botões magnéticos, revelação, fitas, rolo horizontal
  agenda.js         datas futuras, datas passadas, fita e pré-visualização
  conteudo.js       canais, discografia, vídeo, imprensa e a onda ambiente
  i18n.js           inglês (o português vive no HTML)
data/               instantâneos servidos ao browser
api/                funções da Vercel que mantêm os instantâneos frescos
fonts/              Bodoni Moda + Archivo (Open Font License)
```

## Desenho

| | |
|---|---|
| Papel | `#EEF5FC` — branco lavado de azul |
| Cobalto | `#1B4FA0` — azul de azulejo, faz a estrutura toda |
| Sol | `#D98A2B` — só bilhetes e "a seguir" |
| Tinta | `#08203A` — azul-noite |
| Display | Bodoni Moda, com o eixo ótico em 96 nos corpos grandes |
| Texto | Archivo variável; a largura desce a 72% nos rótulos de cartaz |

Tema claro e escuro. O escuro não é o claro invertido — é o céu à noite,
que é a hora a que ela canta num palco grande.

## Canais

`data/canais.json` é a fonte única dos links, e cada um tem um interruptor
`verificado`. **O site só mostra o que está a `true`** — um link para a conta
de outra pessoa é pior do que link nenhum.

Confirmados e no ar:

| Canal | Onde |
|---|---|
| Spotify | [artista `3GBKzMtAJzSPWInVpUajXR`](https://open.spotify.com/artist/3GBKzMtAJzSPWInVpUajXR) — é o leitor da secção *Ouvir* |
| YouTube | [disco de 2014 completo](https://www.youtube.com/playlist?list=OLAK5uy_lI-xDoFidDm-SD0nHAe7NYLw3i43mBb1U) + [vídeo oficial de *O Músico*](https://www.youtube.com/watch?v=INLKEtDv6Oo) |
| Deezer | [single *O Músico*](https://www.deezer.com/album/170200562) |
| TIDAL | [artista 5840953](https://tidal.com/artist/5840953) |
| Discogs | [CD de 2014](https://www.discogs.com/release/15318129-Marta-Rosa-Marta-Rosa) |

Por confirmar (ficam de fora do site até alguém dizer que sim):

- **Instagram** — não foi encontrado em pesquisa aberta. A secção do Instagram
  está fora do site até haver conta confirmada.
- **SoundCloud** — `soundcloud.com/idmartarosa` aparece nos resultados mas não
  foi possível abrir a página para confirmar que é ela.
- **Apple Music** — há uma Marta Rosa com o id `900930171`, mas o catálogo não
  bate certo (tem um tema latino de 2025).
- **Songkick**, **Bandsintown**, **Bandcamp** — sem perfil. O Bandcamp é o que
  mais rende na venda direta; vale a pena criar.

## Discografia (confirmada)

- **Marta Rosa** — *Discos do Povo, Vol. 16*, 2014. Estreia, depois de três
  meses de residência no Povo, no Cais do Sodré. Doze temas, metade fados
  tradicionais. Com António Cardoso (guitarra portuguesa), João Penedo (viola),
  Gabriel Codói (guitarra de sete cordas), Gustavo Roriz (viola caipira),
  João Nogueira (contrabaixo) e Luís Bastos (clarinete).
- **O Músico** — single, 2020. Letra dela, música de Carlos da Maia. Tem vídeo oficial.
- **Entretanto** — EP, 2020.

Faltam cinco títulos e todas as durações do disco de 2014.

## Dados e integrações

O browser lê sempre os ficheiros de `data/`. As funções de `api/` é que falam
com o mundo lá fora e mantêm esses ficheiros frescos. Assim nada na página
parte quando um serviço externo está em baixo.

| Serviço | Função | Variáveis de ambiente | Estado |
|---|---|---|---|
| Songkick | `api/agenda.js` | `SONGKICK_API_KEY`, `SONGKICK_ARTIST_ID` | chave pedida caso a caso, até 30 dias úteis de resposta |
| Instagram | `api/instagram.js` | `IG_TOKEN`, `IG_USER_ID` | exige conta de criador/empresa; a Basic Display API foi desligada a 4/12/2024 |
| Booking | `api/booking.js` | `BOOKING_EMAIL`, `RESEND_API_KEY`, `ONOFRIANA_HOOK` | funciona sem nada configurado (regista na consola) |
| Bandcamp | — | — | não tem API pública; entra por `iframe` oficial quando houver disco |

As tarefas periódicas estão em `vercel.json`: agenda de hora a hora, Instagram
uma vez por dia.

## Por fazer antes de publicar

- [ ] Fotografias reais (a lista está em cada placeholder, com dimensões)
- [ ] Os cinco títulos que faltam e as durações do disco de 2014
- [ ] Endereço do Instagram, para repor a secção
- [ ] Confirmar o SoundCloud e o Apple Music
- [ ] Perfil no Songkick reclamado + chave de API
- [ ] `og.jpg` para partilhas (1200 × 630)
- [ ] Domínio e ligação cruzada com o onofriana.pt

## Acessibilidade e desempenho

Sem bibliotecas, sem CDN: as fontes são servidas daqui. Todo o movimento
desliga com `prefers-reduced-motion`. O céu em WebGL pára quando sai do ecrã
ou o separador fica escondido, e cai para um gradiente se não houver WebGL.
Navegação por teclado com foco visível em tudo o que é interativo.

## Créditos

Tipos: [Bodoni Moda](https://fonts.google.com/specimen/Bodoni+Moda) e
[Archivo](https://fonts.google.com/specimen/Archivo), ambos sob SIL Open Font License.
Representação e produção: [Onofriana](https://onofriana.pt).
