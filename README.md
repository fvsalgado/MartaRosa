# O site da Marta voltou para o casa-travertina

Este repositório deixou de ser a casa do site. O código vive em:

**https://github.com/fvsalgado/casa-travertina** →
[`public/martarosa/`](https://github.com/fvsalgado/casa-travertina/tree/main/public/martarosa)

## Porquê

Para ter o site no **mesmo projeto da Vercel** que a app, e mesmo assim com
domínio próprio. Um projeto da Vercel pode ter vários domínios, e o
`vercel.json` da raiz encaminha por domínio: quem chega por `martarosa.pt` vê
`public/martarosa/` como raiz; quem chega pelo domínio da app vê o site em
`/martarosa/`.

Assim há um repositório só, um projeto só, e mesmo assim dois sites com
endereços independentes.

## Onde está o quê

| | |
|---|---|
| Site | `public/martarosa/` |
| Documentação | `docs/martarosa.md` |
| Funções serverless | `api/mr-agenda.js`, `api/mr-instagram.js`, `api/mr-booking.js` |
| Encaminhamento por domínio | `vercel.json` da raiz |

Este repositório pode ser arquivado ou apagado.
