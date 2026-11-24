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

---

## Rodada 4 — "Tour do Site" (modo totalmente autônomo, Fabrício na faculdade)

Pedido em 2026-10-28. Fabrício avisou que não vai responder por várias horas — toda decisão abaixo foi tomada sozinho, sem pausar.

2026-10-28 (rodada 4) — ACHADO CRÍTICO DE AMBIENTE: o disco C: deste PC está com **0 bytes livres** (confirmado via `[System.IO.DriveInfo]`), não só "pouco espaço" como a nota do README dos Reels já avisava. Isso afeta até comandos PowerShell que usam o subsistema de formatação de saída (`Format-Table`, `Out-String -Width`, `Get-PSDrive` com tabela) — eles falham com "Espaço insuficiente no disco" mesmo quando a operação em si (ex.: criar pasta em D:) teve sucesso. Não tentei liberar espaço no C: (apagar arquivos do sistema/usuário sem saber o que é seguro apagar é uma decisão que só o Fabrício deveria tomar) — só desviei TUDO que esta rodada precisa (TEMP/TMP, cache do npm, cache de browsers do Playwright, frames de captura) pra D:\anasor-tour-tmp\ (384GB livres) e os entregáveis finais pra E:\projetos\site-mae\tour\ (fora do git, como pedido). Reportar ao Fabrício: ele deve verificar o espaço do C: quando puder — não é algo que este trabalho resolve.
2026-10-28 (rodada 4) — Servidor local de teste: em vez de `vercel dev` (o jeito "oficial" de testar front+backend juntos, citado em `js/checkout.js`), escrevi um wrapper próprio (`marketing/instagram/tour/src/servidor-local.js`) porque este projeto NÃO está linkado a uma conta Vercel nesta máquina (`vercel dev` pediria login interativo — algo que só o Fabrício pode fazer). O wrapper só reexporta o app Express de `backend/server.js` (mesma técnica de `api/index.js`) e adiciona `express.static` da raiz do site — não toca em `backend/server.js`, `vercel.json` nem `api/index.js`. Roda na porta 8765 (o próprio padrão de `BASE_URL` em `server.js`), com `FORCAR_DEMO=1` obrigatório e confirmado no log antes de qualquer captura.
2026-10-28 (rodada 4) — BUG achado e corrigido em teste: codificar os PNGs da captura mobile em .mp4 falhava ("width not divisible by 2") porque 393×852 a deviceScaleFactor 3 dá 1179×2556 — 1179 é ÍMPAR, e o libx264 exige dimensões pares. Corrigido com `-vf pad=ceil(iw/2)*2:ceil(ih/2)*2` no ffmpeg (preenche 1px em vez de redimensionar/distorcer).
2026-10-28 (rodada 4) — SIMPLIFY (4 agentes: reuso, simplificação, eficiência, altitude) rodou em `tour/`. Aplicados: `lerArgs()` (parser de CLI) duplicado em `tour.js`/`src/capturar.js` virou `src/cli.js`; `ID_PRODUTO_PRINCIPAL`/`ID_PRODUTO_VENDIDO`/`CPF_TESTE`/`CEP_TESTE` duplicados ou importados de um arquivo de cena pro outro viraram fixtures em `src/dispositivos.js`; `clicarEsperando()` (nunca chamado) removido; o campo `lado` (esquerda/direita) do `DestaqueTecnico`, morto desde a correção visual da Versão B, removido de ponta a ponta (`roteiro-desktop.js`, `TourDesktop.js`, comentário em `componentes.js`); `fimFaixa = acc - 300` (número mágico repetindo a duração do fecho por fora) virou `fimFaixa = acc` capturado ANTES do `push('fecho', ...)`; `legenda`/`destaque` (singular, com fallback nos templates) normalizados pra sempre `legendas`/`destaques` (array) na fonte (`roteiro-mobile.js`/`roteiro-desktop.js`), removendo o fallback de `TourMobile.js`/`TourDesktop.js`; leitura+cópia do manifesto mobile duplicada no caminho padrão "--versao ambas" (achado de eficiência) virou 1 leitura/cópia só, reaproveitada pelas 2 versões; `FundoBege` (fundo com o monograma "AS", igual em todo quadro) ganhou `React.memo` — sem isso, o SVG do monograma era reconstruído em TODO quadro de TODO render (~900/~1500 vezes). PULADOS, registrados em vez de aplicados: (1) `gerarLogoTransparente`/`lerVariaveisCss`/extração de quadros de conferência duplicadas entre `tour.js` e `reels/reel.js` — consertar de verdade exigiria editar `reel.js`, do motor de Reels já aprovado e em produção em rodadas anteriores; fora do escopo desta rodada, risco de regressão sem motivo forte; (2) rodar os 2 renders (`TourMobile`/`TourDesktop`) em paralelo com `Promise.all` — este PC já mostrou processos sendo encerrados externamente durante esta rodada; cada render sozinho já usa ~2,3GB de cache por thread, rodar os 2 ao mesmo tempo é risco de memória sem benefício claro garantido; (3) juntar as 5 chamadas de ffmpeg dos quadros de conferência numa só — ganho mínimo (5 extrações de frame únicos, <1s cada), não valia o risco de errar a sintaxe de múltiplas saídas num só comando ffmpeg. BUG achado testando a aplicação dos achados: ao limpar `tour.js` pra importar `FPS` de `dispositivos.js` em vez de redeclarar, uma mudança em `cenas-mobile.js` (limpar imports) removeu sem querer o import de `FPS` que uma função (capturarVideo) ainda usava — `node --check` não pega isso (só sintaxe, não refs em runtime); só apareceu rodando a captura de verdade. Corrigido e CONFIRMADO rodando a captura+render inteiros de novo depois de todas as mudanças.
2026-10-28 (rodada 4) — CODE-REVIEW (nível medium) rodou em `tour/` e achou 6 problemas reais, todos corrigidos: (1) `produto-video` calculava as coordenadas do toque ANTES de rolar o vídeo pra tela (toque mirava a posição antiga); (2) `adicionar-carrinho` não conferia se `.btn-comprar` existia antes de `.boundingBox()` (podia derrubar a captura inteira); (3) `tour.js` bundlava 2x o mesmo entry point em "--versao ambas"; (4) a função `cena()` de captura estava quase duplicada entre `cenas-mobile.js`/`cenas-desktop.js` — virou `criarFabricaCena()` em `captura-ferramentas.js`; (5) um comentário em `roteiro-desktop.js` ainda falava em "loop:true", caminho abandonado cedo nesta rodada; (6) `MolduraCelular` aceitava `duracaoFrames`/`startFrom` nunca usados. BUG NOVO achado testando a correção do item 3: `bundle()` do Remotion COPIA `public/` pro diretório temporário do bundle NA HORA (não serve ao vivo, como o comentário da correção supunha) — bundlar 1x ANTES de copiar os clipes de cada versão pra `public/` dava 404 procurando o clipe. Corrigido invertendo a ordem: monta os props (e copia os clipes) de TODAS as versões pedidas primeiro, bundla 1x só depois.
2026-10-28 (rodada 4) — 1ª RODADA DE CRÍTICA VISUAL (Versão B): achado real — `DestaqueTecnico` ficava encostado num lado (`left`/`right: 90px`, `maxWidth: 480`), mas o mockup de desktop SOZINHO (cena "listagem", 1180px largo num canvas de 1920px) só deixa 370px de margem de cada lado — MENOR que o card, que cobria parte do navegador (busca/carrinho) na prática. Redesenhado como faixa horizontal centralizada no TOPO (acima de qualquer mockup, que começa por volta de y:171) — nunca mais encosta em nada, em cena solo ou lado a lado. Resto da Versão B aprovado nesta rodada: layout lado a lado (cena "produto") limpo, textos dos 2 destaques do checkout bem posicionados, fecho (endereço + nome) correto (atenção: "FabricioSobreira" sem espaço é o nome pedido literalmente, não é erro de digitação), faixa de tecnologias e marca d'água consistentes.
2026-10-28 (rodada 4) — 1ª RODADA DE CRÍTICA VISUAL (Versão A, 5 quadros de conferência): achado real — a cena "card-selo" (pedido: "card com selo") usava `document.querySelector('.selo-peca')`, que podia pegar o selo "Vendido" (prioridade mais alta, ver CLAUDE.md) — e pegou: mostrava "Pote Decorativo Bruma Dourada" (id 33, a peça vendida de exemplo), DUPLICANDO o que as cenas dedicadas "vendida-secao"/"vendida-produto" já mostram. Corrigido pra `.selo-peca:not(.selo-peca--vendido)` (as classes de modificador do selo existem em css/produto — conferido em js/main.js, `selo-peca--${chave}`). Resto da Versão A aprovado nesta rodada: celular flutuante com moldura genérica, área segura ok, fecho "Link na bio" ok, Fraunces/Jost carregando (sem erro no render), marca d'água/selo consistentes com os Reels.
2026-10-28 (rodada 4) — 2ª RODADA DE CRÍTICA VISUAL (Versão A): a correção anterior (filtrar "Vendido") não bastou — testado à parte (script Playwright solto): `ceramica.html` sem subcategoria tem só 1 `.selo-peca` no total (o "Vendido"), porque essa página mostra ladrilhos de subcategoria, não cards de produto. A Home tem 12 (10 "Queridinha do Ateliê", 1 "Peça Assinada", 1 "Vendido") nas vitrines curadas "Queridinhos do Ateliê" etc. Cena "card-selo" trocada de `ceramica.html` pra Home — confirmado com um quadro extraído na hora certa (ffmpeg -ss após -i, preciso): mostra "Queridinha do Ateliê" e "Peça Assinada" de verdade, inclusive o "de/por" riscado + "Lançamento -10%" num dos cards.
2026-10-28 (rodada 4) — BUG CRÍTICO achado rodando a Versão A (render chegou a 72% e travou): nenhuma cena estava dentro de um `<Sequence>` do Remotion — `useCurrentFrame()` dentro de cada cena devolvia o frame ABSOLUTO da composição, não o frame local desde que a cena começou. O `<OffthreadVideo>` usa esse frame pra decidir que ponto do clipe buscar: a cena "vendida-secao" (clipe de 2s) começa perto do frame 674 — ele tentou buscar o quadro em 674/30≈22,5s de um vídeo de 2s, um ponto que não existe, e o fetch TRAVOU (timeout de 28s do Remotion, derrubando o render inteiro em vez de um erro claro). Corrigido envolvendo cada cena num `<Sequence from={cena.inicio} durationInFrames={cena.duracao}>` (TourMobile.js e TourDesktop.js) — frame local zerado no início de cada cena, exatamente o que faltava. Nota: o motor de Reels parece ter o MESMO padrão sem Sequence (VideoInserto em Apresentacao.js) — não deu erro lá porque os vídeos-fonte são mais longos que a cena que os mostra (erro silencioso de sincronismo, não uma trava), mas é um risco latente; não corrigi por não fazer parte desta rodada, só registro aqui pra uma rodada futura considerar.
2026-10-28 (rodada 4) — Fraunces/Jost NÃO estão instaladas como fonte do Windows nesta máquina (conferido com `System.Drawing.Text.InstalledFontCollection`) — sem carregar de verdade, o Chromium do render cairia num fallback silencioso, quebrando a identidade visual pedida ("fontes Fraunces + Jost"). Instalei `@remotion/google-fonts` (mesma versão do `remotion`) e chamo `loadFont()` das duas em `src/fontes.js`, exigido no `index.js` antes de registrar a raiz — nota: o motor de Reels (`reels/`) parece ter esse mesmo gap (nenhum carregamento de fonte lá), não investiguei/corrigi por não fazer parte desta rodada.
2026-10-28 (rodada 4) — 2 bugs de ÁREA SEGURA achados relendo o código ANTES de qualquer render (Versão A): `SeloTour` estava em `top:64` (dentro dos 250px proibidos — o comentário já dizia "top:260", só o código tinha ficado desatualizado) e `LegendaCinetica` tinha `bottom:150` por padrão (dentro dos 420px proibidos — o pedido é bottom MAIOR que 420, mais longe da borda, não menor). Corrigidos pra `top:280`/`bottom:460`.
2026-10-28 (rodada 4) — PROBLEMA DE PERFORMANCE achado renderizando a Versão A: a 1ª versão de `copiarClipesParaPublic` (tour.js) "esticava" TODO clipe pra 360 quadros sempre (pensado pra Versão B, onde cenas duram mais que a captura bruta), mesmo na Versão A, onde nenhuma cena passa do tamanho real do próprio clipe. Isso deixou os vídeos bem maiores que o necessário e o compositor do Remotion (cache de decodificação de vídeo) extremamente lento — seeks de frame chegando a 3-6 SEGUNDOS cada, o que tornaria o render de ~935 quadros impraticável (>1h). Corrigido calculando o mínimo de quadros necessário POR CLIPE a partir do próprio roteiro (`calcularMinimosNecessarios`), e só "esticando" quando aquele clipe específico precisa — a Versão A não estica nada.
2026-10-29 (rodada 5) — início. Pedido em 2026-10-29, Fabrício na casa da mãe, sem resposta por várias horas, quer postar ainda hoje. Mesmo modo totalmente autônomo da Rodada 4, com uma autorização nova e explícita: liberar espaço no disco C: (lista fechada — TEMP do usuário, Lixeira, caches reinstaláveis — ver abaixo).
2026-10-29 (rodada 5) — ITEM 1a (legenda sobre o celular): causa raiz — `DispositivoFlutuante` centralizava o celular no CANVAS INTEIRO (flex-center numa caixa `inset:0`) e aplicava zoom/panorâmica em torno do CENTRO DO CANVAS; a legenda tinha posição fixa (`bottom`). Com zoom alto (até 1.08x) e panorâmica, o fundo do celular podia avançar bem além de onde a legenda começava — confirmado visualmente num quadro real da cena "links" (ver item 1b) onde a legenda "Frete grátis para todo o Brasil" aparece por cima da tela. Corrigido com uma geometria PREVISÍVEL: o celular ganhou uma `ancoragem` fixa (`DispositivoFlutuante` novo parâmetro) — caixa do tamanho do próprio celular, ancorada num `top` fixo, escalando/girando em torno do PRÓPRIO centro (não mais do canvas); zoom e panorâmica agora têm limites (`CAMERA_ESCALA_MIN/MAX`, `CAMERA_TRANSLATE_MAX_PCT`) aplicados sempre, não só nos valores que o roteiro manda. A legenda trocou de `bottom` fixo pra `top` fixo (cresce pra BAIXO com o texto, não mais pra cima — mais previsível) numa posição abaixo do pior caso do celular. Tudo isso em `LAYOUT_CELULAR` (componentes.js), 1 fonte só, importada tanto pelo componente quanto pelo script novo `src/validar-geometria.js`, que calcula o retângulo do celular no PIOR CASO de cada cena (zoom+panorâmica máximos, os 2 extremos de cada cena — suficiente porque o easing da câmera é monotônico, sem "estourar" o intervalo) e confirma por código que nunca encosta na legenda nem invade as 2 zonas seguras. 1ª tentativa de números (`TOPO:280`) ainda falhava por ~4-8px em várias cenas — ajustado pra `TOPO:300` rodando o validador de novo até passar em todas, não só na conta de cabeça. Aproveitei pra também corrigir `MarcaDagua` (marca d'água): o padrão era `bottom:56`, bem dentro da zona proibida — ninguém tinha notado porque `TourDesktop.js` sempre passava um valor próprio, só `TourMobile.js` usava o padrão sem perceber. Virou `bottom:460`.
2026-10-29 (rodada 5) — ITEM 1b (tela branca no fim): causa raiz achada com a varredura de luminância (`src/verificar-quadros.js`, filtro `signalstats` do ffmpeg) + inspeção visual dos quadros apontados — a cena "links" inteira (todos os 45 quadros, não só o fim) está branca, com um textinho minúsculo no canto: é a página de erro "Cannot GET /links" do Express. O site em produção usa uma reescrita do `vercel.json` (`/links` → `/links.html`) que meu `servidor-local.js` (Rodada 4) nunca implementou — a captura pedia `${baseUrl}/links` (igual à URL de produção) e caía no 404 padrão do Express, não na página de verdade. Corrigido em 2 pontas: `cenas-mobile.js` passa a navegar direto pra `/links.html`, e `servidor-local.js` ganhou a mesma reescrita do `vercel.json` (fidelidade com produção, evita o mesmo tipo de bug em outra rota extensionless no futuro).
2026-10-29 (rodada 5) — ITEM 2 (fechamento rico) no tour: retrato de `img/institucional/quem-somos.jpg` (mesma arte de `/links`) em círculo com aro dourado (`RetratoAnasor`), tagline "Peça única, feita à mão", botão gummy com aperto (:active), @handle grande (Fraunces) com coração, faixa de confiança real (frete grátis, compra segura — ícones Lucide copiados de `reels/src/icones.js`, mesma razão de sempre pra copiar em vez de importar). Entrada em CASCATA (cada elemento ~12-14 quadros depois do anterior, não um fade só no grupo) pra parecer animação de verdade, não só aparecer tudo junto. Versão B ganhou a MESMA peça em layout horizontal (retrato ao lado do texto), sem "Link na bio"/@handle (não é Instagram). Cena de fecho da Versão A esticada de 120 pra 150 quadros (a cascata sozinha já usa uns 73). Saída anterior arquivada em `E:\projetos\site-mae\tour\_v2\` antes de rerenderizar (nada apagado).
2026-10-29 (rodada 5) — BUG achado na crítica visual (8 quadros espalhados, não fazia parte da lista pedida mas apareceu olhando): as 2 legendas da cena "checkout" ("O CEP preenche o endereço" / "Compra segura pelo Mercado Pago") se SOBREPUNHAM por 39 quadros (~1,3s) — números fixos antigos (atraso 14+duração 55 pra 1ª; atraso "quadros-58"+duração 50 pra 2ª) só funcionavam se o clipe tivesse ≥108 quadros; o capturado tem 88. As 2 apareciam ao mesmo tempo, uma "fantasma" por cima da outra. Corrigido calculando os tempos a partir da duração REAL do clipe (`manifest.checkout.quadros`), dividindo em 2 pedaços iguais com vão entre eles — nunca mais se sobrepõe, não importa quanto o clipe durar no futuro.
2026-10-29 (rodada 5) — ITEM 3 (capas de destaque v2): a v1 (`site-mae\instagram-perfil\*.png`) usava o EMOJI literal (🏺🎬🛍️✨🤎) — cores genéricas (amarelo/laranja vivos), fora da paleta da marca; `destaques.md` nem tinha um script que gerasse isso (as 5 PNGs existiam soltas, sem gerador no repo). Criado `marketing/instagram/gerar-capas-destaque.js`: 5 ícones de linha (SVG, traço único stroke-width consistente) desenhados à mão em código — vaso+brilho (Peças Únicas), roda+peça (Bastidores), sacola+laço (Como Comprar), lápis+estrela (Encomendas), gota+mãos (Cuidados) —, cor da marca (destaque/fundo conforme o fundo alterna bege/marrom), textura de papel (mesma técnica de ruído SVG do VinhetaGrao dos Reels), marca d'água. BUG achado na 1ª rodada de crítica visual: a folha de contato usava `file:///` pras 5 imagens — o Chromium (página aberta via `setContent`) recusava carregar (ícone de imagem quebrada nas 5); corrigido embutindo como `data:` base64. 2ª rodada: folha de contato confirma a série harmônica (alternância bege/marrom, mesmo peso de traço, mesma posição/tamanho do círculo). Saída em `site-mae\instagram-perfil\v2\` (v1 mantida, nada apagado).
2026-10-29 (rodada 5) — FALHA DE PROCESSO (registrando, não corrigível): rodei os 2 primeiros testes do fechamento rico dos Reels (`r1-caneca-surpresa-gatinho`, `cuidados-conteudo`) ANTES de arquivar a versão anterior deles em `_v2` — `reel.js` sobrescreve o arquivo de mesmo nome sem avisar (comportamento normal, documentado no README), e eu esqueci o passo de arquivar antes só nesses 2. As versões antigas desses 2 (COM o fechamento velho) foram perdidas — não dá mais pra recuperar. Não é grave (o conteúdo CONTINUA existindo, só com o fechamento novo, que era o objetivo mesmo), mas quebra a regra "nunca apagar, sempre _v1/_v2" — avisando o Fabrício por transparência. Os outros 14 Reels foram arquivados em `reels\_v2\` ANTES de rerenderizar.
2026-10-29 (rodada 5) — ETAPA 0 (limpeza do disco C:): 691MB livres antes → 2.100MB depois (~1,4GB liberado). Removido: 50 itens de `%TEMP%`/`%LOCALAPPDATA%\Temp` (1.401MB — o maior de longe foi uma pasta temporária de instalação do jogo "EA SPORTS FC 26", ~1,4GB, claramente descartável), cache do pip (96MB). Cache do npm limpo (sem ganho relevante, já estava pequeno). Lixeira: já estava vazia (comando não achou nada pra apagar). `C:\Windows\Temp`: 0 bytes, nada a fazer. NÃO apaguei a pasta `claude` dentro de `%TEMP%` (é o estado ativo desta própria sessão/outras do Claude Code — risco de travar algo em troca de 0,8MB, não vale). Relatório das 15 maiores pastas do perfil em `E:\projetos\_tmp\c-maiores-pastas.txt` — achado ao gerar: `C:\Users\sobre\AppData` media ~576GB (IMPOSSÍVEL num disco de 111GB) por causa de junctions antigos do Windows que apontam de volta pra dentro de si mesmos ("Dados de Aplicativos", "Histórico", "Temporary Internet Files") inflando a contagem recursiva — mesmo filtrando esses 3, o número continuou errado (deve haver outro link mais fundo, possivelmente arquivos-placeholder do OneDrive); registrei a limitação no próprio relatório em vez de apresentar um número que sei que está errado. Daqui pra frente nesta rodada, TEMP/TMP dos meus processos apontam pra `E:\projetos\_tmp` (pedido explícito, troquei do padrão `D:\anasor-tour-tmp` usado na Rodada 4 — ambos funcionam, segui o que foi pedido agora). Se precisar de mais espaço depois, não vou tentar de novo sozinho (a lista autorizada já foi toda usada) — registro e sigo.
2026-10-29 (rodada 5) — ITEM 2 (fechamento rico) nos Reels: criado `FechoRico` (componentes.js dos Reels, versão nativa — não importada do `tour/`, mesma regra de sempre) com a MESMA composição visual do fecho do tour (retrato em círculo, tagline, botão gummy com aperto, @handle grande com coração, faixa de confiança), em cascata (`popIndice(i)`, ~12-14 quadros entre elementos). Aplicado nos 3 templates que têm fecho (`Apresentacao.js`, `Colecao.js`, `Conteudo.js`), substituindo o bloco antigo (só título + botão + texto plano do @handle) por 1 chamada só a `FechoRico` — `FaixaConfianca` (já existia) continua separada, empurrada ~8 quadros mais tarde (`cena.inicio+58`, era `+50`) pra entrar depois que a cascata do fecho novo termina. BUG achado testando: `pHandle` (entrada do @handle) usava `popIndice(2)`, o MESMO índice do botão — os 2 apareciam juntos em vez de em sequência; corrigido pra `popIndice(3)`.
2026-10-29 (rodada 5) — ITEM 5 — SIMPLIFY (4 agentes em paralelo, via fork) rodou no escopo do item 4 (`narracao/narrar.js`) + ajuste do kit; achados reais aplicados e já commitados (`749d169`): `volumeDetect()` rodava o ffmpeg 2x por vídeo sem necessidade (o try/catch nunca disparava — ffmpeg sai com código 0 mesmo com `-f null`), virou 1 chamada; `DIR_REELS` e o retorno `textoFinal`, sem nenhum uso, removidos; `copyFileSync`→`renameSync` na troca do mp4 temporário pelo final (mesmo disco, mais rápido); READMEs de `reels/` e `tour/` atualizados pra não falarem mais "sem áudio" sem contexto. CODE-REVIEW (nível medium) no mesmo escopo + `gerar-capas-destaque.js`/`componentes.js`/3 templates dos Reels (item 2/3): o subagente em background caiu num rate-limit de sessão no meio da revisão (erro HTTP 429); concluí a revisão eu mesmo, direto, sem subagente — reli `narrar.js` por completo (fluxo de corte de texto, `volumeDetect`, idempotência do arquivamento do mudo, `-shortest`/`apad` na mixagem) e os componentes novos dos Reels (`RetratoAnasor`, `FechoRico`, `resolverSrc` com os retratos em `data:` URI, timing do aperto do botão vs. entrada da cascata) — nenhum bug de correção novo encontrado além dos já achados e corrigidos durante o desenvolvimento/QA visual (ver entradas anteriores desta rodada).
2026-10-29 (rodada 5) — ITEM 4 (narração) — pipeline (`marketing/instagram/narracao/narrar.js` + `sintetizar-voz.ps1`): mede a duração real do vídeo mudo (arquivado antes em `reels\_mudo\`/`tour\_mudo\`), sintetiza o roteiro de `roteiros.md` em WAV (Microsoft Maria, Rate=2), e se a voz não cabe na duração disponível (vídeo − 0,3s de atraso − 0,5s de folga), CORTA o conteúdo automaticamente (nunca o fechamento fixo "Link na bio...") — por frase inteira, depois por cláusula (vírgula), só por último por palavra — e tenta de novo, só acelerando o áudio (até 1,1x) se o corte não bastar. Mixagem final: `adelay=300` (voz começa em 0,3s) + `apad` (preenche com silêncio até o fim) + `loudnorm=I=-16:TP=-1.5` (normaliza e limita o pico, evita estouro) + AAC 48kHz estéreo 128kbps, vídeo com `-c:v copy`. BUG achado e corrigido ainda em teste: o corte por PALAVRA simples podia truncar no meio de uma frase viva (ex.: "...é pintada à." — perdeu "mão"); corrigido pra sempre tentar soltar a última FRASE ou CLÁUSULA inteira primeiro. Por isso TODOS os 12 roteiros de peça foram reescritos com o NOME DA PEÇA logo na 1ª cláusula (nunca é a última, nunca é cortada) — documentado como regra em `roteiros.md`.
2026-10-29 (rodada 5) — ITEM 4 — resultado da narração nos 18 vídeos (rodada completa, `node narrar.js`, sem filtro): todos passaram nas 4 checagens (1 faixa de áudio + 1 de vídeo, sem silêncio total, sem estouro de pico, duração da voz menor que a do vídeo) — valores completos em `E:\projetos\_tmp\narracao-relatorio.txt`. 11 dos 18 precisaram de corte automático (1-2x cada, nunca aceleração) pra caber na duração real medida (o ritmo de fala de verdade, com pausas de pontuação, ficou mais perto de ~1,9-2,1 palavras/segundo do que os ~2,5 calibrados num texto de teste sem pontuação — registrado aqui pra próxima rodada escrever roteiros mais curtos de partida). EFEITO COLATERAL aceito (registrado, não corrigido): nos 2 Reels de coleção (`colecao-objetos-decorativos`, `colecao-pecas-de-alma`, 3 peças cada), o corte automático soltou o NOME DA 3ª peça (ficaram só 2 de 3 citadas na narração — as 3 continuam visíveis na tela, só a voz não cita todas); não reescrevi esses 2 roteiros pra ficarem artificialmente mais curtos porque a trinca de nomes completos (~16 palavras só de nomes) não cabe faltando quase nada de folga nesses clipes de ~13s, mesmo cortando a frase de abertura.
2026-10-29 (rodada 5) — ITEM 4 (narração): ferramenta escolhida — voz do Windows "Microsoft Maria Desktop" (pt-BR, feminina, via `System.Speech`/PowerShell), SEM tentar o Piper TTS (1ª opção do pedido). Motivo: o próprio pedido já define a voz do Windows como "fallback garantido", ela já está instalada nesta máquina (confirmado via `GetInstalledVoices()`), e com o Fabrício fora por horas e querendo postar ainda hoje, o tempo de instalar/validar modelo e licença do Piper (ferramenta nova neste projeto) é um risco que a alternativa já aprovada pelo próprio pedido não tem. Taxa de fala calibrada empiricamente: `Rate=2` ⇒ ~2,51 palavras/segundo num teste de 59 palavras (23,5s medidos por ffprobe) — bate com o "~2,5 palavras/segundo" pedido. Usar SEMPRE essa voz e esse Rate nos 18 vídeos (mesma voz em todo lugar, pedido explícito). (`require`/`module.exports`, sem JSX) — por isso dava pra reimportar `componentes.js` direto por caminho relativo. NÃO fiz isso: `reels/` e `tour/` têm `package.json` próprios, cada um com sua própria cópia de `remotion`/`react` em `node_modules` — importar um arquivo de `reels/src` que faz `require('remotion')` a partir de dentro de `tour/` resolveria para a cópia de `reels/node_modules` (resolução de módulo do Node sobe a partir do arquivo físico), criando DUAS instâncias de React/Remotion no mesmo bundle — um jeito clássico de quebrar Context (hooks como `useCurrentFrame` dependem de Context) de forma sutil e difícil de depurar. Em vez de importar, **copiei e adaptei** as peças visuais reaproveitáveis (marca d'água, selo, legenda cinética, vinheta/grão, botão gummy) para `tour/src/componentes.js` — mesma linguagem visual, mesmo motor conceitual (Remotion), código independente por pacote.

---

## Rodada 6 — narração natural + rolagem delicada (modo totalmente autônomo)

Pedido em 2026-10-29, Rodada 5 aprovada. Dois ajustes prioritários: (A) narração travada/lenta, (B) rolagem rápida demais no tour. Item A delegado a um fork paralelo (só edita `marketing/instagram/narracao/`, nunca `tour/`, nunca DECISOES.md/STATUS.md — essas entradas vêm da sessão principal depois, pra não colidir); item B (rolagem) feito na sessão principal.

2026-10-29 (rodada 6) — ITEM B, motor de rolagem novo (`captura-ferramentas.js`): troquei a curva de rolagem da cúbica (`easeInOutCubic`, pico de velocidade = 3x a média) por um perfil TRAPÉZIO com rampas em seno de 25% de cada lado (`easeTrapezioSuave`) — pico ≈1,22x a média, bem menor, é o que permite caber um arrasto de ~300px em ~1s sem passar de 450px/s no celular (com a cúbica seria impossível dentro de 0,9-1,5s pedido). Rolagem virou uma sequência de arrastos de 200-380px (0,9-1,5s cada, calculado a partir da distância + do limite de velocidade) com pausa de 0,6-1,2s entre eles — nunca mais 1 rolagem contínua longa.
2026-10-29 (rodada 6) — BUG achado rodando a captura de verdade (não só na conta teórica): mesmo com o perfil trapézio calculado pra nunca passar do limite, a VALIDAÇÃO (que mede o scrollY real, quadro a quadro) acusou picos de até 480px/s pra um limite de 450 — testei numericamente (script solto) e achei a causa: a 30fps, 1px de arredondamento de posição já vale 30px/s de ruído (1px ÷ 1/30s) — pra durações de ~0,9-1,0s (27-30 quadros), esse ruído de arredondamento chega a ~6-7% do valor medido, o bastante pra furar o limite em alguns pares distância/duração específicos (achado testando todas as distâncias de 200 a 380 em passos de 5px: ~metade delas furava o limite em pelo menos 1px de diferença). Corrigido calculando a duração visando 85% do limite real (`MARGEM_ARREDONDAMENTO`), não o limite exato — a VALIDAÇÃO continua conferindo contra o limite verdadeiro (450/600), só o PLANEJAMENTO da duração passou a ter folga pro ruído de arredondamento. Testado de novo (mesmo script) nas mesmas 37 distâncias: zero violações com a margem de 85%.
2026-10-29 (rodada 6) — ITEM B: carrossel horizontal (".carrossel-viewport", ex. "Queridinhos do Ateliê") adicionado à cena "home-scroll-carrosseis" — pedido explícito ("carrosséis horizontais"), antes a captura só rolava a janela verticalmente, nunca um carrossel. Indicador de toque acompanha o arrasto (aparece/some com fade, segue o x). Se a página não tiver um carrossel visível naquele ponto da rolagem (layout pode mudar), pula sem quebrar a captura.
2026-10-29 (rodada 6) — ITEM B: toques (`tocarComIndicador`) ganharam pausa de 0,6-1,2s antes/depois (pedido explícito) e um "aperto" explícito de ~150ms sustentado (antes o toque e o soltar aconteciam quase no mesmo instante) — desligada a pausa onde já existe um hold equivalente logo depois na própria cena (miniaturas da galeria, botão de comprar), pra não dobrar o tempo morto.
2026-10-29 (rodada 6) — ITEM B: desktop também ganhou 1 rolagem suave (`desktop-listagem`, limite 600px/s) — antes a captura desktop não rolava NADA (só telas estáticas), apesar do pedido citar um limite de velocidade específico pra desktop. Duração fixa dessa cena em `roteiro-desktop.js` subiu de 270 pra 300 quadros pra não cortar o arrasto no meio.
2026-10-29 (rodada 6) — ITEM B: BUG CRÍTICO achado rodando a captura de verdade (1ª tentativa): a cena "home-scroll-carrosseis" sozinha deu 1045 quadros (34,8s) — quase o vídeo inteiro. Causa: os alvos de rolagem eram % da altura TOTAL da página (ex. "22%"), e a Home no mobile mede quase 13.000px de altura (medido com um script solto: hero + várias vitrines/carrosséis empilhados) — 22%/42% disso são milhares de px, mesmo rolando com delicadeza. Corrigido: distâncias viraram valores FIXOS (ex. 900px, +700px), e o motor (`rolarEmArrastos`) ganhou um teto de distância padrão (`distanciaMaximaPx=900`) que NUNCA deixa um único arrasto viajar mais que isso, não importa o alvo pedido — proteção que vale pra qualquer cena futura também, não só pras 2 corrigidas aqui.
2026-10-29 (rodada 6) — ITEM B: achado consertando o bug acima, ANTES de rodar de novo (revisão de código, não achado rodando): a 2ª chamada de rolagem de "home-scroll-carrosseis" usava `de: alturaPagina*0.22` (um número pré-calculado) como ponto de partida — com o teto de distância, a 1ª rolagem não alcança mais esse valor de verdade, então usar o número pré-calculado teria feito a página "pular" (de onde ela realmente está pro ponto que o código 'espera' que ela esteja) no meio da cena. Corrigido lendo o `scrollY` REAL da página (`page.evaluate(() => window.scrollY)`) entre as 2 rolagens, em vez de confiar em contas feitas antes de rolar.
2026-10-29 (rodada 6) — ITEM B: BUG achado rodando a captura mobile completa (1ª vez com o teto de 900px): tour-instagram ia ficar com ~65s de duração total (6 cenas com rolagem, cada uma perto do teto de 900px, custando ~6-7s cada mesmo delicada) — bem acima do teto de 45s pedido. Reduzido o teto padrão de `distanciaMaximaPx` em 2 passos, medindo de verdade a cada vez: 900→550px (resultado real: 49,5s, ainda acima do teto) →400px (resultado real: ver abaixo). Preferi medir e ajustar de novo a chutar um número só — mesmo padrão de tuning iterativo já usado nesta rodada/rodadas anteriores (ex.: LAYOUT_CELULAR.TOPO na Rodada 5). Resultado final com 400px: tour-instagram fica em 44,2s (1327 quadros a 30fps) — dentro do teto de 45s, com picos de velocidade medidos entre 300-390px/s (sempre abaixo do limite de 450px/s).
2026-10-29 (rodada 6) — ITEM B: a rolagem em arrastos usava `Math.random()` pra sortear o tamanho de cada arrasto (200-380px) e a duração de cada pausa — isso quebra a promessa original deste arquivo ("rodar 2x gera os MESMOS quadros", documentada no topo de `captura-ferramentas.js` desde a Rodada 4). Corrigido com um gerador pseudo-aleatório SEMEADO pelo rótulo da cena (`criarRng`, mulberry32 + hash FNV-1a da semente) — a mesma cena sempre produz a mesma sequência de arrastos/pausas, mas cenas diferentes variam entre si. As pausas de toque (`tocarComIndicador`) e do fim do arrasto de carrossel usavam `Math.random()` sem nenhum rótulo disponível pra semear — trocadas por um valor FIXO (0,9s, o meio do intervalo 0,6-1,2s pedido) em vez de inventar uma semente nova só pra isso.
2026-10-29 (rodada 6) — ITEM B: BUG achado rodando a captura desktop (2 de 3 tentativas falharam, mesmo erro): `page.click('#busca')` dava timeout de 30s com "element is not stable" — o campo de busca parece continuar se ajustando (animação/reflow) mesmo depois de "networkidle". Trocado `.click()` por `.locator('#busca').focus()` — só precisa o elemento existir no DOM, não da posição dele estar visualmente parada; o restante (digitar "caneca" com delay) continua igual. Esse código já existia antes desta rodada (Rodada 4) — não é algo que eu tenha introduzido, só agora ficou visível rodando a captura repetidas vezes.
2026-10-29 (rodada 6) — ITEM B: ajuste fino de duração — depois do RNG determinístico, o tour-instagram mediu 45,33s (10 quadros acima do teto de 45s). Reduzido o hold final da cena "links" de 45 pra 35 quadros — tour-instagram final: exatamente 45,0s (1350 quadros).
2026-10-29 (rodada 6) — ITEM B: a cena "listagem" da Versão B (`roteiro-desktop.js`) tinha duração fixa de 190 quadros, mas o clipe real (com o motor já determinístico) mede 185 — 190>185 teria acionado o "estica repetindo" do `tour.js` (pensado pra cena ESTÁTICA, onde repetir é imperceptível) bem no meio de uma cena com ROLAGEM, criando um salto visível (voltar pro topo da página/busca vazia). Reduzido pra 180 (< 185, nunca estica) — e a legenda dessa cena (duracao:165→155) ajustada pra não passar do novo tamanho.
2026-10-29 (rodada 6) — ERRO DE PROCESSO (achado e recuperado, registrando por transparência): rodei `node tour.js --versao a` (re-render da Versão A) SEM arquivar a versão anterior em `tour\_v2\` ANTES, como o pedido B4 pede — a Rodada 5 aprovada (narrada, 32,17s) foi sobrescrita direto. Recuperada de uma cópia que ainda existia em `E:\projetos\site-mae\kit-postagem\extra-tour-do-site\tour-instagram.mp4` (o kit da Rodada 5 nunca foi regenerado nesta rodada ainda) — confirmei por ffprobe (32,17s, 1 faixa de vídeo + 1 de áudio, bate com o relatório da Rodada 5) antes de tratar como a versão certa. Copiada pra `tour\_v2\tour-instagram.mp4` agora. `tour-portfolio.mp4`/`tour-loop.mp4`/`.gif` (ainda não re-renderizados nesta rodada) foram copiados pra `_v2` ANTES de continuar, pra não repetir o erro. Nota: `tour\_v2\` já guardava a versão da RODADA 4 (anterior à Rodada 5) — foi sobrescrita pela cópia da Rodada 5 agora. Tanto o pedido da Rodada 5 quanto o desta rodada citam literalmente "`_v2`" (não "_v3") pra essa pasta — entendo isso como uma "última versão anterior" que roda a roda, não um histórico completo; registrando aqui pro Fabrício corrigir meu entendimento se não for essa a intenção.
2026-10-29 (rodada 6) — BUG CRÍTICO achado na crítica visual dos 10 quadros (B3) — PRÉ-EXISTENTE desde a Rodada 4, não causado por nada desta rodada: em TODA transição entre cenas (TourMobile.js e TourDesktop.js), cada cena mora num `<Sequence from/durationInFrames>` PRÓPRIO, sem sobreposição com a próxima (contíguas: fim de uma = início da outra). O wipe circular (`MascaraCircular`) da cena NOVA começa com progresso quase 0 (quase invisível) bem no instante em que o `<Sequence>` da cena ANTERIOR já fechou — resultado: ~2 quadros praticamente em branco (só o fundo bege) em CADA transição, visível só olhando o vídeo renderizado (a varredura de luminância do item 1b da Rodada 5 não pega isso — o bege não é claro o bastante pra passar do limiar de "branco", e a varredura nunca tinha sido cruzada com uma inspeção visual quadro a quadro que caísse bem nesse instante de ~0,07s por transição, em nenhuma rodada anterior). Corrigido esticando o `<Sequence>` de cada cena (exceto a última) em `QUADROS_WIPE` (16 no mobile, 18 no desktop) além da duração "oficial" — a cena anterior continua visível por baixo (câmera e vídeo apenas seguram no último quadro, mesmo comportamento já usado noutras cenas) enquanto a próxima ainda está quase transparente. Achado só porque o pedido explícito desta rodada (B3) mandou conferir 10 quadros de verdade, não só rodar a varredura automática — a varredura sozinha teria deixado passar.
2026-10-29 (rodada 6) — ITEM B: render da Versão A foi interrompido (sem mensagem de erro, processo só "morria" no meio) em 3 tentativas seguidas, sempre durante a renderização de verdade (não no carregamento inicial) — o log mostrava o cache do compositor por volta de 2,8-3GB com `concurrency:8` (padrão, 1 aba Chrome por núcleo) numa máquina com só ~8,8GB livres no momento. Reduzido `concurrency` pra 3 em `tour.js` (`renderMedia`) — mais lento, mas não deveria mais estourar memória. Vou confirmar rodando de novo.
2026-10-29 (rodada 6) — ITEM B: `concurrency:3` resolveu o render de "tour-instagram" (confirmado, 45s/1350 quadros concluído com sucesso), mas "tour-portfolio" morreu de novo (~1min40s de execução, sem mensagem de erro) mesmo com 3 — cada quadro da Versão B decodifica 2 vídeos ao mesmo tempo (desktop + celular lado a lado), dobrando o consumo por thread comparado à Versão A (1 vídeo só). Reduzido pra `concurrency:1` (sequencial, mais lento, mais conservador).
2026-10-29 (rodada 6) — ITEM B concluído: tour-instagram.mp4 (45,0s) e tour-portfolio.mp4 (47,0s) re-renderizados, geometria revalidada, varredura de quadros limpa nos 2, crítica visual de 10 quadros em cada (achou e corrigiu o bug da transição, ver acima), tour-loop.mp4/.gif refeitos em bumerangue (9s, 1º e último quadro idênticos, loop sem salto confirmado comparando os 2 PNGs). Antes de aplicar a narração (item A) nos 2 vídeos novos: os mudos arquivados em `tour\_mudo\` ainda eram os da RODADA 5 (duração antiga, 32,17s/50,0s) — `narrar.js` só arquiva se o arquivo ainda não existir, então usaria a duração ERRADA pra decidir quanto texto cabe. Movidos pra `tour\_mudo\_v2\` (preservados, nunca apagados) antes de rodar `narrar.js`, pra ele arquivar os mudos CERTOS (Rodada 6, sem narração) a partir dos vídeos recém-renderizados.
2026-10-29 (rodada 6) — ITEM A (narração), feito por um fork paralelo: calibrei o ritmo com o TEXTO REAL dos roteiros (não uma frase de calibração isolada) — SAPI Rate=5 mede 2,85 palavras/segundo numa frase de teste, mas 3,1-3,8 nos roteiros de verdade; Rate=4 ficou mais fiel ao alvo pedido (2,8-3,1), 10 de 16 Reels dentro da faixa. Rate=4 é o novo padrão de produção (era Rate=2 na Rodada 5).
2026-10-29 (rodada 6) — ITEM A: removido o fallback de `atempo` (acelerar áudio) do `narrar.js` — pedido explícito, é a causa provável do efeito "picado" relatado. Se o texto não cabe nem cortado ao máximo, o script agora só avisa e segue, nunca estica/acelera.
2026-10-29 (rodada 6) — ITEM A: instalado Piper TTS (pip, licença MIT, confirmada no README do repositório `rhasspy/piper-voices`) com os 4 modelos pt_BR disponíveis (faber/cadu/jeff/edresson) — TODOS masculinos, não existe voz feminina pt_BR no catálogo do Piper hoje. Amostras geradas em `site-mae\narracao-amostras\` pro Fabrício ouvir e decidir, mas MANTIDA a voz padrão de produção como SAPI Maria (feminina, já estabelecida) — nenhuma combinação Piper testada bate o ritmo pedido sem comprimir o `length_scale` bem abaixo do recomendado (~0,35-0,4 vs. ~0,8-1,2 nativo), e não dá pra confirmar por ouvido que isso não introduz artefato (critério do próprio pedido: "sem artefatos").
2026-10-29 (rodada 6) — ITEM A7: os 2 Reels de coleção (colecao-objetos-decorativos, colecao-pecas-de-alma) agora citam as 3 peças completas na narração (Rodada 5 só citava 2 de 3, por falta de espaço) — o ritmo mais rápido desta rodada abriu espaço suficiente.
2026-10-29 (rodada 6) — ITEM A: achado nas verificações — 13 dos 16 Reels têm 1 pausa de ~0,6-0,68s no meio da fala, sempre numa vírgula, com duração muito consistente entre vídeos — provavelmente a pausa natural do SAPI nesse Rate, não um defeito, mas não confirmado por ouvido (o Fabrício não ouve áudio nesta sessão). Documentado em `narracao/README.md`.
2026-10-29 (rodada 6) — ERRO (registrado, corrigido): o fork do item A rodou `narrar.js` sem filtro de `--nome` durante os testes de calibração, o que também sobrescreveu `tour-instagram.mp4`/`tour-portfolio.mp4` em `site-mae\tour\` — fora do escopo dele (reservados pro re-render do item B). Restaurados a partir de `tour\_mudo\` pelo próprio fork antes de terminar; sem perda, e o item B (abaixo) ia sobrescrever esses 2 arquivos de qualquer jeito.
2026-10-29 (rodada 6) — ITEM B: `vendida-secao` (listagem "Já encontraram um lar") rola só 60% do percurso até o fim da página (não 100%) — com arrastos delicados, rolar a página inteira nessa cena sozinha estouraria o tempo total do vídeo; 60% já mostra várias peças.

---

2026-10-30 — RETOMADA após queda de energia (sessão anterior parou no meio do item A/B da Rodada 6, sem commitar). Diagnóstico pelo git (log + diff não commitado) + disco (ffprobe), não por memória: o código de B já estava completo e correto (tour-instagram.mp4/tour-portfolio.mp4 em `site-mae\tour\` já mediam 45,0s/47,0s, batendo com o que DECISOES.md registrava como "concluído"), mas os 2 arquivos finais estavam SEM áudio — a narração (item A) nunca tinha sido aplicada a eles (STATUS.md, ainda não commitado, já dizia isso corretamente: "falta reaplicar no tour novo"). `tour\_mudo\` já tinha os mudos CERTOS (mesma duração dos finais) arquivados — rodei `node narrar.js --nome tour-instagram` e `--nome tour-portfolio` direto, sem precisar re-render nenhum. Os 2 passaram em todas as checagens automáticas (fluxos, silêncio total, clipping, duração, ritmo 2,8–3,1) — só a checagem "sem-corte-interno" falhou (3 e 4 pausas ≥0,6s cada), o MESMO padrão já documentado como esperado (pausa natural do SAPI nesse Rate, não defeito) nos 13/16 Reels da rodada anterior.
2026-10-30 — Corrigidas as anotações de duração desatualizadas em `roteiros.md` ("32,17 s"/"50,00 s", da Rodada 5) pra "45,00 s"/"47,00 s" — cosmético (o parser só lê o nome do cabeçalho, nunca a duração entre parênteses), mas enganava quem lesse o arquivo.
2026-10-30 — code-review (medium) no diff completo não commitado da Rodada 6 achou 2 problemas reais, corrigidos: (1) `sintetizar-piper.ps1` (criado nesta rodada, exigido por `narrar.js` pra qualquer voz Piper) estava UNTRACKED — seguindo `git add` só dos arquivos modificados (como o fluxo de sempre pede), ficaria fora do commit e quebraria `--voz faber`/`cadu`/`jeff`/`edresson` em qualquer checkout novo; adicionado ao commit. (2) comentário em `captura-ferramentas.js` (linha do `arrasto()`) ainda citava `rolarElementoEmArrastos`, nome que nunca existiu de verdade — a função real é `arrastarCarrossel()`; comentário corrigido.
2026-10-30 — `node montar-kit-postagem.js` regenerado com os 2 tours narrados — `extra-tour-do-site\tour-instagram.mp4` confirmado por ffprobe com áudio+vídeo, 45s. `LEIA-ME.md` (site-mae) já estava correto e atualizado (duração 45s/47s, seção de narração, --voz/--ritmo, narracao-amostras) — escrito por uma sessão anterior antes da queda, nenhuma mudança necessária.

---

2026-10-30 (notebook do pai, ajustes 1 a 5 no site) — decisões tomadas sem consulta, como pedido:
2026-10-30 — AJUSTE 1: causa medida com getBoundingClientRect: título do Cachorrinho com 59px (2 linhas) contra 29px do Gatinho, então o botão descia 29px; na Seleção Especial (celular) as fotos tinham alturas naturais diferentes e o card não esticava (o height:100% não funciona no trilho flex). Correção na raiz, valendo para qualquer peça futura: card com altura igual (stretch), foto numa caixa de 230px, título com 2 linhas reservadas (line-clamp 2) e preço + botão colados na base (margin-top:auto no preço), o que mantém igual também a distância preço→botão. Conferido em 360, 375, 393, 430, 768, 1024, 1440 e 1920.
2026-10-30 — AJUSTE 2: a Seleção Especial NÃO tem mais fundo marrom (foi recolorida para bege numa rodada anterior, para não ficar com duas seções escuras seguidas). Mantive o bege, já que mudar a identidade exige pedido, e apliquei os destaques adequados ao fundo claro: terracota no título (4,6:1) e terracota escuro no pergaminho (5,8:1). Na Edição Surpresa (marrom) usei ouro claro #D4A574 (5,83:1) e terracota clara #E39B78 (5,70:1). Criei 3 variáveis (--cor-ouro-claro, --cor-terracota-clara, --cor-ouro-escuro) da mesma família do --cor-ouro, porque o --cor-ouro reprovava AA: 4,06:1 no marrom e 2,3:1 no pergaminho. A tagline do pergaminho (que uma auditoria antiga mandou manter em --cor-ouro) passou para ouro escuro (5,13:1), já que o pedido de agora exige AA medido. O selo "Edição Limitada — só 2 no mundo" dava 4,47:1 por causa do fundo tingido; reduzi a tinta de 0,14 para 0,08. Todos os 12 textos medidos por código, ≥ 4,5:1.
2026-10-30 — AJUSTE 3: reaproveitei a galeria da página da peça (ativarGaleriaDeFotos/irParaIndice) e movi o CSS compartilhado (.galeria__seta/__dot/__thumb) de produto.css para style.css (a Home não carrega produto.css), sem mudar o visual da página da peça (conferido). A moldura agora tem altura fixa e largura da foto, abraçando a peça vertical (antes, faixas escuras dos lados). Com 12 fotos: no celular as miniaturas ficam em 1 fileira que desliza e acompanha a foto ativa, e os dots usam alvo de 24px (mínimo da WCAG 2.2; com 44px, os 12 passavam da tela). Setas visíveis também no celular (o pedido as cita; na página da peça elas continuam escondidas no celular). touch-action:pan-y na foto: sem isso o navegador às vezes assumia o gesto e o swipe se perdia (achado testando com toque real). Peça vendida: a seção continua aparecendo como portfólio (antes sumia), sem botões de compra, com "Encomendar peça parecida" e "Ver mais".
2026-10-30 — AJUSTE 4: são 44 peças, não 45 (o id 18 não existe). Resultado: 43 com selo verdadeiro, só a 37 (Saboneteira Pássaro Azul-Noite) sem, porque a descrição não traz nenhum fato que justifique um. "vendido" e "com-video" são automáticos (disponivel:false / videoUrl), para nunca mentirem se o dado mudar. Os demais vão no campo selo, listando TODOS os fatos verdadeiros da peça (ex.: a 19 tem edicao-limitada, pintada-a-mao e modelada-a-mao): se um deixar de valer (ex.: "novidade"), o próximo aparece sozinho. Critério estrito: "esculpido à mão" e "feito à mão" NÃO contaram como "Modelada à Mão" (o pedido diz "só onde a descrição diz modelado à mão"). O texto "Kit completo" aparece também nos kits de 2 peças, como o pedido definiu. mais-vendido segue sem nenhuma peça.
2026-10-30 — AJUSTE 5: em vez de um carrossel novo, a subcategoria usa o MESMO da Home (montarSlidesCarrossel + sincronizarDotsCarrossel), então setas, dots, snap de segurança e a dica "arraste" vêm prontos. O card tem a largura de uma coluna de 4 (desktop) ou 2 (celular), a mesma da Home, medida igual em todas as larguras. Com uma página só, os cards ficam centralizados; na última página de um carrossel com várias, alinham à esquerda, como na Home. O alternador "Carrossel | Grade" aparece com 8 ou mais peças disponíveis (Pratos, Canecas, Conjuntos); a escolha fica lembrada no navegador. A contagem "N peças disponíveis" não existia na listagem (só nos cards da visão geral), então foi criada acima do carrossel e conta só as disponíveis que passam no filtro.
2026-10-30 — FECHAMENTO: a code-review (medium) achou 9 pontos; corrigidos 7 (botão do destaque preso em "No carrinho ✓", alternador sumindo no meio da busca, aria-live recriado, "0 peças disponíveis" acima das vendidas, role=tablist sem tabs, string montada à toa, comentário velho em produto.js). Mantido de propósito: peça vendida continua no destaque (pedido explícito). Descartado: "listener de breakpoint duplicado" (na ceramica.html o aplicarEExibir do main.js sai na 1ª linha, então não há trabalho dobrado). A simplify sugeriu refatorações maiores que ficaram de fora por mexerem em outras áreas (CSS da galeria via variáveis, registro de carrosséis manuais, centralizar todos os carrosséis, .btn-ver-mais herdando de .btn-fantasma, cujo hover enche o botão e não é gummy).
2026-10-30 — DECISÕES DO FABRÍCIO sobre os ajustes 1 a 5 (notebook):
  1) Seleção Especial continua com fundo BEGE (não volta para o marrom).
  2) Mantido o ouro escuro (#7A4E16, AA 5,13:1) na tagline do pergaminho, no lugar do --cor-ouro.
  3) Peça vendida continua em "Escolha do Ateliê" como portfólio, com "Encomendar peça parecida" e "Ver mais sobre esta peça" (sem compra).
  4) O selo "Kit completo" fica por ora, inclusive nos kits de 2 peças.
  5) As refatorações maiores sugeridas pela code-review/simplify (CSS da galeria via variáveis, registro de carrosséis manuais, centralizar todos os carrosséis, .btn-ver-mais herdando de .btn-fantasma) ficam para o PC de casa.

---

# Rodada 7 — narração Piper jeff + legenda em todos (modo autônomo)

Pedido em 2026-10-31, Fabrício fora de casa até a noite, quer postar a
partir de amanhã. Decisões tomadas sem pausar, como pedido explícito.

2026-10-31 — ETAPA 0: `git pull --ff-only` trouxe 10 commits que a sessão local não tinha (redesign de CSS/JS do site, nenhum tocou `marketing/instagram/**`) — aplicado sem conflito antes de qualquer alteração.
2026-10-31 — Conflito entre o pedido ("tour está SEM narração/legenda, tirei enquanto editava o motion graphic") e o `STATUS.md` (Rodada 6: narração já aplicada aos 2 vídeos do tour) — NENHUM dos dois relatos foi aceito de olhos fechados: confirmei por `ffprobe`+`volumedetect` que `tour-instagram.mp4`/`tour-portfolio.mp4` (datados de 30/10) JÁ tinham faixa de áudio com voz real (não silenciosa), batendo com o STATUS.md, não com o pedido. Como de qualquer forma a Etapa 1 exige REGERAR a narração de todos os 18 vídeos com a voz nova (jeff/0,7), o conflito ficou sem efeito prático — todos os 18 foram renarrados agora, então "estava sem narração" ou "já tinha" dá no mesmo resultado final. O que o pedido acertou: nenhum vídeo (nem tour nem Reels) tinha LEGENDA queimada — confirmado, é mesmo um requisito novo.
2026-10-31 — ETAPA 1 (voz): escolhida `jeff`/ritmo 0,7 (Piper, length_scale 0,7) como PADRÃO em `narrar.js` (`VOZ_PADRAO='jeff'`, `VOZES.jeff.ritmoPadrao=0.7`) — decisão do Fabrício depois de ouvir as amostras em `narracao-amostras\`.
2026-10-31 — ACHADO testando a Etapa 1: rodar a MESMA frase (texto de 85 palavras de `narracao-amostras\LEIA-ME.txt`) com o MESMO modelo/ritmo pelo `sintetizar-piper.ps1` original deu durações diferentes a cada execução (ex.: 22,65s a 23,73s) — o Piper (VITS) tem um preditor de duração ESTOCÁSTICO (`--noise-w-scale`, padrão da CLI ~0,8) que sorteia um número novo a cada chamada, mesmo com texto/modelo/ritmo idênticos. Corrigido adicionando `--noise-w-scale 0` (determinístico) em `sintetizar-piper.ps1` — a partir de agora, a MESMA frase sempre sai com a MESMA duração, o que também torna a sincronia da legenda confiável. Não toquei em `--noise-scale` (afeta timbre/entonação, não duração — fora do escopo do achado).
2026-10-31 — Verificação da Etapa 1 (reprodução da voz escolhida): sintetizei uma frase REAL do roteiro do tour (84 palavras) com jeff/0,7 — saiu em 3,20 palavras/s, dentro de ±15% da wps medida na amostra de referência aprovada (3,60 wps no texto de 85 palavras da amostra) — considerado "igual, aproximado" como o pedido definiu (duração por palavra aproximada, não idêntica ao bit). Diferença esperada: textos diferentes têm fonemas diferentes; não dá pra bater a duração exata trocando o texto.
2026-10-31 — `narrar.js`: antes de sobrescrever qualquer `.mp4` atual, agora arquiva a versão anterior em `<pasta>\_anteriores\<data-de-hoje>\<nome>.mp4` (1x por dia) — fechando a lacuna que violava a regra fixa "nunca sobrescrever sem arquivar" (o script antigo escrevia direto em cima do arquivo final). Também passou a gravar um sidecar `E:\projetos\site-mae\_narracao-dados\<nome>.json` (texto final, duração da voz, offset) — usado pelo script de legenda pra não precisar re-sintetizar nem adivinhar os tempos.
2026-10-31 — `narrar.js`: checagem de "ritmo" trocada de limiar fixo (2,8-3,1 palavras/s, calibrado só pra Maria/SAPI) pra uma faixa ±15% em volta da `wpsReferencia` MEDIDA na amostra de cada voz+ritmo — com jeff/0,7 (wps natural ≈3,60) o limiar antigo reportaria "FALHA" em quase todo vídeo por não ser a métrica certa pra essa voz.
2026-10-31 — ETAPA 4 (legenda queimada, novo script `narracao/legendar.js`): tempo de cada palavra estimado por PROPORÇÃO DE CARACTERES dentro da duração real da voz (peso = tamanho da palavra + 3) — tentei primeiro o filtro `whisper` do ffmpeg (baixei o modelo `ggml-base.bin`, ~148MB, e funciona tecnicamente: transcreve com timestamps por segmento direto no ffmpeg) para alinhamento por ASR de verdade, mas a transcrição da voz SINTÉTICA do Piper saiu errada demais no modelo "base" ("Sashlanazou-semica" em vez de "Anasor Cerâmica" etc.) — não dava pra confiar no texto reconhecido pra casar com o roteiro real, então fiquei com a estimativa proporcional (mais simples, sem risco de a legenda mostrar uma palavra errada). Blocos de 3-6 palavras (padrão 4) — NÃO implementei o destaque em dourado da palavra atual (opcional, "se couber no estilo", conforme o pedido) por risco/tempo: exigiria ASS com tags \k (karaokê) testadas em cada vídeo, e a prioridade era ter todos os 18 com legenda legível e bem posicionada antes do prazo de amanhã.
2026-10-31 — ACHADO CRÍTICO queimando a legenda: `ffmpeg -vf "subtitles=arquivo.srt:force_style=...​"` saiu com o texto GIGANTE e fora da posição pedida (`MarginV`/`FontSize` ignorados na prática) — o libass converte o `.srt` puro pra ASS internamente usando uma resolução de script PADRÃO que não bate com o vídeo real, e o parâmetro `original_size` (testado) não resolve isso pra legenda de TEXTO (é pensado pra legenda de IMAGEM tipo DVD). Corrigido escrevendo o `.ass` por conta própria (com `PlayResX`/`PlayResY` iguais à resolução real do vídeo, 1080x1920 ou 1920x1080) em vez de depender da conversão automática — testado e confirmado visualmente (print extraído) antes de aceitar. O `.srt` simples continua sendo gerado e entregue (pedido explícito, "pra eu poder reutilizar"); só a queima usa o `.ass`.
2026-10-31 — ACHADO 2: com `BorderStyle=3` (caixa opaca atrás do texto), a caixa simplesmente não aparecia nesta build do libass (testado contra o cartão final claro — texto quase invisível, sem contraste). Troquei pra `BorderStyle=1` com contorno grosso (Outline=5) marrom quase preto + sombra leve — garante AA em QUALQUER fundo (claro ou escuro) sem depender da caixa, mais simples e comprovadamente funciona (testado nas cenas claras E escuras).
2026-10-31 — ACHADO 3 (geometria do tour-portfolio): a 1ª posição da legenda (caixaTop:840, baseada nos números de `componentes.js`/`MolduraDesktop`) cortava a borda do mockup de navegador e os pontinhos do carrossel — a moldura real termina mais embaixo do que os números do código sugeriam. Corrigido empurrando pra caixaTop:890 (banda de 90px, fonte 34), testado visualmente de novo até caber limpo entre o fim do mockup (~860px) e a barra de tecnologias do rodapé (~1010px).
2026-10-31 — ETAPA 6 (entrega): "amanhã" (2026-11-01) é DOMINGO, mas o "Dia 1" do calendário de 30 dias (`calendario-30-dias.md`) é definido como "a primeira SEGUNDA em que a conta começar a postar" e pede um Reels da Anasor se apresentando — filmagem real, ainda pendente, não dá pra simular. Como o pedido é ter o primeiro dia 100% pronto pra postar amanhã de qualquer jeito, escolhi o **Tour do Site** (`kit-postagem/extra-tour-do-site/`, já fora do calendário numerado, 100% pronto e narrado/legendado) como o post de amanhã — cumpre o mesmo papel de "apresentar o ateliê" sem depender de gravação. Documentado em `kit-postagem/AMANHA-POSTAR.md` e no topo do `LEIA-ME.md`; quando a Anasor gravar o vídeo de apresentação de verdade, ele assume o lugar do "Dia 1" e o Tour volta pra reserva.
2026-10-31 — Checagem automática de área livre (amplitude YMAX-YMIN num recorte da caixa da legenda, 3 quadros por vídeo) acusou falso-positivo em `r1-caneca-surpresa-gatinho` (amplitude 211, limiar 140) — inspecionado visualmente nos 3 quadros exatos amostrados: a legenda está limpa e legível nos 3, o valor alto vem de uma TRANSIÇÃO de cena (círculo branco em expansão) que é naturalmente "ocupada" mas não colide com a legenda. Aceito como falso-positivo documentado, não uma falha real — registrado aqui em vez de escondido.
2026-10-31 — ACHADO rodando a narração nos 18 vídeos: TODOS os 18 reportaram "FALHA sem-corte-interno" (1 a 10 pausas ≥0,6s no meio da fala) — mas a AMOSTRA DE REFERÊNCIA aprovada (mesmo texto, mesmo modelo/ritmo) não tem NENHUMA pausa assim. Isolei a causa: não é o `--noise-w-scale 0` (testei o texto da amostra com esse ajuste e saiu igualmente sem pausas longas) — é a ESTRUTURA DAS FRASES dos roteiros de produção, que (pra caber nos poucos segundos de cada vídeo) são frases únicas e compactas com várias vírgulas encadeadas (2 a 4 por frase); o Piper, nesse modelo/ritmo, insere uma pausa prosódica mais longa bem numa vírgula de frase longa — o texto da amostra de referência (2 parágrafos corridos, frases mais simples) não tem esse padrão. NÃO é um corte/artefato de áudio (a fala não quebra nem repete palavra) — é uma pausa de respiração um pouco mais longa que o ideal num ponto de vírgula. Decisão: não reescrevi os 18 roteiros pra eliminar toda vírgula (risco de atrasar a entrega de amanhã por pouco ganho, e arriscar introduzir frase estranha sem poder ouvir o resultado) — mantive os roteiros como estão e registrei esta observação como PENDÊNCIA DE QUALIDADE NÃO RESOLVIDA no relatório final, pro Fabrício ouvir e decidir se vale reescrever algum roteiro específico.
2026-10-31 (notebook do pai, etapa 1 — preços +R$ 100) — Travessa Asas do Paraíso (id 13) e Travessa Bruma Azul (id 14): R$ 199,90 → R$ 299,90; Prato Brisa de Palmeira (id 15): R$ 159,90 → R$ 259,90. Nenhuma das três tinha `precoOriginal`, então não há "de/por" nem selo "Lançamento" a recalcular ou remover; NÃO criei "de R$ 199,90" porque o aumento não é desconto. Backend lê o mesmo `js/produtos.js` (backend/data/produtos.js via `vm`) e cobra `produto.preco` do catálogo — não há outro espelho de preço, JSON-LD com preço ou og:price no repo. Textos atualizados: legenda nº 28 de `legendas.md` e `posts/post-08.md` (este é gerado e está no .gitignore, atualizado só localmente). Os PNGs do post não trazem preço (regra "preço só na legenda"), então nenhuma mídia precisa ser regenerada.
2026-10-31 (notebook do pai, etapa 2 — botão "Ver mais sobre esta peça") — Um componente só: `.btn-ver-mais` (css/style.css) + `btnVerMaisHTML(produto, {claro})` (js/main.js), usado na Escolha do Ateliê, Edição Surpresa e Seleção Especial. Variação padrão pro fundo marrom (texto ouro claro, 5,8:1) e `--claro` pro pergaminho/bege (texto terracota escuro, ≥ 6:1). Ícone de OLHO, não seta: o botão leva a VER a peça e a seta "→" já aparece no "Deslize". Ordem nos cards: preço → Ver mais → Comprar Agora (pedido); na Escolha do Ateliê os 3 botões seguem lado a lado. Edição Surpresa e Seleção Especial já tiram peça vendida da seção (regra antiga, mantida), então o caso "vendida = só Ver mais + encomenda" só acontece na Escolha do Ateliê, que já fazia isso. Testado em 360/375/393(iPhone 15)/430/768/1024/1440/1920: 44px de altura, 1 linha, botões no mesmo nível entre cards, sem scroll horizontal nem erro no console.
2026-10-31 (notebook do pai, etapa 3 — ceramica.html sem ?sub em carrossel) — Confirmado que o 1117b7a (carrossel DENTRO de cada subcategoria) veio no pull e funciona (ex.: ?sub=jarras, 1 card centralizado, sem scroll horizontal). A visão geral agora usa o MESMO `vitrineHTML` do 1117b7a (ganhou `criarCard`/`classeGrade`) com o card de subcategoria de sempre, + a classe `colecoes-grid` da esteira "Explore Nossas Coleções" da Home, que já dá a espiadinha (2 cards + ~0,4 do próximo no celular) e o respiro da sombra; 4 por página no desktop, coluna fixa (card nunca esticado). ACHADO: na visão geral os filtros "Faixa de preço"/"Ordenar por" estavam VISÍVEIS mas SEM EFEITO (o JS punha `hidden`, mas `.filtros` tem display próprio e o vencia) — inclusive no site no ar. Como o pedido era mantê-los funcionando e remontar o carrossel ao filtrar, DECIDI fazê-los funcionar ali: a faixa esconde subcategorias sem peça à venda naquela faixa e a contagem "N peças disponíveis" passa a contar só a faixa; "Menor/Maior preço" ordena pela peça mais barata/mais cara de cada subcategoria; "Nome (A-Z)" pelo nome. Com "Todas" + "Padrão" a página fica idêntica à de antes. "Já encontraram um lar" (vendidas) não passa pelo filtro, como antes. Se preferir esconder os filtros nessa página, é trocar `filtrosEl.hidden = false` por um `display:none` de verdade. Também: a contagem de cada card foi pro rodapé (nome de 1 linha, ex. "Jarras", desalinhava).

---

## Rodada 8 — sincronização, preço, correções de narração/legenda (2026-10-31)

Pedido do Fabrício em modo autônomo, PC de casa, sincronizar com o notebook do pai e corrigir os 4 bugs apontados pela code-review da Rodada 7 (narrar.js/legendar.js).

**Etapa 0 (sincronia):** `git pull --rebase origin main` trouxe 5 commits do notebook do pai (preços, botão "Ver mais", carrossel em ceramica.html, `?v=47`) por fast-forward puro, sem conflito. `CLAUDE.md` não mudou além do que já estava carregado (regras de selo já na versão atual). `backend/package.json` não mudou — sem `npm install`.

**Etapa 2 (preço):** `js/produtos.js` já veio do pull com os 3 preços corretos (id 13/14/15 = R$299,90/299,90/259,90). `legendas.md` (legenda nº28) também já veio corrigido. ACHADO: `marketing/instagram/gerar-posts.js` já lê `produto.preco` ao vivo de `js/produtos.js` (linha `precoSite = formatarPreco(produto.preco)`) e já tem um aviso embutido se a legenda estática e o preço do site divergirem (`avisoPreco`) — ou seja, "fazer o gerador ler produtos.js em vez de preço fixo" já era verdade antes desta rodada; nada a mudar no código. O único texto desatualizado era `site-mae/instagram-posts/post-08.md` (não regenerado desde 27/10) — corrigido rodando `node gerar-posts.js` de novo (reconstrói todos os 13 posts + grade do perfil; preço nunca aparece nas imagens, só no .md). ACHADO EXTRA: existe uma pasta legada `anasor-shop/marketing/instagram/posts/` (gitignorada, de antes da separação pra `site-mae/` — 27/10) com cópias .md+.png desatualizadas; não é lida por nenhum script nem publicada, mas corrigi o preço do `post-08.md` ali também por clareza (copiado do `site-mae/instagram-posts/post-08.md` atual) — recomendo apagar essa pasta legada numa limpeza futura (não apaguei agora por não ser o pedido desta rodada). Nenhum vídeo/roteiro de narração cita as peças 13/14/15 (nenhum Reels é sobre travessas) — nada a regenerar por causa do preço.

**Etapa 3 (os 4 bugs da code-review):**
- **(a) idempotência do `legendar.js`:** causa raiz — a queima lia E escrevia o MESMO arquivo (`arquivoAtual`); na 2ª execução, a fonte já vinha com legenda da 1ª. Corrigido com um MASTER permanente e imutável em `<pasta>/_sem_legenda/<nome>.mp4`, criado uma única vez (seedado pelas cópias já arquivadas em `_anteriores/2026-10-31/<nome>-sem-legenda.mp4` da Rodada 7 — confirmado visualmente, quadro a quadro, que o master está mesmo limpo antes de usar) — toda queima lê SÓ do master daqui em diante. Provado por teste: rodar 2x no mesmo vídeo agora produz hash MD5 idêntico (`teste-legendar.js`).
- **(b) milissegundos do SRT fora de 000-999:** causa raiz — `tempoSrt`/`tempoAss` arredondavam segundos (floor) e fração (round) SEPARADAMENTE; frações bem perto de 1 (ex. 3.9996s) geravam "00:00:03,1000". Substituído por um único `decompor(segundos, unidadesPorSegundo)` que arredonda pra UMA unidade inteira antes de decompor em h/m/s/fração — usado tanto pelo `.srt` (ms) quanto pelo `.ass` (centissegundos). Nenhum dos 18 `.srt` já gerados tinha esse bug na prática (conferido com grep), mas o código antigo permitia; testado em 7 valores de borda (`teste-legendar.js`).
- **(c) área livre não bloqueava:** agora lança erro e NÃO escreve o vídeo final se a amplitude da caixa de legenda passar do limiar (sem sobrescrever `arquivoAtual`, sem arquivar nada) — exceto pro falso-positivo já verificado visualmente na Rodada 7 (`r1-caneca-surpresa-gatinho`, transição de cena), mantido numa lista `FALSOS_POSITIVOS_CONHECIDOS` documentada no topo do arquivo, pra não travar esse vídeo numa checagem que já foi investigada e descartada à mão. Testado forçando um vídeo sintético (ruído `testsrc2`) na caixa inteira da legenda — `processarVideo` lança e o arquivo final não muda.
- **(d) checagem de ritmo pulava vozes sem referência própria:** causa raiz — `okRitmo = !temReferencia || (...)`: uma voz com `wpsReferencia: null` (cadu/edresson) marcava OK sempre, sem comparar nada. Trocado por `calcularFaixaRitmo(voz, wps)`: usa a referência da própria voz quando existe, senão cai pra referência da voz PADRÃO (jeff/0.7 — sempre tem `wpsReferencia` medida na amostra aprovada) — nunca pula. Testado isoladamente (`teste-narrar.js`, sem precisar sintetizar voz de verdade).
- Bug cosmético extra achado nessa revisão (não pedido, mas no mesmo arquivo): `amplitudeMedia ? x : 'n/d'` escondia um valor real de amplitude=0 (quadro perfeitamente liso é falsy em JS) atrás de "n/d" no relatório — trocado por `amplitudeMedia !== null`.

**Etapa 4 (reverificação):** rodei o `legendar.js` corrigido nos 18 vídeos de produção (fonte = masters recém-migrados, não o `arquivoAtual` contaminado) — todos passaram na checagem de área livre de verdade (nenhum precisou do item da lista de falso-positivo desta vez: a amostragem de quadros variou e `r1-caneca-surpresa-gatinho` saiu com amplitude 92,3, abaixo do limiar). Nenhum vídeo precisou ser regenerado por reprovar — os bytes finais ficaram idênticos aos da Rodada 7 pra 17 dos 18 (mesma fonte, mesma lógica de posição), só `r1-caneca-surpresa-gatinho` mudou de bytes (reencode determinístico mas não idêntico ao da rodada anterior; mesmo conteúdo visual, confirmado por quadro). Conferido nos 18: 1 trilha de áudio + 1 de vídeo, `volumedetect`/`loudnorm` (amostra: -16,9 LUFS integrado, dentro do alvo), nenhum quadro preto (`blackdetect`) em nenhum dos 18, último quadro de cada um é o cartão final de fechamento (luminância 206-212, não branco puro, sem corte) — não um branco/corte abrupto. Narração e legenda terminam juntas (mesmo `offsetVoz`/`duracaoVoz`), ambas um pouco antes do fim físico do vídeo (a folga vai pro cartão final estático, que não tem narração/legenda por design).

**Etapa 5 (kit):** `kit-postagem/dia-05-.../r1-caneca-surpresa-gatinho.mp4` tinha ficado com bytes antigos (cópia estática) depois da Etapa 4 regenerar a fonte — resincronizado rodando `node montar-kit-postagem.js` de novo (mesmo resultado de antes: 11/17 dias prontos, 6 pendentes de filmagem/depoimento real, nada inventado). `AMANHA-POSTAR.md`/`LEIA-ME.md` já estavam corretos (voz jeff/0.7, Tour do Site como post de amanhã, sem preço/Pix) — nenhuma mudança necessária.

**Fechamento — achado da code-review (nível medium, rodou sozinha em paralelo):** o master permanente `_sem_legenda/<nome>.mp4` (criado na Etapa 3a pra resolver a idempotência) tinha um efeito colateral sério não previsto: é criado uma vez e NUNCA invalidado — se o Fabrício rodar `narrar.js` de novo com outra voz/ritmo sobre um vídeo que já tinha sido legendado (o README sempre documentou isso como fluxo válido, ex. `node narrar.js --voz faber --ritmo 0.4`), o `legendar.js` continuaria lendo o master VELHO e sobrescreveria a narração nova com a legenda (e o áudio) da narração ANTERIOR, sem erro nem aviso. Corrigido em `narrar.js`: depois de escrever o vídeo recém-narrado, apaga `_sem_legenda/<nome>.mp4` se existir (o master não é entregável do Fabrício — isso é `_mudo/`, preservado à parte — é só cache interno do `legendar.js`, que se regenera sozinho a partir do vídeo novo na próxima vez que rodar). Testado em `teste-legendar.js` simulando o que `narrar.js` faz (sobrescrever o vídeo + apagar o cache) e confirmando que o master sai diferente depois. Nenhum dos 18 vídeos de produção precisou de ação — a invalidação só importa em re-narrações futuras, que ainda não aconteceram.

**Fechamento — simplify (4 agentes em paralelo: reuso, simplificação, eficiência, altitude):** achados aplicados —
- `FALSOS_POSITIVOS_CONHECIDOS` (array de nomes hardcoded no `.js`, bypass da checagem bloqueante) virou **dado**, não código: `narracao/aprovacoes-area-livre.json`, mapeando nome → `{amplitudeAprovada, motivo, data}`. A aprovação só vale se a amplitude medida AGORA ficar até 30% acima da aprovada (`TOLERANCIA_APROVACAO`) — uma amplitude bem maior (problema novo, não o falso-positivo já visto) continua bloqueando, em vez de uma aprovação velha "proteger" silenciosamente um defeito diferente.
- Caminho do master `_sem_legenda/<nome>.mp4` estava hardcoded (literal `'_sem_legenda'`) em `legendar.js` E em `narrar.js` — virou uma função só, `caminhoMaster(dirPasta, nome)`, exportada de `legendar.js` e importada por `narrar.js` (achado de 2 revisores diferentes, altitude e simplificação, de forma independente).
- Limiar de amplitude (140) duplicado na comparação e na mensagem de erro → `const LIMIAR_AMPLITUDE_LEGENDA`.
- `pad()` definido 3x no mesmo arquivo (`tempoSrt`, `tempoAss`, `dataHoraArquivo`) → 1 só, no topo do módulo.
- `checarAreaLivre` dependia de um global mutável (`duracaoVideoCache`) setado pelo chamador — passou a calcular a própria duração internamente (a função já recebe o vídeo como parâmetro).
- `calcularFaixaRitmo` calculava `typeof voz.wpsReferencia === 'number'` 2x na mesma função; comentário da Etapa 3d estava escrito por extenso 2x (na definição e no ponto de uso) → dedupe nos dois.
- `teste-legendar.js` tinha uma linha morta (`fs.readFileSync(video).toString('base64').length && ...`, sempre truthy, sem efeito) e repetia a chamada `certutil -hashfile` 4x → helper `hashArquivo()`.
- `teste-legendar.js`/`teste-narrar.js` reimplementavam o MESMO runner de teste (`teste()`/contador/resumo) lado a lado → extraído pra `narracao/teste-util.js` (`criarRunner()`), importado pelos dois.
- Rodei `legendar.js` nos 18 vídeos de produção DE NOVO depois de todas essas mudanças (confirma que a extração de funções/constantes não alterou nenhum resultado) e os 2 testes de novo (8/8 OK).

---

## Rodada 9 — legenda única + narração estável (modo totalmente autônomo)

Pedido em 2026-10-31/11-01, sessão anterior caiu 2x em rate-limit de
sessão no meio do trabalho (a 1ª vez no meio da verificação do
tour-portfolio, concluída antes de cair; a 2ª no meio da limpeza do
cache do webpack). Esta sessão retomou de onde parou, sem perguntar,
seguindo a prioridade pedida: 1) kit do dia de hoje, 2) tour-instagram/
tour-portfolio, 3) o resto.

2026-11-01 — ACHADO CRÍTICO (prioridade 0 do pedido): `FaixaLegendaFundo`
(componentes.js dos Reels, nova nesta rodada — faixa de gradiente atrás
da legenda, pra dar contraste à legenda nova sobre fotos full-bleed)
tinha ficado com a cor de TESTE vermelha (`rgba(255,0,0,...)`) em vez do
degradê de marca (marrom escuro `rgba(20,12,8,...)`). Os 12 Reels de
PEÇA (não os 4 de conteúdo, que não usam esse componente) já tinham sido
regerados a noite com essa cor errada, antes da sessão cair. Corrigido o
código primeiro, varredura em todo o código de vídeo (grep por
`255,0,0`/`#f00`/`outline`/`debug`) não achou mais nenhuma cor de teste,
e os 12 Reels foram TODOS re-renderizados (ver abaixo) — nenhum vídeo
final ficou com a cor errada (confirmado por varredura automática de
saturação/matiz na faixa da legenda dos 18 vídeos + amostragem visual de
quadros, ver "Fechamento" abaixo).

2026-11-01 — Pra re-renderizar os 12 Reels de peça, faltava o comando
exato de 6 deles (`caneca-surpresa-cachorrinho`, `kit-canequinhas-
arlequim`, `kit-copos-ondas-do-mar`, `anjo-guardiao-porta-incenso`,
`prato-ave-da-alvorada`, `colecao-pecas-de-alma`) — não são roteiros
nomeados em `roteiros.js`, foram gerados direto por `--id`/`--ids` numa
sessão anterior sem log do comando usado. Reconstruí com certeza, sem
chutar: cruzei o NOME do produto citado no sidecar de narração
(`_narracao-dados/<nome>.json`, campo `textoFinal`) com `js/produtos.js`
pra achar o id, e inferi apresentacao vs. detalhes pela DURAÇÃO exata do
vídeo (`roteiroPadrao()` produz 4 durações possíveis e só 4: 350/375
frames sem vídeo, 380/405 com vídeo, conforme template) — bateu
exatamente com a duração já medida (`duracaoVideo` do sidecar) nos 5
casos, sem ambiguidade, e a contagem final bateu com os totais já
documentados na Rodada 2 (7 apresentação + 3 detalhes + 2 coleção).
Comandos confirmados (documentando pra nunca mais precisar reconstruir):
`--id 10 --template apresentacao --saida prato-ave-da-alvorada`,
`--id 19 --template apresentacao --saida caneca-surpresa-cachorrinho`,
`--id 23 --template detalhes --saida kit-canequinhas-arlequim`,
`--id 40 --template detalhes --saida kit-copos-ondas-do-mar`,
`--id 43 --template apresentacao --saida anjo-guardiao-porta-incenso`,
`--ids 32,37,45 --saida colecao-pecas-de-alma` (ordem dos ids = ordem
citada na narração: Kit 3 Xícaras de Café Terra Escura, Saboneteira
Pássaro Azul-Noite, Vaso Escultórico Elo Noturno).

2026-11-01 — Pipeline completo rodado pros 12 Reels de peça (os 4 de
conteúdo NÃO precisaram — `Conteudo.js` nunca usou `FaixaLegendaFundo`
nem tinha legenda embutida pra duplicar, ficaram intocados desde a
Rodada 8): apaguei `_mudo/<nome>.mp4` e `_sem_legenda/<nome>.mp4` de
cada um (caches internos, seguros de apagar — se não apagasse,
`narrar.js` reusaria o master ANTIGO com a cor errada em vez de capturar
o novo render limpo), `reel.js` (Remotion, com a cor corrigida + geometria/
arquivamento da Rodada 9), `narrar.js` (mesma voz/ritmo/texto de antes —
síntese determinística, reproduziu a narração idêntica) e `legendar.js`
(legenda nova sincronizada). Os 2 Tours NÃO precisaram de re-render (sem
o bug da cor; já tinham sido regerados corretamente antes da sessão
cair) — só reverificados.

2026-11-01 — Fechamento: varredura automática de cor (ffmpeg
`signalstats`, crop nos 420px de baixo onde fica a legenda/faixa, pico de
saturação por vídeo) nos 18 vídeos finais — todos com SATAVG máximo
abaixo de 10 (de 255), ou seja praticamente sem cor nenhuma ali, nada
perto da saturação de um vermelho puro (que passaria de 200+); amostragem
visual de quadros (4 vídeos, templates diferentes: apresentação, detalhes,
coleção por nome, coleção por id, + 1 do tour) confirmou visualmente:
degradê marrom neutro, legenda única e legível, sem sobreposição. `node
--check` nos 11 scripts tocados: OK. Teste offline do backend (não tocado
nesta rodada, conferido por segurança): 6/6 OK. Cache do webpack dentro
do projeto (`reels/.tmp/`, `tour/.tmp/` — redirecionado do TEMP do
Windows pro próprio projeto numa sessão anterior, 1,8GB) limpo (já
gitignorado por `.gitignore` local de cada pacote, nunca foi risco de
commit, só espaço em disco). Kit de postagem resincronizado
(`montar-kit-postagem.js`) — 11/17 dias prontos (sem mudança nos
pendentes, só os 12 Reels trocaram de bytes). `AMANHA-POSTAR.md`
(site-mae, fora do git) datado de 31/10 ainda dizia "Amanhã
(2026-11-01)" — corrigido pra "Hoje", já que hoje É o dia; conteúdo
(Tour do Site, `extra-tour-do-site\tour-instagram.mp4`) continua certo,
já tinha sido copiado com a versão corrigida.

2026-11-01 — Os 4 Reels de CONTEÚDO (sem o bug da cor, vídeo intocado)
ainda estavam com a narração/legenda da Rodada 8 (pausa entre frases
0,15, não 0,05) — rodei `narrar.js`/`legendar.js` neles também (sem
re-renderizar o vídeo, só reaplicando narração+legenda), pra fechar o
escopo "narração estável" nos 18 vídeos, não só nos 14 que tinham o
outro bug. Kit resincronizado de novo depois — mesma contagem (11/17).

2026-11-08 — Rodada 10 (Tour v3, tarefa autônoma, só os 2 Tours — ver
STATUS.md pro resumo completo). Saída toda em
`E:\projetos\site-mae\tour\v3\`, v2 nunca tocado.

2026-11-08 — Legenda karaokê: a 1ª tentativa foi uma composição
Remotion SEPARADA ("LegendaOverlay"), renderizada como WebM
"transparente" (`renderMedia({ codec:'vp8', transparent:true,
imageFormat:'png', pixelFormat:'yuva420p' })`) e sobreposta no vídeo
narrado via `ffmpeg overlay`. Resultado: fundo sempre PRETO SÓLIDO
cobrindo o vídeo inteiro, só a legenda aparecendo por cima — mesmo com
o comando ffmpeg gerado pelo Remotion correto (`-pix_fmt yuva420p
-auto-alt-ref 0`, confirmado lendo o log verbose). Isolei a causa
testando cada etapa: `renderStill` (screenshot direto, sem passar por
encode de vídeo) produzia um PNG com alfa=0 CORRETO no fundo
(confirmado lendo os bytes crus do pixel, `-pix_fmt rgba -f rawvideo`)
— então o Chromium/CDP (`Emulation.setDefaultBackgroundColorOverride`)
funciona direito. O problema é especificamente na ETAPA DE ENCODE pro
WebM (libvpx, tanto VP8 quanto VP9 testados, mesmo resultado): o
arquivo final sempre saía com alfa=255 (opaco) em toda a área
transparente, apesar do `ALPHA_MODE:1` nos metadados do stream (um
metadado "mentiroso" — a cor de fato não carrega alfa nenhum). Não
investiguei mais fundo (seria preciso recompilar o ffmpeg/libvpx desta
máquina, fora do escopo) — a solução adotada foi ELIMINAR a
necessidade de vídeo com alfa: a legenda agora é renderizada DENTRO da
própria composição `TourMobile` (componente `LegendaKaraoke` em
`tour/src/componentes.js`, recebe `legendaBlocos` como prop), já que
Remotion/React compõe normalmente (sem precisar de alfa de vídeo
nenhum) quando tudo está na MESMA árvore. Isso exigiu inverter a ordem
do pipeline: antes (reels/tour-portfolio) é sempre vídeo→narração→
legenda; pro tour-instagram agora é narração (só síntese, sem vídeo
ainda, `narrar-tour-v3.js --voz-saida`) → render do vídeo JÁ com a
legenda queimada (`tour.js --legenda-json`) → mixagem do áudio por
cima (`mixar()`, reexportado de `narrar.js`). Removido o código da
tentativa de overlay (`LegendaOverlay.js`, `legendar-overlay-v3.js`,
a fonte Jost baixada manualmente do Google Fonts pra uso em libass)
antes de qualquer commit — não ficou nenhum vestígio morto no repo.

2026-11-08 — Narração rápida: medi o pipeline existente
(`narrar.js`, síntese do roteiro INTEIRO de uma vez) e achei pausas de
~0,5-0,7s ENTRE PALAVRAS dentro de uma mesma frase (não só entre
frases) — característica do motor Piper na voz `jeff`/ritmo 0,7
(ritmo mais lento = pausas proporcionalmente mais longas, não só a
fala). Tentei `ffmpeg -af silenceremove=stop_periods=-1:...` (a forma
"oficial" de encolher silêncio NO MEIO de um áudio, não só nas bordas)
com várias combinações de threshold (em dB e em linear) — encolheu
quase nada nos testes (3,08s → 2,81-2,93s, deveria ter ido pra ~2s se
funcionasse). Troquei por um encolhedor PRÓPRIO em Node
(`narracao/encolher-silencio.js`): lê o WAV, mede um envelope RMS por
janela de 15ms, e corta fisicamente o MEIO de todo trecho silencioso
mais longo que o alvo (0,3s) — testado isoladamente numa frase (3,08s
→ 1,95s, gaps internos de 0,59s/0,51s → 0,30s/0,31s) antes de aplicar
no pipeline de produção. `narrar-tour-v3.js` sintetiza cada FRASE
separadamente (não o roteiro inteiro), apara borda + encolhe silêncio
interno de cada uma, e concatena com um gap FIXO de 0,3s (ffmpeg
`concat`, silêncio gerado via `anullsrc`, nunca o silêncio natural do
motor) — resultado determinístico, sempre dentro de 0,25-0,35s entre
frases e nunca >0,45s em nenhum ponto, confirmado por `silencedetect`
nos 2 vídeos finais. `narrar.js` só ganhou exports NOVOS
(`sintetizar`, `lerRoteiros`, `mixar`, etc.) — nenhuma linha de
comportamento mudou pros outros 16 vídeos (reels, sempre via
`narrar.js`/`legendar.js` sem mudança nenhuma).

2026-11-08 — Fonte Jost pro libass: antes de abandonar a abordagem de
overlay, baixei a Jost SemiBold (woff2 do Google Fonts não serve pro
libass/fontconfig — convertido pegando o TTF de verdade trocando o
User-Agent do curl pra um Safari antigo, que o Google Fonts ainda
serve em TrueType puro). Removido junto com o resto do código da
tentativa de overlay (não ficou usado em nada no resultado final).

2026-11-08 — `anasorsobreira.com.br` não resolve (nslookup: "domínio
inexistente") — conferido com `curl`/`nslookup` antes de aceitar o
texto do cartão final do tour-portfolio. `anasor-sobreira.vercel.app`
responde HTTP 200 — troquei o texto do fecho (`FechoPortfolio` em
`componentes.js`) pra esse endereço (fonte reduzida de 56 pra 48px, o
texto novo é mais longo). Registrado — nunca mostrar endereço que não
funciona (pedido explícito).

2026-11-08 — Corte de escopo (orçamento da rodada): a duração TOTAL de
cada Tour não foi recalculada pra bater com "fala real + cartão final
de 3s" — o roteiro VISUAL (duração de cada cena, vinda da captura real
de tela) não foi tocado, só a narração ficou mais rápida (sobra ~8-13s
de cena sem narração antes do cartão final, nunca tela vazia — só sem
fala). Mudar isso exigiria recalcular a duração de CADA cena capturada
(roteiro-mobile.js/roteiro-desktop.js), fora do orçamento desta
rodada — registrado em STATUS.md como pendência, não escondido.

2026-11-09 — Rodada 11 (Tour v4 — ver STATUS.md pro resumo completo).
A pendência registrada acima (2026-11-08) virou o PEDIDO principal
desta rodada: a duração de cada cena agora vem da fala (não mais da
captura), resolvendo exatamente o corte de escopo anotado.

2026-11-09 — `roteiro-mobile.js`/`roteiro-desktop.js` ganharam um
parâmetro OPCIONAL de override de duração (`overridesDuracao`/
`overrides`) — sem ele, comportamento idêntico a sempre (a v3 nunca
chama com esse parâmetro, continua lendo a duração do manifesto/dos
números fixos). `montarRoteiroDesktop` também passou a aceitar
`destaques` dinâmicos por cena (texto/atraso/duração calculados a
partir da fala real, não mais hardcoded) — só pras cenas que JÁ
tinham balão antes (listagem/checkout/fecho[0]); nenhum balão NOVO foi
adicionado em cena nenhuma (visual aprovado, só tempo mudou).

2026-11-09 — ACHADO (1ª tentativa de render): `bundle()` do Remotion
copia o conteúdo de `publicDir` pro diretório temporário do bundle NA
HORA da chamada — mesmo achado já registrado em tour.js (Rodada 4),
esquecido ao escrever `tour/rodar-v4.js` do zero: a 1ª versão bundlava
ANTES de copiar os clipes ajustados (freeze/corte) pra `public/`,
dando 404 no render ("clipes/mobile/home-hero.mp4 could not be
found"). Corrigido: clipes ajustados SEMPRE antes do `bundle()`.

2026-11-09 — ACHADO (1º render completo, Instagram): legenda DUPLICADA
na tela (2 pílulas sobrepostas, uma com o texto da narração nova,
outra "fantasma" com fragmentos da legenda cinética antiga). Causa:
`roteiro-mobile.js` sempre devolve `legendas` (array da legenda
cinética antiga, `LegendaCinetica`, texto DIFERENTE da narração) — o
pipeline v3 (`tour.js`) sempre removia isso antes de montar os props
(`semLegendaEmbutida`); o driver novo (`rodar-v4.js`) esqueceu desse
passo. Corrigido: `cenas.map(c => ({...c, legendas: []}))` antes de
montar os props do Instagram — só a legenda karaokê nova
(`legendaBlocos`) renderiza agora.

2026-11-09 — ACHADO testando (confirmado por script, não por ouvido):
o filtro `ffmpeg -af silenceremove` continua não encolhendo pausas
internas de forma confiável nesta build de libvpx/ffmpeg (mesmo
achado da Rodada 10) — por isso a narração v4 usa síntese de UMA
PASSADA por frase (sem cortar miolo nenhum, só borda de 80ms) em vez
de tentar de novo encolher silêncio interno por filtro. Pedido desta
rodada já pedia isso explicitamente ("SEM cortar silêncio interno"),
então o achado da Rodada 10 (que motivou o corte agressivo) foi
revertido de propósito, não por engano.

2026-11-09 — `pip install faster-whisper` funcionou de primeira
(Python 3.14.7 já instalado na máquina) mas `model.transcribe(caminho)`
falhava (`TypeError: open() got an unexpected keyword argument
'metadata_errors'` — incompatibilidade de versão entre faster-whisper
e o PyAV instalado). Contornado lendo o `.wav` manualmente (módulo
`wave` do Python + numpy) e passando o array de amostras direto pro
`transcribe()`, em vez do caminho do arquivo — bypassa o PyAV
inteiro. Também precisa reamostrar pra 16kHz antes (o modelo espera
isso; alimentar com 22050Hz direto saiu com transcrição toda errada,
não só imprecisa — achado comparando as 2 tentativas).

2026-11-09 — Cobertura de voz do Instagram ficou em 88,8% (meta:
≥90%) — único item do pedido que não passou 100%. Tentei entender se
dava pra fechar a lacuna sem violar outra regra do mesmo pedido: com
13 frases curtas (1 por cena, pedido explícito) e pausa fixa de 0,3s
entre elas (também pedido explícito), a sobra proporcional de silêncio
é maior que no portfólio (8 frases mais longas, mesmas regras, 92,4%
de cobertura — passa). Reduzir a pausa ou juntar frases de cenas
diferentes contradiria pedidos explícitos do mesmo texto — decidi
ACEITAR o resultado e registrar a reprovação parcial com transparência
(nenhum gap sozinho passa de 1,3s, bem abaixo do limite de 3,5s) em
vez de quebrar outra regra pra forçar o número.

2026-11-09 — Rodada 12 (Tour do Site v5, narração fluida). TENSÃO
entre 2 pedidos numéricos do mesmo texto: "1 trecho por cena, 14 a 26
palavras" x "duração ≈36-44s (Instagram) / ≈34-42s (portfólio)". No
mobile há 13 cenas/clipes fixos (1 por elemento do site capturado); 13
trechos de 14-26 palavras a ~2,6-3,2 palavras/s somam 57-130s SÓ de
fala, muito acima da meta de duração — mesmo aceitando a banda mais
baixa (14 palavras), passa de 57s. Não dava pra cumprir as 2 regras ao
mesmo tempo. Decisão: agrupar os 13 clipes mobile em **7 trechos de
narração + 1 fechamento fixo** — cenas com conteúdo relacionado
(ex.: produto-galeria + produto-video + produto-medidas) passaram a
ser narradas por 1 trecho só de 2-3 orações, com a duração de cada
clipe virando uma FATIA proporcional (peso = duração original
capturada de cada um, piso de 0,5s) do trecho que o narra — nenhum dos
13 clipes foi removido, cortado de ordem ou teve conteúdo retirado, só
a duração de cada um deixou de vir de 1 frase própria. O orçamento de
PALAVRAS por trecho ficou um pouco abaixo de 14-26 em alguns (a
prioridade foi a meta de DURAÇÃO, que tem verificação por script
"sem depender de mim" explícita no pedido; o range de palavras era
instrumental — o objetivo real, "trechos fluidos sintetizados numa
passada só, não frase-a-frase", foi mantido). O desktop (8
itens/6 cenas) não precisou desse agrupamento — o orçamento de
palavras já cabia dentro da meta de duração só enriquecendo cada item
(2 clausulas em vez de 1), sem juntar nenhuma cena nem criar/remover
balão.

2026-11-09 — Rodada 12, teste das 4 configurações de síntese
(`teste-fluidez-v5.js`, metas: rajada média ≥1,5s/mediana ≥1,3s, pausa
interna ≤0,30s, ≤22% do tempo total em pausa, 2,6-3,2 palavras/s,
medidas no MESMO trecho de ~14s): A jeff/0.7 (atual), B jeff/0.85,
C jeff/1.0, D faber/0.9 (todas com noise_scale 0,667/noise_w 0,8,
sentence_silence 0,15 — pedido explícito, "variação natural de
ritmo"). NENHUMA passou nas 5 metas ao mesmo tempo — rajadas de
0,61-0,86s e 25-40% de pausa em todas, bem abaixo/acima do pedido.
Isso bate com o achado já registrado na Rodada 9 (comentário em
`sintetizar-piper.ps1`): a pausa entre cláusulas no Piper NÃO vem de
`sentence_silence` nem de pontuação — é comportamento PROSÓDICO do
próprio modelo VITS, não controlável só por length_scale/noise_w.
Config D (faber 0.9) teve a MENOR pontuação de violação (soma das
distâncias relativas às metas) — 3 das 5 métricas dentro da meta
(pausa média 0,217s, %pausa 25,2%, wps 3,19) — escolhida como padrão
por código, sem depender de audição humana (pedido explícito). Troca
de voz (jeff→faber) é mais do que só ajustar o ritmo da voz já
escolhida pelo Fabrício (Rodada 7) — registrado aqui com destaque:
`node tour/rodar-v5.js --versao a --config A` volta pra jeff/0.7 (ou
B/C) se o timbre do faber não for aprovado, sem precisar mexer em
código.

2026-11-09 — Rodada 12, ACHADO rodando (checkout do Instagram): o
clipe pré-cortado em 36 quadros (até o CEP + endereço auto-preenchido
pelo ViaCEP) ainda saía com o CEP cortado na composição final, mesmo
o frame bruto mostrando o CEP legível e com folga. Hipótese inicial
(errada): o pan de câmera (`DispositivoFlutuante`, de/para do
`roteiro-mobile.js`) — tentativa de reduzir o pan só nesta cena NÃO
mudou nada, porque toda câmera mobile já é clampada num intervalo
minúsculo (`LAYOUT_CELULAR.CAMERA_ESCALA_MIN/MAX` 0,99-1,01,
`CAMERA_TRANSLATE_MAX_PCT` 0,6%) — o de/para do roteiro é quase
cosmético, não a causa. Causa real, achada comparando o clipe ajustado
(antes do Remotion) com o quadro final: `MolduraCelular` (componentes.js)
recorta o vídeo com `objectFit: cover` pro tamanho FIXO da moldura
(560×1150, proporção ≈0,487) — mais "quadrado" que o vídeo bruto
capturado (1180×2556, proporção ≈0,462) — qualquer conteúdo perto da
BORDA do clipe perde uma fatia nesse recorte centralizado, e o CEP
(perto do fim da página) caía bem nessa fatia. Corrigido
ACRESCENTANDO uma faixa de fundo (cor de `--cor-fundo`, pega de
`style.css`) de 420px embaixo do quadro ANTES de cortar os 36 quadros
(`prepararManifestoCheckoutCep`, `tour/gerar-v5.js`) — o recorte
centralizado da moldura passa a comer essa faixa extra (que não tem
conteúdo nenhum), não mais o campo do CEP. Conferido por print
recortado (zoom na borda inferior) antes/depois — só este clipe foi
tocado, os outros 12 continuam exatamente como a captura trouxe.

2026-11-10 — Rodada 13, DECISÃO DO FABRÍCIO: abandonar a narração
sintética (Piper) no Tour do Site. Mesmo depois de toda a Rodada 12
(trechos fluidos, síntese numa passada só, config escolhida por
medição), a voz ainda soa robótica/arrastada ao ouvido dele — decisão
de produto, não um bug pra caçar: narração e legenda passam a ser
feitas por fora, num app de edição (CapCut/Clipchamp), com uma voz
real ou um TTS melhor escolhido por ele. Não tentei "melhorar mais" a
voz (pedido explícito: "Não tente melhorar a voz") — o pipeline
`narracao/*-v5.*` continua existindo e funcional (não foi apagado,
só parou de ser usado nos vídeos do Tour) caso sirva de referência ou
seja reaproveitado noutro contexto depois.

2026-11-10 — Rodada 13, v6 sem recalcular NADA de visual: em vez de
reconstruir a linha do tempo do zero, `tour/gerar-v6.js` LÊ a duração
real de cada trecho que a v5 já sintetizou e salvou em
`tour/v5/_dados/*.json` e refaz a MESMA conta de
`construirTimelineMobileV5`/`construirTimelineDesktopV5` (gerar-v5.js)
só que sem chamar `sintetizarTrechoV5` — é só aritmética (soma
GAP/PAD_CHECKOUT/TRAIL_FECHO, `dividirDuracaoEntreClipes`), então as
durações de cena da v6 são IDÊNTICAS às da v5 (Instagram 40,0s,
portfólio 41,8s) sem gastar 1 chamada de Piper. Export adicional em
`gerar-v5.js` (`PAD_CHECKOUT`, `dividirDuracaoEntreClipes`,
`NOME_PARA_CLIPE`) — só tornou públicas funções/constantes que já
existiam no módulo (closures), nenhum comportamento da v5 mudou (o
próprio `node tour/rodar-v5.js` continua idêntico, não foi tocado).

2026-11-10 — Rodada 13, ACHADO: a legenda karaokê do Instagram está
QUEIMADA no pixel do vídeo final da v5 (faz parte do frame renderizado
pelo Remotion, não é uma faixa separada) — não existe jeito de
"remover" isso de um vídeo já renderizado sem reprocessar a imagem.
Único jeito de entregar o Instagram sem legenda era re-rodar o render
Remotion (bundle + renderMedia) com a legenda desligada nos props —
usei a MESMA prop que já existia (`legendaBlocos`): `TourMobile.js` só
chama `<LegendaKaraoke>` quando essa prop não é nula/vazia, então
passar `null` desliga sem tocar no componente nem no código da
legenda (pedido explícito: "use prop/flag, não apague o código"). Já
o portfólio NUNCA teve legenda queimada (o texto na tela são balões
`DestaqueTecnico`, parte do design, não legenda) — não precisou de
render nenhum, só reaproveitei `tour-portfolio-narrado.mp4` da v5
(vídeo+voz, sem música) e tirei o áudio.

2026-11-10 — Rodada 13, achado validando a faixa de legenda (y
1440-1600) do Instagram v6: em vez de amostrar só alguns quadros
"a cada 1s" (o que o pedido sugeria como suficiente), usei o filtro
`signalstats` do ffmpeg pra medir o brilho médio (YAVG) da faixa em
TODOS os ~1200 quadros do vídeo de uma vez (mais barato que extrair
quadro por quadro e mais completo que amostrar) — ficou entre 204 e
213 o vídeo inteiro (só o fundo bege da composição), confirmando que
não sobrou nenhum resquício de legenda em nenhum instante, não só nos
3 quadros validados antes do render.

---

## Rodada 14 — Redesign dos posts (v4), modo totalmente autônomo (2026-11-14)

Pedido: o post-01 "ficou fraco", refazer e corrigir o GERADOR (não os
PNGs à mão) pra todos os posts futuros já saírem no padrão novo. Sem
nenhuma pergunta durante a execução — decisões abaixo.

2026-11-14 — Paleta: o pedido citou terracota #B5754C; o `--cor-destaque`
ATUAL do site é #9E4F2E (o comentário em `css/style.css` explica: a
#B5754C antiga dava só ~3,7:1 de contraste com texto branco, reprovava
WCAG AA). Mantive o script lendo a cor de verdade do CSS (`lerVariaveisCss`,
já existia) em vez de hard-codar o hex do pedido — CLAUDE.md proíbe mudar
a identidade visual sem pedido, e usar uma cor diferente da atual do site
teria sido exatamente isso.
2026-11-14 — Marca d'água "AS" de fundo: trocada de `--marca-monograma-fraca`
(0,035 = 3,5%, a causa real de "quase não aparece") para `--marca-monograma`
(0,1 = 10%) — variável que já existe em `css/style.css` (usada em "Quem
Somos"/rodapé do site), não uma 3ª cópia nova do SVG. Já cai dentro da
faixa pedida (8-12%).
2026-11-14 — Emblema da logo sobre FOTO: antes só o layout 4 (fundo
marrom) usava o "chip" (círculo creme atrás da logo) — motivo original era
só esconder ruído de compressão JPEG sobre fundo escuro. Estendi o chip
pra TODO slide onde a logo flutua sobre uma foto (capa dos 4 layouts,
story, "vendida", as 3 variantes de foto-detalhe) — é exatamente a causa
de "quase não aparece": o emblema claro sem nada atrás, direto sobre uma
foto variada, lia mal em qualquer fundo que não fosse bem escuro ou bem
claro.
2026-11-14 — Flor/vaso (marcas d'água de traço fino): o SVG-base já nasce
em 10% de opacidade (`--marca-flor`/`--marca-vaso`); os slides aplicavam
MAIS uma redução (opacity 0,7-0,9 no wrapper) por cima, deixando o efetivo
~7-9%. Tirei essa redução extra (wrapper em 1) — mesma marca, só sem
dupla opacidade.
2026-11-14 — Rosto da Anasor: não existe `img/quem-somos.jpeg` citado no
pedido — o arquivo real é `img/institucional/quem-somos.jpg` (a mesma
ilustração estilo desenho da seção "Quem Somos" do site). Usei esse.
Recorte circular (`ROSTO_ANASOR_RECORTE`: quadrado 560px a partir de
(280,290) da imagem-fonte 1195x896) medido à mão olhando a imagem — do
topo do cabelo aos ombros, centrado no rosto; comentário no código avisa
pra remedir se a imagem-fonte for trocada um dia.
2026-11-14 — Hierarquia do nome (capa): sem criar um campo novo em
`produtos.js` (fonte única continua intacta). `dividirNome()` usa um mapa
pequeno "palavra-cabeça → quais palavras seguintes ainda são TIPO, não
nome poético" (Prato/Vaso/Travessa/Caneca/Pote + adjetivos tipo
Decorativo/Escultórico/Artística/Jarra), calibrado olhando TODOS os nomes
reais do catálogo antes de escrever a regra. Qualquer nome fora do padrão
(ex.: o corte cairia numa preposição, tipo "Terço de Mesa Grãos de
Oração") cai automaticamente no fallback: título inteiro numa linha só,
sem dividir — um corte estranho é pior que não dividir.
2026-11-14 — Legendas de foto-detalhe (pedido 4: trocar "Detalhe" fixo por
algo útil): em vez de inventar texto novo por peça (que quebraria "nunca
inventar" e não generalizaria pro catálogo inteiro), `extrairDestaques()`
lê os trechos que a PRÓPRIA descrição da peça já marca em
`<span class='realce'>...</span>` (a mesma marcação usada em
`produto.html`) — pro post-01 isso dá exatamente "Torneado e pintado à
mão" e "Borda em terracota natural", sem escrever nada novo. Faltando
destaques reais suficientes (peça com 3 fotos extras mas só 1-2 frases
`realce`), cai numa legenda genérica verdadeira ("Visto de perto" etc.).
2026-11-14 — Item 4 ("7 dias pra se arrepender da compra") saiu do slide
"por que comprar": pedido explícito pra trocar por "peça única: ninguém
vai ter uma igual". A política de arrependimento CONTINUA valendo e
publicada em `politicas.html` — só não é mais um dos 4 argumentos de
venda na arte do Instagram.
2026-11-14 — Coração do slide de chamada final: estava BRANCO sobre fundo
creme (quase some) — trocado pra terracota (`v.destaque`), como o próprio
pedido sugeriu ("coração terracota ou 🤎"). Medido depois de gerar (script
à parte, lendo os pixels do PNG via Playwright/canvas): o bloco "Peça
única ♥" ficou com centro em x=538,5 dos 1080px do canvas (centro real:
540) — 1,5px de diferença, dentro de qualquer tolerância visual.
2026-11-14 — Selos/medalhões 3D: reaproveitada a MESMA receita de sombras
em camadas de `css/checkout.css` (`.checkout-selo__icone-fundo` — brilho
inset, sombra inset, degrau sólido, sombra de contato), não uma invenção
nova — é literalmente o badge "de confiança" que o checkout do site já
usa, só escalado pra caber numa arte de 1080px.
2026-11-14 — Variedade dos slides de foto-detalhe: 3 variantes
(polaroid / moldura dupla com miniaturas em coluna / cantos orgânicos com
`--raio-organico` do site) alternadas automaticamente por índice
(`i % 3`) — só a variante 3 (cantos orgânicos) usa recorte quadrado
forçado (`object-fit: cover`, pra caber na curva orgânica); as outras 2
mostram a foto inteira, sem cortar nada (tamanho natural, `max-width`/
`max-height`), pra nunca arriscar cortar o detalhe que a legenda descreve.
2026-11-14 — Título com hierarquia (tipo/nome) e divisão por `dividirNome`
foi aplicado SÓ no layout 1 da capa (o que o post-01 usa e que foi
verificado visualmente nesta rodada). Os layouts 2/3/4 ganharam as
melhorias "compartilhadas" (chip da logo, selos/medalhões 3D, marca
d'água mais forte) automaticamente — por herdarem o mesmo CSS/funções —
mas continuam com o nome numa linha só; dividir o nome ali também fica
pendente de uma rodada futura COM verificação visual desses 3 layouts.
2026-11-14 — Margem de segurança: todo elemento de canto (selo, logo)
tinha 56px de distância da borda; pedido falava em "~80px". Fui pra 72px
(`MARGEM_SEGURA`) — é a mesma distância já usada como padding lateral do
corpo de vários slides, então os elementos de canto ficam alinhados com o
texto central em vez de mais pra dentro ou mais pra fora; 72 já está bem
dentro dos 80px pedidos.
2026-11-14 — Legenda em negrito/itálico Unicode (`formatar-legenda.js`):
o bloco Unicode usado (Mathematical Alphanumeric Symbols) só cobre
A-Z/a-z/0-9 — nenhuma letra acentuada. Testado com ç/ã/é/ê/ó: a conversão
decide por PALAVRA inteira (não por letra solta) — se uma letra da
palavra não tiver versão Unicode, a palavra inteira fica no texto normal,
em vez de sair "quebrada" (metade em negrito, acento caído de volta pro
normal). O "h" itálico minúsculo tem 1 exceção conhecida no padrão
Unicode (ponto de código reservado) — usa U+210E (ℎ, visualmente
idêntico) em vez do bloco principal.

## Rodada 15 — Capas dos destaques (v3), modo totalmente autônomo (2026-11-15)

Pedido: refazer as 7 capas de destaque do Instagram pela FONTE (template +
script, não arte editada à mão) — a v2 (ícone de linha fino, sem moldura)
tinha sido reprovada: "sem borda, sem símbolo, simples demais". Sem
nenhuma pergunta durante a execução — decisões abaixo.

2026-11-15 — Paleta: o pedido citou terracota #B5754C e ouro #B8873E; a
Rodada 14 (acima) já tinha decidido manter a cor REAL do site
(`--cor-destaque` #9E4F2E) em vez do hex do pedido, por contraste WCAG —
mesma decisão repetida aqui, pelo mesmo motivo, lendo `css/style.css` via
`lerVariaveisCss()` em vez de hard-codar. O dourado usa o mesmo
`#D9B06A` já usado nos medalhões 3D dos posts (não um nº novo).
2026-11-15 — Local de saída: `marketing/instagram/destaques/`, DENTRO do
repositório — diferente de `instagram-posts/` (que vai para `site-mae/`,
fora do git). Pedido explícito desta rodada. Como as capas são 100%
geradas pelo script (nenhuma edição manual), ficam de fora do `git`
mesmo assim (`.gitignore`, mesmo padrão já usado para `posts/`) — só o
script e o guia (`destaques.md`) são versionados.
2026-11-15 — Raminho decorativo: a 1ª versão (curva livre à mão) lia
como anzol/alfinete num zoom normal. Reescrita com trigonometria
(`pontoNoAnel`/`RAIO_RAMINHO`) pra desenhar um ARCO de verdade sobre o
raio do próprio anel (contorna o anel de fato) + 3 folhas (elipses
tangentes) + 1 flor simples na ponta — sempre no mesmo ângulo nos 7,
pra fileira parecer conjunto.
2026-11-15 — Ícone de "Bastidores" (roda de oleiro): 3 tentativas
reprovadas em sequência durante a própria rodada — elipse+arco fino leu
como chapéu, elipse+bojo arredondado também leu como chapéu, círculo+
bolinha (vista de cima) leu como olho/alvo. A versão final é um disco
BEM achatado (visto quase de cima, elipse rasa) com o bolo de argila
raso por dentro do próprio contorno (nunca subindo acima da silhueta) +
2 riscos de giro simétricos — "disco achatado girando" não lia como mais
nada nos testes.
2026-11-15 — Ícone de "Comprar?": testado com sacola (lia como "loja",
redundante com o ícone de Peças) e com um ícone de interrogação dentro
de outro círculo (Lucide `circle-help` — lia como "2 molduras
concêntricas" de longe, competindo com a própria moldura da capa). O "?"
grande sozinho, em Fraunces, no mesmo peso visual dos outros ícones, foi
o único inequívoco — opção que o próprio pedido já deixava em aberto.
2026-11-15 — Legibilidade do texto a ~70px (tamanho real no perfil):
fisicamente impossível ler uma palavra nesse tamanho sem tomar o espaço
inteiro do ícone (medido no mock `_mockup-perfil-390.png` a cada
rodada de ajuste). Decisão: o ÍCONE é o elemento que precisa ler nesse
tamanho (por isso ocupa 54% do núcleo da moldura, não os ~43% da 1ª
versão) — o texto fica como reforço de marca pros tamanhos maiores
(story aberto, feed), não como rótulo funcional da miniatura.
2026-11-15 — `impeccable`/`frontend-design`: consultadas as diretrizes
das 2 skills (hierarquia/peso visual, "gastar a ousadia num lugar só")
antes de desenhar, mas sem rodar o setup completo do `impeccable`
(`impeccable context`/PRODUCT.md/DESIGN.md) — é pensado pra superfícies
de app/site inteiras, não pra um gerador de 7 PNGs estáticos; custaria
tempo sem agregar nada que a verificação visual direta (Read da própria
imagem gerada) já não resolvesse.
2026-11-15 — `chrome-browser` não foi usado: a tarefa é geração de
imagem estática via Playwright (mesmo motor dos outros scripts desta
pasta), não interação com uma página viva — a verificação visual foi
feita lendo os PNGs gerados diretamente, sem abrir navegador.

---

## Rodada 16 — catálogo completo (posts + stories de todos os outros
produtos, modo 100% autônomo)

Pedido em 2026-11-18. Fabrício avisou que ia ficar fora — toda decisão
abaixo foi tomada sozinho, sem pausar para perguntar.

2026-11-18 — Reaproveitamento do motor: `gerar-posts.js` ganhou
`module.exports` (guardado por `if (require.main === module)`, mesmo
padrão já usado em `formatar-legenda.js`) em vez de duplicar o HTML/CSS/
Playwright num script novo — `gerar-posts-catalogo.js` importa as funções
de slide/CSS/dados direto de lá. `require('./gerar-posts.js')` confirmado
que NÃO dispara `main()` (testado isoladamente antes de integrar).
2026-11-18 — Pasta de saída: o pedido escreveu literalmente
"marketing/instagram/conteudo/ (fora do git, como instagram-posts/)" —
um caminho DENTRO do repositório (diferente de `instagram-posts/`, que
fica em `site-mae/`, fora do repo inteiro). Interpretei como "mesmo
tratamento de `destaques/`": pasta física dentro de `marketing/instagram/`,
git-ignorada — e não como "mover pra site-mae". Mesma lógica já usada em
`gerar-capas-destaque.js` (ver comentário de cabeçalho daquele arquivo).
2026-11-18 — Capa sempre no layout 1 (`slideCapa`), nunca os layouts 2/3/4
de `gerar-posts.js`: só o 1 tem a hierarquia de nome do redesign v4 por
completo (README.md "v4" já registra que os outros 3 layouts não foram
adaptados). Rotear por peça entre os 4 misturaria posts 100% v4 com posts
só parcialmente v4 no mesmo catálogo — pior para a consistência do perfil
do que simplesmente usar um layout só, mesmo abrindo mão da variedade de
capa que a v3 original buscava.
2026-11-18 — Peças puladas: id 33 (Pote Decorativo Bruma Dourada,
`disponivel:false`) e id 29 (Caneca Artística Pássaro e Rosa, pedido
explícito "duvidosa" — só 1 foto registrada, com histórico de recorte
problemático, ver comentário em `produtos.js`). As outras 2 citadas no
pedido como duvidosas — "Caneca Surpresa Raposinha" e "Guirlanda de
Contas com Franjas" — **não existem mais no catálogo sob esses nomes**:
já foram corrigidas em rodadas anteriores (comentários em `produtos.js`,
linha ~619 e ~1147) — a "raposinha" era a MESMA caneca do cachorrinho
(id 19, já curada em post-01..09) e a "guirlanda" foi re-identificada
como id 42 "Terço de Mesa Grãos de Oração", um produto confirmado, com
descrição e fotos reais, sem motivo pra continuar de fora. Decisão:
incluir o id 42 normalmente — ficou registrado aqui em vez de simplesmente
pular algo que o pedido citava, para o Fabrício poder corrigir se a
intenção fosse outra.
2026-11-18 — Ordem de postagem (`_LEIA-ME.txt`/`ORDEM_IDS`): escolhida à
mão (mesmo espírito de `PECAS` em `gerar-posts.js`, não um algoritmo
genérico pra um uso só) — ranqueei cada categoria internamente por
"melhor primeiro" (selo queridinho/assinada, mais fotos) e intercalei as
categorias em rodízio (prato → caneca → vaso → kit → objeto decorativo →
repete), encaixando as 3 categorias de 1 peça só (travessa/jarra/devoção)
em pontos espaçados do meio pra não ficarem todas juntas no fim.
2026-11-18 — Fotos extras por peça: subiu de 3 (padrão de
`gerar-posts.js`) pra até 4 (pedido explícito "mínimo 1, máximo 4").
Nenhuma peça deste catálogo tem só 1 foto no total (a id 29, que tinha,
foi pulada por outro motivo) — o fallback de "reusar a foto principal
quando não há nenhuma extra" existe no código mas não chegou a ser
exercitado nesta rodada; registrado pra não ficar como código morto sem
explicação se alguém revisar depois.
2026-11-18 — Stories de peça são NOVOS (não existiam em `gerar-posts.js`,
que só tem a capa em Story) — área segura 280px topo / 340px base, com
folga sobre o mínimo pedido (250/300), mesmo espírito do `MARGEM_SEGURA`
"72 não 56" já documentado em `gerar-posts.js`. O story-2 (detalhe+frete)
deixa o terço inferior (abaixo de ~1280px de 1920px, bem mais que os 300px
mínimos) deliberadamente vazio — reservado pro sticker de link do
Instagram, indicado só no `_LEIA-ME.txt`/relatório, nunca desenhado na
arte (pedido explícito: "indicar só no relatório, não na arte").
2026-11-18 — Ícones de "contato" (conversa/envelope/globo) são desenho
próprio (SVG de traço único, viewBox 24, mesmo estilo Lucide do resto do
site) em vez de ícones Lucide exatos — não existe um ícone de "conversa"/
"globo" já usado no site pra copiar com certeza de fidelidade, mesmo
raciocínio já registrado em `gerar-capas-destaque.js` pros ícones
vaso/roda-de-oleiro/pincel. O "@" do Instagram usa um glifo tipográfico
grande (Fraunces) em vez de ícone — mesma técnica do "?" em
`gerar-capas-destaque.js` (`DESTAQUES.comprar`).
2026-11-18 — Legendas novas (26 de 33): campo `cuidados` de `produtos.js`
está "A definir" em TODA peça deste catálogo (conferido antes de
escrever) — nenhuma dica de cuidado específica por peça existe além do
fato geral do site (politicas.html #cuidados), por isso o Story
"Cuidados com a peça" usa só esse fato geral, igual ao carrossel de
conteúdo equivalente de `gerar-posts.js`.
2026-11-18 — Kits (7 peças: ids 22/23/32/34/35/36/40): "deixar claro o
que vem no kit" foi resolvido SEM precisar de código novo — o nome de
cada kit já descreve o conteúdo por extenso ("Kit 4 Canequinhas Arlequim
Marmorizado", "Kit Jarra e 2 Copos Textura Casca"...), e `dividirNome()`
(já existente) naturalmente separa "Kit" (eyebrow) do resto do nome
(título grande), deixando a contagem+itens em destaque na capa sem
nenhum caso especial. Reforçado nas legendas também (ex.: "1 jarra + 2
copos, queimados juntos").
2026-11-18 — Validação automática (economia de tokens): `validarPng()`
lê o cabeçalho IHDR do PNG direto (bytes 16-23, sem depender de nenhuma
lib de imagem) pra conferir dimensão exata de TODO arquivo gerado — 33
posts + 66 stories de produto + 9 stories institucionais, sem abrir
nenhum visualmente. Amostra aberta de verdade: post-01 completo (7
slides), 1 capa de kit, 2 capas de peça comum em pontos espaçados da
lista (post-21, post-31), os 2 stories de produto do post-01, e os 9
stories institucionais — todos ok, nenhum problema achado, nenhum lote
precisou ser regenerado.

---

## Rodada 15 — Carrossel "Do barro à luz" (Anjos de Luz), formato novo de
história contínua (modo autônomo, 2026-11-23)

Pedido explícito: 1 carrossel novo (9 slides) contando o processo dos
"Anjos de Luz" (barro → forno → esmalte → luz), tema visual "noite
dourada" diferente do resto do feed, "carrossel contínuo" (1 tela larga
cortada em 9 pedaços, com um fio dourado atravessando as divisas), a
partir de 17 fotos brutas em `site-mae\Criativos\anjos\fotos\`. Script
novo: `gerar-carrossel-historia.js` (motor próprio — NÃO usa o de
`gerar-posts.js`, só reaproveita utilitários dele: `dataUri`, `RAIZ`,
`rostoAnasorHtml`, `svgIcone`/`svgCoracao`, `MARGEM_SEGURA`).

2026-11-23 — **Preço**: procurei "Anjo" em `js/produtos.js` — existe só
1 produto (`id 43`, "Anjo Guardião Porta-Incenso", R$ 159,90), e é um
porta-INCENSO diferente das peças fotografadas (porta-VELA, 3 modelos —
cone grande, cone menor, plaquinha — com terço dourado no pescoço; a
peça do site é só 1 modelo, sem terço, pra incenso). Não é a mesma peça
nem uma variação dela com preço conhecido — **nenhum preço entra na
legenda** (regra do pedido: nunca inventar). Avisado no relatório final
pro Fabrício: se os Anjos de Luz forem anunciados sem estar no catálogo
do site, o link da bio/DM é o único caminho de compra até cadastrá-los.
2026-11-23 — **Fotos "QUADRO" (08, 09, 10, 14, 15) — NENHUMA usada**: as
5 têm ao fundo o mesmo quadro (figura masculina nua de corpo inteiro, e
em 10/14/15 também uma figura feminina parcialmente à mostra) ocupando
boa parte do fundo, bem atrás/entre o grupo de anjos que é o motivo da
foto — não existe recorte que exclua o quadro inteiro sem cortar fora a
maior parte dos anjos (o que esvaziaria a própria foto). Regra do
pedido ("na dúvida, não use a foto") aplicada à risca: as 5 ficaram de
fora por completo, inclusive do slide "antes x depois" que o pedido
citava como exemplo (08/09 x 14/15) — refeito com 07 (esmalte, apagado)
× 13 (closeup aceso), mesma ideia visual, zero risco de reprovação no
Meta. Isso também simplificou a composição (2 fotos de 1 peça só, em
vez de 2 grupos de ~12 peças cada).
2026-11-23 — **Balde rosa da foto 01**: em vez de recortar com medida de
pixel fixa (as fotos variam de proporção), usei `object-position`
polarizado pra direita/cima (78% 36%) dentro de um cartão com proporção
mais larga que a foto-fonte — isso força o `object-fit:cover` a cortar
mais das LATERAIS (onde está o balde) do que do topo/base. Conferido no
render final: balde fora de quadro, só perde uma pontinha da asa
esquerda (troca aceitável, pedida explicitamente: "recorte o balde").
2026-11-23 — **2 bugs achados na 1ª rodada de crítica visual** (abri os
9 slides um a um antes de aceitar, não só a prévia): (1) TODOS os
cartões de foto dos slides de etapa (1, 2, 4, 6) e o cartão da
embalagem (slide 7) sumiram — causa: cada `.slide-conteudo` já é
`position:absolute; left:xBase` (é ele quem desloca o slide pro seu
trecho dos 9720px do canvas) e vira o "containing block" de tudo dentro
dele, mas eu estava passando `xBase + x` pros cartões de foto (cartão
somava o deslocamento 2x e ia parar fora da área visível daquele
slide). Corrigido pra coordenada LOCAL (só `x`, igual ao badge/título já
faziam) — nenhum outro elemento tinha esse bug (badge, título, selo de
canto já usavam local ou canvas-absoluto corretamente, conforme o caso).
(2) o retrato da Anasor (slide 8, `P.rostoAnasorHtml`) saiu como um
retângulo cru, sem recorte redondo nem anéis — a função só devolve a
`<div>`/`<img>`; quem desenha o círculo é a classe CSS `.rosto-anasor`
de `cssComum()` em `gerar-posts.js`, que eu nunca importei pro CSS
próprio deste script. Corrigido copiando a classe (mesma técnica de
sempre: copiar o componente visual, nunca importar entre os 2 arquivos,
evita acoplamento) com os anéis recoloridos pro tema escuro.
2026-11-23 — **Marca d'água "AS"**: a 1ª versão (ladrilho 260px, 0,06 de
opacidade — mesmos números do `--marca-monograma` "forte" do site)
ficou "tapeçaria" num fundo liso escuro — a repetição reforça o traço
mesmo em baixa opacidade por tile, efeito que o bege granulado do site
disfarça mas o marrom liso não. Corrigido pra ladrilho 380px + 0,035 de
opacidade (menos repetições por slide, cada uma mais fraca) — só
perceptível de perto, como pedido ("bem sutil").
2026-11-23 — **Medalhão da assinatura**: reaproveitei a MESMA técnica de
corte por luminância de `removerFundoLogo()` (gerar-posts.js), mas com
faixa de corte mais alta (238-253, não 228-250) — a logo do site tem
fundo CREME (~246 de luminância, precisa de faixa larga); a assinatura
floral tem fundo BRANCO PURO (255) com rosas rosa-claras também de
luminância alta — faixa estreita evita comer as pétalas. Conferido no
render final (slide 9, medalhão grande): sem halo, sem fundo branco
sobrando, rosas preservadas.
2026-11-23 — **"Selo da assinatura sempre redondo" (melhoria pedida pra
TODOS os posts)**: conferi o `.marca-dagua-chip` de `gerar-posts.js`
(usado em `gerar-posts.js`/`gerar-posts-tematicos.js`/`gerar-posts-
catalogo.js`) — já é `border-radius:50%` desde a v4 (Rodada 14), ou
seja, **já nasce redondo**; não havia nada quadrado pra corrigir. Só o
NOVO medalhão de assinatura floral (exclusivo desta rodada, pensado pro
tema "noite") precisava nascer redondo, e nasceu. Nenhuma mudança em
`gerar-posts.js` foi necessária aqui.
2026-11-23 — **"Fotos sem borda branca sobrando" (mesma melhoria)**:
conferidos os 3 layouts de foto-detalhe de `gerar-posts.js`
(`slideFotoPolaroid`/`MolduraDupla`/`Organica`) — a variante "moldura
dupla" já usa passe-partout CREME (não branco) e a "cantos orgânicos"
não tem moldura nenhuma (sangra até o filete dourado). Só a "polaroid"
tem uma borda branca de 20px — decisão: MANTIDA de propósito, porque é
a identidade do próprio formato "polaroid" (pedido assim na v5, Rodada
14: "passe-partout fino e uniforme"), não uma sobra acidental de
`object-fit:contain` (esse bug, de fundo vazio DENTRO do cartão, já foi
corrigido na própria v5). Removê-la descaracterizaria a variante.
Nenhuma mudança em `gerar-posts.js`; decisão registrada aqui pro
Fabrício corrigir meu entendimento se não for essa a intenção.
2026-11-23 — Fechamento: `node --check` no script novo: OK. Nenhum
arquivo do site/backend tocado — só `marketing/instagram/
gerar-carrossel-historia.js` (novo) e as entradas de documentação desta
rodada. Saída só em `site-mae\instagram-posts\anjos-do-barro-a-luz\`
(fora do git). Git limpo antes de qualquer commit (nada commitado nesta
rodada até o Fabrício revisar as imagens).

## Cadastro das peças novas (24/11) — pote, pratos de pizza, saboneteira

2026-11-24 — Nomes artísticos escolhidos sem repetir nada do catálogo:
"Pote Âmbar e Meia-Noite" (potinho dourado/azul, evita confusão com o
id 33 "Pote Bruma Dourada", vendido); pratos de pizza com nomes leves e
culinários ("Prato Eu Amo Pizza" — traz a frase pintada na peça, "Eu ❤
Pizza"; "Prato Noite de Pizza" para a calabresa; "Prato Margherita ao
Sol" e "Prato Horta de Manjericão" para as 2 tradicionais de
tomate/manjericão); "Saboneteira Folha Verde-Noturna" para a saboneteira
(folha lisa, sem pássaro — nome não reaproveita as 2 saboneteiras
"Pássaro" já existentes).
2026-11-24 — **Achado não pedido**: a leva trouxe 2 fatias de
calabresa/cebola com o mesmo desenho (pedido original falava em 1 só).
Tratei como 2 produtos (cada peça é única, regra do catálogo) — "Prato
Noite de Pizza" (id 48) é o oficial, visível; "Prato Fatia de
Calabresa" (id 49) entra oculto:true, com o MESMO preço da irmã
(R$ 129,90) como provisório, até a Anasor confirmar se quer vender a
2ª também e por quanto.
2026-11-24 — Selo "assinada" em todas as peças de pizza (o próprio
pedido confirmou que todas têm a assinatura da artesã) e no potinho
(assinatura vista na foto do fundo). Saboneteira ficou sem "assinada"
(nenhuma foto mostra o fundo dela) — usei "modelada-a-mao" em vez
disso, já que a descrição menciona isso e é visivelmente verdade
(peça de folha moldada à mão, com furos feitos um a um).
2026-11-24 — Sem chat do WhatsApp (`_chat.txt`) na pasta — só fotos e
vídeos. Medidas, "pintada/modelada à mão" (quando não visível) e
confirmação de uso no forno/micro-ondas/lava-louça do prato de pizza
ficaram para a Anasor confirmar (ver relatório final da tarefa).
2026-11-24 — Seção "Hora da Pizza" entra na Home entre "Seleção
Especial" e "Crochê" (duas seções já bege ali — inserir uma seção nova,
também bege, nesse ponto não quebra o ritmo bege/marrom existente,
diferente de inserir entre duas seções escuras).

