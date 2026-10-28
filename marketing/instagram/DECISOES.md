# Decisões tomadas sozinho (modo autônomo)

Registro de toda decisão não-óbvia tomada durante a Rodada 2 (posts v3,
Reels v2, kit de postagem), sem pausar pra perguntar — pedido explícito do
Fabrício em 2026-10-28. Uma linha por decisão: o quê + por quê.

Formato: `AAAA-MM-DD HH:MM — decisão — motivo`

---

2026-10-28 — Posts v3: 4 layouts de capa (foto cheia / editorial dividida / círculo sobre bege / fundo marrom-dourado), alternados na ordem 1,4,2,3,1,4,2,3,1 (ver LAYOUT_CAPA_POR_POSICAO em gerar-posts.js) — ordem escolhida à mão pra nenhum vizinho horizontal/vertical da grade 3x3 repetir layout, conferido no mock `_grade-perfil.png`.
2026-10-28 — Marca d'água no layout 4 (fundo marrom) ganhou um "chip" circular creme por trás — sem ele, o corte por luminância da logo deixava ruído de compressão JPEG visível como halo quadrado sobre o fundo escuro (invisível nos outros 3 layouts, de fundo claro).
2026-10-28 — Grade do perfil (_grade-perfil.png): recorte 3:4 por CORTE DE LARGURA (não de altura) da capa 4:5 — é o único jeito de obter 3:4 (mais "alto" que 4:5) cortando em vez de preenchendo; motivo documentado no comentário de gerarGradePerfil().
2026-10-28 — Movida a saída v2 completa (9 posts + stories) pra instagram-posts\_v2\ antes de gerar a v3, seguindo o processo já documentado no README.md (nunca apagar versão anterior).

---

2026-10-28 — ERRO (registrado, não escondido): testei o motor de Reels v2 rodando `node reel.js --nome r1-caneca-surpresa-gatinho` ANTES de mover a rodada v1 inteira pra `reels\_v1\` — isso sobrescreveu `r1-caneca-surpresa-gatinho.mp4` (e seus quadros de conferência) com a versão v2, sem arquivar a v1 antes. Os outros 5 reels v1 foram arquivados corretamente logo em seguida, sem o mesmo erro. A v1 do r1 não ficou de fato perdida: o código do motor ANTES da rodada v2 (sem parallax/brilho/vinheta-grão) continua no histórico do git (commit 8d6e2a8) — se precisar da v1 exata do r1 de volta, dá pra gerar de novo revertendo componentes.js/Apresentacao.js pra aquele commit e rodando o mesmo comando.
2026-10-28 — Reels v2: 2 camadas de parallax (fundo desfocado/escurecido se movendo mais devagar que a foto nítida) em vez de recorte/segmentação do objeto — segmentação de verdade pediria ferramenta de remoção de fundo além do padrão do projeto (ffmpeg/Remotion/Playwright), fora do escopo "só ferramentas padrão" pedido.

---

2026-10-28 — Kit de postagem, dia 12 (calendário pedia Reels "cuidados: como lavar", roteiro R8): sem filmagem pra virar Reel ainda, usei o carrossel "Cuidados com a peça" (post-11) no lugar — MESMA legenda nº4, mesmos fatos, só formato diferente. Documentado no LEIA-ME.md pra trocar pelo Reel assim que ele existir.
2026-10-28 — Kit de postagem, dias 14 e 28 (prova social): NÃO inventei depoimento nem usei um post de reserva como substituto — ficaram PENDENTE.md de verdade. Prova social falsa quebraria a credibilidade da própria coisa que o post tenta provar.
2026-10-28 — Kit de postagem, dia 19 (Reels "encomenda: como funciona", roteiro R5): fiquei PENDENTE em vez de reaproveitar post-13 (que já está alocado no dia 7, legenda nº6) — usar o mesmo carrossel em 2 dias diferentes do calendário duplicaria conteúdo pros mesmos seguidores em 12 dias de intervalo.

---

2026-10-28 (rodada 3) — "Pelos Correios" no post "Como comprar": CONFERIDO em politicas.html (#prazo-envio: "Enviamos em até 7 dias úteis após a confirmação do pagamento, via Correios") — a frase é verdadeira, mantida como estava (legenda e slide). Nenhuma mudança feita no item 1 do pedido.
2026-10-28 (rodada 3) — Fundi os 2 slides quase iguais sobre variações ("As variações são a assinatura" + "Não é defeito, é processo") num só, reaproveitado IDÊNTICO nos carrosséis "Cuidados com a peça" (post-11, 5→4 slides) e "Peça única" (post-12, mantém 5 slides, conteúdo mais completo no mesmo slide) — ver VARIACOES_TITULO/VARIACOES_TEXTO em gerar-posts.js.
2026-10-28 (rodada 3) — 4 Reels de CONTEÚDO (motion graphics puro, sem filmagem): novo template `reels/src/templates/Conteudo.js` + 4 roteiros em roteiros.js (`como-comprar-conteudo`, `cuidados-conteudo`, `peca-unica-conteudo`, `encomenda-conteudo`). Reaproveita os componentes já existentes (TituloCinetico, FaixaConfianca, BotaoGummyFinal, VinhetaGrao, MascaraCircular) — nada novo de infraestrutura, só um 4º "roteador" de cena.
2026-10-28 (rodada 3) — BUG achado e corrigido ainda em teste: as cenas de fundo escuro do template Conteudo (passo/parágrafo/lista) não pintavam um fundo opaco próprio — a área revelada pelo MascaraCircular deixava a cena ANTERIOR aparecer por baixo (3 cenas sobrepostas, ilegível). Corrigido adicionando um `<div>` de fundo opaco em cada uma, igual ao que "titulo-conteudo"/"cta-conteudo" já tinham.
2026-10-28 (rodada 3) — MESMO bug do halo quadrado na marca d'água (já visto nos posts, layout 4) apareceu nos Reels de conteúdo, por serem os PRIMEIROS a mostrar a marca d'água sobre fundo chapado escuro (os outros templates sempre têm foto/vídeo atrás). Corrigido com um parâmetro `comChip` em MarcaDagua (componentes.js), ligado só no template Conteudo — os outros 2 templates (Apresentacao/Colecao) continuam exatamente como estavam, sem risco de mudar o visual já aprovado dos 12 Reels anteriores.
2026-10-28 (rodada 3) — dia 12 do kit de postagem: troquei post-11 (carrossel) por cuidados-conteudo.mp4 (Reel) como mídia PRINCIPAL — agora existe um Reel de verdade cobrindo o mesmo conteúdo que o calendário pedia nesse formato; post-11 continua disponível na Reserva. dia 19: saiu de PENDENTE para encomenda-conteudo.mp4.
2026-10-28 (rodada 3) — "Como comprar" (post-10 e como-comprar-conteudo.mp4) e "O que é peça única" (peca-unica-conteudo.mp4) NÃO foram ligados a nenhum dia do calendário de 30 dias — nenhum dos 17 dias originais corresponde a esses 2 temas; ficaram na Reserva, igual seus pares em carrossel.
