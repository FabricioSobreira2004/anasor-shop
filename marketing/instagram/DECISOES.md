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
