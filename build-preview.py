#!/usr/bin/env python3
"""Junta o site num ficheiro só, para pré-visualização (Artifact, email, USB).

Não é o build de produção — em produção o site vai como está, em ficheiros
separados. Isto serve para mostrar a alguém sem servidor nenhum:
CSS embutido, fontes em data: URI, módulos concatenados e os JSON de /data
servidos por um fetch de mentira.

    python3 marta/build-preview.py saida.html
"""

import base64
import json
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).parent
# a ordem é a das dependências: quem é importado vem primeiro
MODULOS = ['js/ceu.js', 'js/movimento.js', 'js/i18n.js', 'js/agenda.js', 'js/ouvir.js', 'js/main.js']
DADOS = ['data/agenda.json', 'data/disco.json', 'data/instagram.json']


def css_com_fontes() -> str:
    css = (RAIZ / 'css/site.css').read_text(encoding='utf-8')

    def troca(m):
        b64 = base64.b64encode((RAIZ / m.group(1).lstrip('/')).read_bytes()).decode()
        return f'url(data:font/woff2;base64,{b64})'

    return re.sub(r"url\('(/fonts/[^']+)'\)", troca, css)


def bundle() -> str:
    partes = []
    for caminho in MODULOS:
        codigo = (RAIZ / caminho).read_text(encoding='utf-8')
        codigo = re.sub(r'^import\s.*?;\s*$', '', codigo, flags=re.M | re.S)
        codigo = re.sub(r'^export\s+(?=(const|function|async|let|class))', '', codigo, flags=re.M)
        partes.append(f'/* ── {caminho} ── */\n{codigo}')
    return '\n'.join(partes)


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    html = (RAIZ / 'index.html').read_text(encoding='utf-8')
    titulo = re.search(r'<title>.*?</title>', html, re.S).group(0)
    corpo = re.search(r'<body>(.*)</body>', html, re.S).group(1)
    corpo = re.sub(r'<script type="module".*?</script>', '', corpo, flags=re.S)

    dados = {f'/{c}': json.loads((RAIZ / c).read_text(encoding='utf-8')) for c in DADOS}

    saida = f"""{titulo}
<style>{css_com_fontes()}</style>
{corpo.strip()}
<script>
(function(){{
  'use strict';
  document.documentElement.dataset.tema = 'claro';
  // pré-visualização num ficheiro só: os JSON vivem aqui dentro
  var DADOS = {json.dumps(dados, ensure_ascii=False)};
  var origem = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function(u, o){{
    var k = String(u && u.url ? u.url : u);
    if (DADOS[k]) return Promise.resolve(new Response(JSON.stringify(DADOS[k]),
      {{ headers: {{ 'Content-Type': 'application/json' }} }}));
    return origem ? origem(u, o) : Promise.reject(new Error('sem rede'));
  }};
{bundle()}
}})();
</script>
"""
    pathlib.Path(sys.argv[1]).write_text(saida, encoding='utf-8')
    print(f'{sys.argv[1]} — {len(saida)/1024:.0f} KB')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
