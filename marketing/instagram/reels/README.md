# Motor de Reels (@anasor.ceramica)

Gera Reels verticais (1080×1920, 30fps, MP4) com motion graphics reais
— tipografia cinética, legenda palavra-por-palavra, movimento de
câmera nas fotos, máscaras circulares, selo/faixa de confiança
animados — a partir dos dados do site (`js/produtos.js`,
`css/style.css`, `politicas.html`). Stack: **Remotion** (React) — a
licença gratuita cobre indivíduo/empresa pequena, uso comercial
incluído (conferido antes de usar: remotion.dev/license).

## Como rodar

Primeira vez:

```
cd marketing/instagram/reels
npm install
npx playwright install chromium
```

**Antes de cada render**, aponte TEMP/TMP pra um disco com espaço
(o C: deste PC enche fácil — ver nota abaixo). Num PowerShell:

```powershell
$env:TEMP = "E:\projetos\anasor-shop\marketing\instagram\reels\.tmp"
$env:TMP  = "E:\projetos\anasor-shop\marketing\instagram\reels\.tmp"
```

Depois, renderizar:

```
node reel.js --nome r1-caneca-surpresa-gatinho      # um dos 6 roteiros prontos (src/roteiros.js)
node reel.js --id 8 --template apresentacao          # qualquer peça disponível, roteiro padrão
node reel.js --id 8 --template detalhes              # versão mais curta, sem abertura grande
node reel.js --ids 39,43,38 --template colecao       # "coleção": várias peças em sequência
```

Saída: `E:\projetos\site-mae\reels\<nome>.mp4` (1080×1920, 30fps,
H.264 High, yuv420p, faststart, **sem áudio** — a música é escolhida
no Instagram na hora de postar) + 5 quadros de conferência (início,
25%, 50%, 75%, fim) em `reels\_conferencia\<nome>-N.png`.

## Por que o disco C: importa

Remotion, o Chromium que ele controla e o ffmpeg escrevem bastante
coisa temporária durante o render (frames, cache do bundle, perfil do
browser). Se o C: estiver cheio, o render falha com erros confusos
(`EPIPE`, `ENOSPC`, às vezes sem mensagem nenhuma) — foi exatamente o
que aconteceu testando este motor. Setar `$env:TEMP`/`$env:TMP` pra
uma pasta em outro disco (`reels\.tmp\`, já no `.gitignore`) resolve
sem precisar mexer no C:.

## Templates

- **Apresentação** (`apresentacao`): abertura com selo + nome da peça,
  2-3 cenas (foto com Ken Burns ou vídeo em moldura circular) com
  legenda palavra-por-palavra, fecho com CTA + faixa de confiança.
- **Detalhes** (`detalhes`): mesmo motor, abertura mais curta (sem o
  "cartão de visita" grande) — pra roteiros que já abrem no close.
- **Coleção** (`colecao`): várias peças em sequência rápida (uma
  FotoKenBurns + nome cada), fecho único no final. Pede `--ids` (ou um
  roteiro com `pecaIds`), não `--id`.

## Os 6 Reels desta rodada

| Roteiro | Peça | Template | Observação |
|---|---|---|---|
| `r1-caneca-surpresa-gatinho` | Caneca Surpresa Gatinho (id 20) | apresentação | vídeo-fonte mostra o leite sendo DESPEJADO (cobrindo o gatinho); tocado ao contrário (`ffmpeg -vf reverse`, 1x, cacheado) vira a cena pedida — cheio → baixando → gatinho revelado |
| `r7-casinhas-de-fada` | Kit 4 Casinhas de Fada (id 36) | apresentação | sem filmagem noturna ainda (ver `reels-ideias.md`); o "acender" é um efeito gráfico assumido como tal — `GlowNoturno` escurece a foto e anima brilhos quentes nos furinhos |
| `prato-canario-flor-de-outono` | id 41 | apresentação | peça variada: prato |
| `vaso-refugio-de-petalas` | id 25 | apresentação | peça variada: vaso |
| `caneca-passaro-azul` | id 28 | detalhes | peça variada: caneca (diferente da do R1) |
| `colecao-objetos-decorativos` | ids 39, 43, 38 | coleção | peça variada 4/4: em vez de 1 kit só, mostra 3 objetos decorativos em sequência — usa o template C de propósito |

## Qualidade da mídia

Os vídeos de produto são 576×1024 (baixa resolução pra um 1080×1920
cheio). Por isso NUNCA aparecem em tela cheia: sempre dentro de
`VideoInserto`, uma moldura circular de ~760px — na prática, a
"máscara circular" pedida (referência a pratos) resolve dois problemas
de uma vez. As fotos (alta resolução, as mesmas de `produtos.js`) é
que levam o movimento de câmera em tela cheia (`FotoKenBurns`).

## Estrutura do código

- `reel.js` — CLI: lê `produtos.js`/`style.css`, resolve o roteiro
  (pronto ou ad-hoc), copia só os arquivos necessários pra `public/`
  (apagada e refeita a cada render), reverte vídeo quando pedido,
  gera a marca d'água (mesma técnica de remoção de fundo por
  luminância de `marketing/instagram/gerar-posts.js`, reimplementada
  aqui porque esta pasta tem `package.json` próprio), bundla, renderiza
  e tira os quadros de conferência.
- `src/roteiros.js` — os 6 roteiros prontos + o roteiro padrão (dados
  puros: cenas, durações, textos — nenhum caminho de arquivo).
- `src/componentes.js` — as peças de animação reutilizáveis (ver
  comentário no topo do arquivo).
- `src/templates/Apresentacao.js` — motor dos templates Apresentação e
  Detalhes (a diferença está no roteiro, não no código).
- `src/templates/Colecao.js` — motor do template Coleção.
- `src/ffmpeg-path.js` — acha ffmpeg/ffprobe mesmo se não estiverem no
  PATH do processo (comum logo após um `winget install`).

## Antes de mudar o design

Mova a saída anterior pra `site-mae\reels\_v1\` (ou `_v2\`, etc.) antes
de rodar nomes que já existiam — `reel.js` só sobrescreve o arquivo com
o MESMO nome que está gerando, nunca apaga a pasta `reels\` inteira.
