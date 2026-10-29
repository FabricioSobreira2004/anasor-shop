# Narração — @anasor.ceramica

Narração em todos os Reels (12 de peça + 4 de conteúdo) e nos 2
vídeos do Tour do Site (`tour-instagram`, `tour-portfolio`). O loop
do README (`tour-loop.mp4`) fica mudo, de propósito.

## Voz

Microsoft Maria Desktop (pt-BR, feminina, via `System.Speech`/SAPI do
Windows — já vem instalada, não precisa instalar nada). `Rate=2` dá
um ritmo calmo, perto de 2,5 palavras por segundo. Ver `DECISOES.md`
pra entender por que essa voz foi escolhida em vez do Piper TTS.

## Como regerar a narração

1. Edite o texto que quiser em `roteiros.md` (1 parágrafo por
   vídeo, dentro do `> `).
2. Rode:

   ```
   node narrar.js                                    # todos os 18
   node narrar.js --nome caneca-passaro-azul          # só 1, pra testar
   ```

3. O script:
   - Arquiva o vídeo mudo original em `E:\projetos\site-mae\reels\_mudo\`
     ou `...\tour\_mudo\` (só na primeira vez — nunca sobrescreve o
     arquivo já arquivado).
   - Sintetiza o texto em WAV.
   - Se a voz não couber na duração do vídeo (com folga de 0,5s no
     fim), CORTA o texto automaticamente — sem nunca tocar no
     fechamento fixo "Link na bio..." — e tenta de novo. Só acelera
     o áudio (até 1,1x) se cortar não bastar.
   - Mixa com `ffmpeg`: voz começa ~0,3s depois do início, loudness
     normalizado a -16 LUFS (sem estourar), áudio final AAC 48kHz
     estéreo 128kbps, vídeo copiado sem recompressão.
   - Sobrescreve o `.mp4` em `site-mae\reels\` ou `site-mae\tour\`
     (o mudo original continua intacto em `_mudo\`).
4. Confira `E:\projetos\_tmp\narracao-relatorio.txt` — 1 linha por
   vídeo com as 4 checagens (fluxos de áudio/vídeo, sem silêncio
   total, sem estouro de pico, voz mais curta que o vídeo).

## Pra silenciar ou trocar por música

Os `.mp4` em `site-mae\reels\` e `site-mae\tour\` JÁ TÊM a narração
(é o que vai pro kit de postagem). Se preferir postar sem narração,
ou com música em vez de voz, use a versão arquivada em `_mudo\` como
ponto de partida.
