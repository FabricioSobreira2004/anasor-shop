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

## Os 6 Reels da rodada v1 (histórico — movidos pra `reels\_v1\`)

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

## v2 — parallax, brilho de esmalte, vinheta/grão, área segura, 12 Reels

- **`FotoParallax`** (`src/componentes.js`): 2 camadas da MESMA foto —
  fundo desfocado/escurecido se movendo mais devagar, frente nítida
  (`FotoKenBurns`) se movendo mais rápido. Sem recorte/segmentação do
  objeto (decisão registrada em `DECISOES.md`: ferramenta de remoção de
  fundo ficaria fora do "só ferramentas padrão" pedido).
- **`BrilhoEsmalte`**: faixa de luz diagonal (`mix-blend-mode: screen`)
  que atravessa a cena 1x, imitando reflexo de esmalte/vidrado.
- **`VinhetaGrao`**: overlay único por cima de TUDO — vinheta
  (radial-gradient nos cantos) + grão de filme (ruído SVG `feTurbulence`,
  opacidade ~0.05, jitter determinístico por frame).
- **Easing refinado**: `EASE_CAMERA` (bezier 0.16,1,0.3,1 — "easeOutExpo")
  em todo movimento de câmera, trocando o `Easing.inOut(Easing.ease)` da
  v1.
- **Área segura**: selo a partir de `top:260`, marca d'água/faixa de
  confiança/nome (Coleção) a partir de `bottom:430` — nada importante
  nos 250px do topo nem nos 420px de baixo (onde o Instagram desenha a
  própria interface do Reels).

### Os 12 Reels desta rodada

6 refeitos com o motor v2 (mesmos roteiros/peças da v1 — ver tabela
antiga, movida pra `reels\_v1\`) + 6 novos:

| Arquivo | Peça | Template | Observação |
|---|---|---|---|
| `caneca-surpresa-cachorrinho` | id 19 | apresentação | roteiro padrão (sem o truque de reverter vídeo do R1 — não confirmado que o vídeo-fonte desta peça tem o mesmo enquadramento) |
| `kit-canequinhas-arlequim` | id 23 | detalhes | peça colorida, categoria "Conjuntos" ainda sem Reel |
| `anjo-guardiao-porta-incenso` | id 43 | apresentação | objeto decorativo, variedade de categoria |
| `kit-copos-ondas-do-mar` | id 40 | detalhes | peça com vídeo, tema azul |
| `prato-ave-da-alvorada` | id 10 | apresentação | SEM vídeo-fonte — testa o caminho só-foto do roteiro padrão |
| `colecao-pecas-de-alma` | ids 32, 37, 45 | coleção | 2ª coleção da rodada, peças ainda não usadas em Reel nenhum |

## Mídia: vídeos com marca "Ateliê Anasor" embutida

Pedido explícito da rodada v2: não usar vídeos com a marca antiga
"Ateliê Anasor" (antes do rebrand pra "Anasor Sobreira") embutida na
imagem. Este motor só lê `videoUrl` de `js/produtos.js` — são os
MESMOS vídeos já publicados nas páginas de produto do site no ar hoje
(não há vídeo "cru"/não revisado nesta pasta); nenhum deles tem marca
d'água visível nas conferências feitas nesta rodada. Fontes de vídeo
fora de `produtos.js` (ex.: a pasta `_contato\` de `site-mae`, com
fotos/vídeos originais da artesã) NUNCA são usadas por este motor.
