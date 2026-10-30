# Narração — @anasor.ceramica

Narração em todos os Reels (12 de peça + 4 de conteúdo) e nos 2
vídeos do Tour do Site (`tour-instagram`, `tour-portfolio`). O loop
do README (`tour-loop.mp4`) fica mudo, de propósito.

## Voz e ritmo (Rodada 6)

Padrão de produção: **Microsoft Maria Desktop** (pt-BR, feminina,
`System.Speech`/SAPI do Windows, já instalada), **Rate=4** — mede
perto de 2,8-3,1 palavras por segundo na maioria dos roteiros reais
(o ritmo é ajustado NA VOZ, nunca esticando o áudio depois: ver
`DECISOES.md`).

Também dá pra usar uma voz **neural (Piper, offline)** — 4 modelos
pt_BR baixados (faber/cadu/jeff/edresson, todos masculinos: não
existe voz feminina pt_BR no catálogo do Piper hoje), licença MIT.
Amostras de todas em `E:\projetos\site-mae\narracao-amostras\` —
ouça e decida se prefere trocar a voz padrão.

Trocar voz/ritmo por linha de comando, sem editar código:

```
node narrar.js                            # padrão: maria, rate 4
node narrar.js --voz maria --ritmo 5      # SAPI, rate 5 (mais rápido)
node narrar.js --voz faber --ritmo 0.4    # Piper faber, length_scale 0.4
node narrar.js --voz cadu --ritmo 0.4     # Piper cadu
node narrar.js --voz jeff --ritmo 0.4     # Piper jeff
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
     ou `...\tour\_mudo\` (só na primeira vez).
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
   sem silêncio total, sem estouro, duração, ritmo 2,8-3,1, sem
   corte interno) e qualquer decisão/aviso automático.

## Sobre o aviso "sem-corte-interno"

A maioria dos vídeos mostra 1 pausa de ~0,6-0,68s bem no meio da
fala, sempre numa vírgula/cláusula — é muito provável que seja a
pausa NATURAL que o SAPI insere nesse Rate (consistente em quase
todo vídeo, no mesmo tamanho), não um defeito de verdade, mas não
dá pra confirmar por ouvido. Se ao ouvir perceber que soa estranho,
2 saídas: reescrever o trecho em `roteiros.md` juntando a cláusula
com "e"/"que" em vez de vírgula, ou aceitar — pausa em vírgula é
normal em fala humana.

## Pra silenciar ou trocar por música

Os `.mp4` em `site-mae\reels\` e `site-mae\tour\` JÁ TÊM a narração
(é o que vai pro kit de postagem). Se preferir postar sem narração,
ou com música em vez de voz, use a versão arquivada em `_mudo\` como
ponto de partida.
