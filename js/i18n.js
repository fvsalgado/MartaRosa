/* Português e inglês. O português é o que está no HTML — não se repete aqui,
   lê-se do DOM ao carregar. Só o inglês vive neste ficheiro. */

export const EN = {
  nav1: 'Shows', nav2: 'Listen', nav3: 'Watch', nav4: 'Who she is', nav5: 'Press',
  btbook: 'Booking',
  hero_rot: 'Fado singer · Viola de fado · Songwriter',
  hero_frase: 'Rooted fado, sung under open sky. From Lisbon’s fado houses to the Tomorrowland Mainstage.',
  prox: 'Up next',
  ph1: 'Opening photograph: Marta on stage, wide shot, with sky or high light behind her',
  cheia_leg: 'Tomorrowland Mainstage · July 2026',

  ag_rot: 'Shows', ag_tit: 'Where she <span class="it">sings</span> next',
  ag_txt: 'The list comes from Songkick and updates itself. Hover over any date.',
  ag_carregar: 'Loading shows…', seguir: 'Follow on Songkick',
  ag_passou: 'Just played',

  ou_rot: 'Listen', ou_tit: 'The voice, <span class="it">first</span>',
  ou_txt: 'It plays right here, start to finish. The debut came in 2014, at Povo, in Cais do Sodré.',
  ph2: 'Spotify player',
  video_l: '2020 · official video',
  im_saiu: 'Already out',
  plat1: 'Buy record and digital', plat2: 'Artist profile', plat3: 'Full catalogue', plat4: 'Videos and live sets',

  ve_rot: 'Watch', ve_tit: 'Three stages, <span class="it">one</span> voice',
  ve_txt: 'The same singer in a fado house and in front of a hundred thousand people. Drag sideways.',
  cart3: 'Voice, Portuguese guitar and viola', cart4: 'The viola de fado, up close',
  ph5: 'Studio portrait',

  so_rot: 'Who she is',
  so_tit: 'A fado singer who also <span class="it">plays</span>, and writes what she sings.',
  so_p1: 'Marta Rosa sings fado and plays the viola de fado, an instrument almost exclusively played by men professionally in Portugal. She writes her own lyrics and composes. She curated and programmed at Povo, in Lisbon, and now leads the artistic direction of Onofriana.',
  so_p2: 'In July 2026 she took that voice to the Tomorrowland Mainstage and to Symphony of Unity: seventeen performances in ten days, in front of tens of thousands of people. Same fado; the sky above it just got bigger.',
  ph6: 'Portrait: natural light, ideally with the viola',
  f1: 'Voice', f1v: 'Lisbon College of Music (ESML)',
  f2: 'Musicology', f2v: 'Musical Sciences, NOVA University Lisbon',
  f3: 'Founded', f3v: 'As Mariquinhas — an all-female fado group',
  f4: 'Directs', f4v: 'Onofriana — fado curation and production',
 in_tit: 'What she’s <span class="it">up to</span>', in_bt: 'Follow @martarosa',

  im_rot: 'Press', im_tit: 'For writers and <span class="it">programmers</span>',
  im_bt: 'Download press kit',
  kit1: 'Short and long biography, PT and EN',
  kit2: 'Six high-resolution photographs, with credits',
  kit3: 'Technical rider and stage plan',
  kit4: 'Logos and official billing name',

  bo_rot: 'Booking', bo_tit: 'Bring Marta to <span class="it">your</span> stage',
  bo_txt: 'Answer within two working days. The more you tell us about the date and the room, the more concrete the proposal.',
  c1: 'Name', c2: 'Email', c3: 'Type of event',
  c3a: 'Venue, theatre or festival', c3b: 'Cultural programming', c3c: 'Private event', c3d: 'Other',
  c4: 'Date in mind', c5: 'What you have in mind', c6: 'Send request',
  bo_dir: 'Direct',
  bo_rep: 'Representation and production: <strong>Onofriana</strong> — fado curation, production and programming, Lisbon.',
  bo_idiomas: 'Performances with introductions and context in Portuguese, English, French and Spanish.',

  pe1: 'Listen and watch', pe2: 'Follow', pe3: 'Booking', pe_kit: 'Press kit',
  pe_c: '© 2026 Marta Rosa · Photographs credited to their authors',
};

export function criarLingua(aoMudar) {
  const PT = {};
  document.querySelectorAll('[data-t]').forEach((el) => { PT[el.dataset.t] = el.innerHTML; });

  const guardada = localStorage.getItem('mr-lingua');
  const automatica = (navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en';
  let lingua = guardada === 'pt' || guardada === 'en' ? guardada : automatica;

  function aplicar(l) {
    lingua = l;
    const dic = l === 'en' ? EN : PT;
    document.querySelectorAll('[data-t]').forEach((el) => {
      const v = dic[el.dataset.t];
      if (v !== undefined) el.innerHTML = v;
    });
    document.documentElement.lang = l === 'en' ? 'en' : 'pt-PT';
    const bt = document.getElementById('btLang');
    if (bt) bt.textContent = l === 'en' ? 'PT' : 'EN';
    localStorage.setItem('mr-lingua', l);
    aoMudar?.(l);
  }

  document.getElementById('btLang')?.addEventListener('click', () => aplicar(lingua === 'pt' ? 'en' : 'pt'));
  if (lingua === 'en') aplicar('en');
  return { lingua: () => lingua, aplicar };
}
