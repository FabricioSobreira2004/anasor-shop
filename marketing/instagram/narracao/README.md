# Narração — @anasor.ceramica

Narração em todos os Reels (12 de peça + 4 de conteúdo) e nos 2
vídeos do Tour do Site (`tour-instagram`, `tour-portfolio`). O loop
do README (`tour-loop.mp4`) fica mudo, de propósito.

## Voz e ritmo (Rodada 7)

Padrão de produção: **Piper "jeff"** (pt_BR, masculina, neural,
offline, licença MIT), **length_scale 0,7** ("mais pausado") —
escolha do Fabrício depois de ouvir as amostras em
`E:\projetos\site-mae\narracao-amostras\`. Troca a voz feminina SAPI
Maria usada até a Rodada 6.

A síntese é DETERMINÍSTICA (`--noise-w-scale 0` em
`sintetizar-piper.ps1`, achado da Rodada 7: o Piper tem um preditor
de duração estocástico — sem fixar esse parâmetro, a mesma frase sai
com duração diferente a cada execução).

Outras vozes Piper disponíveis (cadu/faber/edresson, também
masculinas — não existe voz feminina pt_BR no catálogo do Piper
hoje) ou a SAPI Maria de antes:

```
node narrar.js                            # padrão agora: jeff, ritmo 0.7
node narrar.js --voz maria --ritmo 4      # volta pra SAPI Maria
node narrar.js --voz faber --ritmo 0.4    # Piper faber
node narrar.js --voz cadu --ritmo 0.4     # Piper cadu
node narrar.js --voz edresson --ritmo 0.35 # Piper edresson (qualidade "low")
```

Se trocar pra Piper e os modelos não estiverem em
`E:\projetos\_tmp\piper-modelos\`, baixe de novo:

```
pip install piper-tts
python -m piper.download_voices --download-dir E:\projetos\_tmp\piper-modelos pt_BR-faber-medium pt_BR-cadu-medium pt_BR-jeff-medium pt_BR-edresson-low
```

## Como regerar a narração

1. Edite o texto que quiser em `roteiros.md` (1 parágrafo por
   vídeo, dentro do `> `) — frases corridas, vírgula em vez de
   ponto, nome da peça na 1ª cláusula.
2. Rode (opcionalmente com `--voz`/`--ritmo`, `--nome` pra testar 1 só):

   ```
   node narrar.js
   node narrar.js --nome caneca-passaro-azul
   ```

3. O script:
   - Arquiva o vídeo mudo original em `E:\projetos\site-mae\reels\_mudo\`
     ou `...\tour\_mudo\` (só na primeira vez) e, antes de sobrescrever
     o `.mp4` atual, arquiva a versão anterior (já narrada) em
     `<pasta>\_anteriores\<data-de-hoje>\<nome>.mp4` (1x por dia —
     regra fixa desde a Rodada 7: nunca sobrescrever sem arquivar).
   - Sintetiza o texto INTEIRO numa passada só (SAPI ou Piper).
   - Se a voz não couber na duração do vídeo (com folga de 0,5s no
     fim), CORTA o texto automaticamente — por frase/cláusula
     inteira, nunca no meio de uma palavra, nunca o fechamento fixo
     "Link na bio..." — e tenta de novo. **Nunca acelera o áudio**
     (proibido desde a Rodada 6 — era isso que deixava a voz
     "picada").
   - Confere por código se há algum silêncio ≥0,6s DENTRO da fala
     (`silencedetect`) — regista aviso no relatório (não bloqueia).
   - Mixa com `ffmpeg`: passa-altas 80Hz, compressão suave, fade-out
     de 120ms no fim da voz, voz começa ~0,3s depois do início,
     loudness normalizado a -16 LUFS, áudio final AAC 48kHz estéreo
     128kbps, vídeo copiado sem recompressão.
   - Sobrescreve o `.mp4` em `site-mae\reels\` ou `site-mae\tour\`
     (o mudo original continua intacto em `_mudo\`).
4. Confira `E:\projetos\_tmp\narracao-relatorio.txt` — 1 linha por
   vídeo com: palavras/segundo medido, as 6 checagens (fluxos,
   sem silêncio total, sem estouro, duração, ritmo, sem corte
   interno) e qualquer decisão/aviso automático. A faixa de ritmo é
   calculada por voz (±15% da `wpsReferencia` medida na amostra
   dela em `narracao-amostras\`); uma voz sem amostra própria
   (cadu/edresson) compara contra a referência da voz PADRÃO
   (jeff/0,7) — a checagem nunca é pulada (Rodada 8, achado da
   code-review — ver `DECISOES.md`, teste em `teste-narrar.js`).

## Sobre o aviso "sem-corte-interno"

Os roteiros de produção (frases únicas e compactas, pra caber nos
poucos segundos de cada vídeo) têm várias vírgulas encadeadas — o
Piper, no ritmo 0,7, insere uma pausa prosódica mais longa (~0,6-1s)
bem numa vírgula de frase longa; a amostra de referência (2
parágrafos soltos) não tem esse padrão porque tem frases mais
simples. NÃO é corte/artefato (a fala não quebra nem repete palavra)
— é uma pausa de respiração um pouco mais longa que o ideal. Se ao
ouvir perceber que soa estranho, 2 saídas: reescrever o trecho em
`roteiros.md` juntando a cláusula com "e"/"que" em vez de vírgula,
ou aceitar — pausa em vírgula é normal em fala humana (detalhe
completo em `DECISOES.md`, Rodada 7).

## Legenda queimada (Rodada 7, novo)

Depois de rodar `narrar.js`, rode `node legendar.js` (ou
`--nome <vídeo>` pra 1 só) — lê o sidecar que `narrar.js` grava em
`E:\projetos\site-mae\_narracao-dados\<nome>.json` (texto final
falado + duração real da voz) e:

- gera um `.srt` ao lado do `.mp4` (`site-mae\reels\` ou `...\tour\`),
  com blocos de 3-6 palavras — tempo estimado por proporção de
  caracteres (sem STT: a transcrição por ASR do Piper saiu errada
  demais pra confiar, ver `DECISOES.md`);
- queima a legenda no vídeo via um `.ass` próprio (não o `.srt` direto
  — `force_style` sobre `.srt` puro sai com tamanho/posição errados,
  achado da Rodada 7), com contorno escuro grosso (contraste garantido
  em qualquer fundo) numa posição fixa por categoria de vídeo (tour
  mobile, tour desktop, Reels) que nunca cobre celular/produto/
  botão/logo/@ — validado por amostragem de quadro (amplitude de
  luminância na caixa da legenda). Desde a Rodada 8, essa checagem
  BLOQUEIA: se a caixa da legenda cair sobre algo importante, o script
  lança erro e NÃO escreve o vídeo final (exceto 1 falso-positivo já
  verificado à mão, numa lista documentada no topo do arquivo).
- mantém um MASTER permanente sem legenda em `<pasta>\_sem_legenda\
  <nome>.mp4` (seedado uma única vez a partir do vídeo recém-saído do
  `narrar.js`) — toda queima lê SÓ dali, nunca do `.mp4` final, que é
  só o destino. Rodar `legendar.js` várias vezes no mesmo vídeo sempre
  dá o mesmo resultado (idempotente — Rodada 8, antes rodar 2x queimava
  legenda em cima de legenda, ver `DECISOES.md`). Antes de sobrescrever
  o `.mp4` final, arquiva a versão anterior em `_anteriores\<data>\
  <nome>-<hora>.mp4`.

## Testes (Rodada 8)

```
node teste-narrar.js     # checagem de ritmo (cálculo puro, sem sintetizar voz)
node teste-legendar.js   # idempotência, formato de tempo, bloqueio de área livre
                          # (usa ffmpeg de verdade numa sandbox em E:\projetos\_tmp\, nunca toca em site-mae\)
```

## Pra silenciar ou trocar por música

Os `.mp4` em `site-mae\reels\` e `site-mae\tour\` JÁ TÊM a narração
(é o que vai pro kit de postagem). Se preferir postar sem narração,
ou com música em vez de voz, use a versão arquivada em `_mudo\` como
ponto de partida.
