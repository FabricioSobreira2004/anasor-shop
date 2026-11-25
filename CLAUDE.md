# Anasor Shop — regras de trabalho

## Fluxo Git
- **Antes de qualquer tarefa:** `git pull` (sem sobrescrever trabalho local). Se houver conflito, **parar e avisar o Fabrício**.
- **Ao terminar cada tarefa:**
  1. Rodar o site localmente e conferir: o push em `main` **publica automaticamente na Vercel**.
  2. `git add` só dos arquivos alterados. **Nunca** `backend/.env`, `node_modules` nem a pasta `site-mae`.
  3. Commit pequeno, com mensagem clara em português.
  4. `git push` para `main` no GitHub do Fabrício. **Nunca usar force push.**
- **Nunca** commitar chaves, tokens ou senhas.

## Código
- Código sempre comentado explicando o **porquê** de cada ação (preferência do Fabrício).

## Regras de negócio
- E-mail oficial da loja: contatoatelieanasor@gmail.com
- Cada peça de cerâmica é **única (estoque 1)**: não existe seletor de quantidade. **Exceção:** itens com `permiteQuantidade: true` (hoje, só os Anjos de Luz, ids 53-55) — feitos em quantidade para lembrancinhas de Batizado/1ª Eucaristia. Campos: `estoque` (unidades prontas hoje, ajustado à mão com `node backend/scripts/estoque.js <id> <novo>`), `maxPorPedido` (= estoque), `grupoAtacado` (soma quantidade ENTRE modelos diferentes pro desconto), `minAtacado` (quantidade do grupo que liga o atacado) e `precoAtacado`. `precoUnitario(produto, totalDoGrupo)` em `js/produtos.js` é a ÚNICA função que decide o preço de 1 unidade — front (card/página/mini-carrinho/checkout) e backend (`POST /api/checkout`) usam a mesma. **Nunca** mostre o número de unidades em estoque numa listagem normal (sem "restam X!"); ele só aparece na mensagem de "acima do estoque, é por encomenda".
- Peça indisponível: campo `disponivel: false` + botão **"Encomendar peça parecida"** pelo WhatsApp. Anjo de Luz com `estoque` zerado usa `estaEsgotada()` em vez disso — selo "Esgotado" e CTA "Encomende o seu" (estoque é temporário, repõe numa fornada nova; não entra na seção "Já encontraram um lar").
- **HTML dentro de template literals (innerHTML):** nunca coloque um `<div>` dentro de um `<p>` — o parser do navegador fecha o `<p>` sozinho antes da div, esvaziando o conteúdo **sem erro nenhum no console**. Achado real (Leva 1, mini-carrinho): o preço de um Anjo de Luz sumia silenciosamente por causa disso. Use `<div>` para qualquer wrapper que precise conter outro bloco.
- **Peça vendida nunca sai do site:** marque `disponivel: false` em `js/produtos.js` e **nunca apague** a peça. Ela vira portfólio (foto desbotada, selo "Vendido", fim das listas, seção "Já encontraram um lar") e gera encomenda. O front e o `POST /api/checkout` (409) bloqueiam a compra.
- **Selos:** campo opcional `selo` em `js/produtos.js` (texto ou lista). Um selo por card, por prioridade: vendido > esgotado (estoque zerado, só Anjo de Luz) > mais-vendido > assinada ("Peça Assinada") > queima-raku ("Queima Raku", só os Vasos Raku, ids 56-59) > lembranca-batizado ("Lembrança de Batizado", só Anjos de Luz) > edicao-limitada ("Edição Limitada", só as canecas Surpresa 19 e 20) > queridinho ("Queridinha do Ateliê") > novidade > kit ("Kit completo") > pintada-a-mao ("Pintada à Mão", só se a descrição diz pintada à mão) > modelada-a-mao ("Modelada à Mão", só se a descrição diz modelada à mão) > com-video ("Veja em vídeo"). "vendido"/"esgotado"/"com-video" são automáticos (`disponivel: false` / estoque zerado / `videoUrl`). Só o que for verdade: "mais-vendido" só com vendas confirmadas (hoje nenhuma); "assinada" só com assinatura da artesã. Nada de urgência falsa ou prova social inventada.
- **Kit com componente vendido avulso (`componentesKit`):** campo opcional em `js/produtos.js`, lista de ids dos produtos que compõem o kit (hoje só id 59, "Kit dos 3 Vasos Raku" → `[56, 57, 58]`). `kitTemComponenteVendido(produto)` confere se QUALQUER um desses ids já está `disponivel: false` — se sim, o kit bloqueia a compra sozinho (front mostra "Kit incompleto" + CTA de WhatsApp; backend recusa com 409) sem precisar mexer no próprio kit. Ao vender o kit inteiro, os componentes também precisam virar `disponivel: false` (o aviso de pedido já lembra disso, ver `pedido-email.js`/`pedido-telegram.js`). Teste: `node backend/scripts/teste-kit-raku.js`.
- **Primeira foto sempre vertical (4:5):** desde a Leva 3, `galeriaHTML(..., { molduraFixa: true })` é FIXO pro catálogo inteiro (antes só ligava pros Anjos de Luz) — o audit `scripts/auditoria-primeira-foto.js` confirmou que toda peça já tem a 1ª foto vertical (reordenada ou recortada sem cortar o produto, original sempre preservado em `imagensExtras`). Produto novo: a 1ª foto já precisa nascer vertical, ou vai esticar/cortar errado no card.
- **"De" riscado (`precoOriginal`):** só um preço que a peça realmente teve. O selo mostra "Lançamento -N%"; com desconto abaixo de 5%, o "de/por" inteiro (riscado e selo) não aparece.
- Preços e produtos ficam em `js/produtos.js`, a fonte única. O backend recalcula os valores a partir dele.
- O frete é **grátis**, embutido no preço.
- **Desenho repetido (duas peças idênticas):** um anúncio VISÍVEL por desenho — a 2ª vira `oculto:true` (nunca apaga, nunca muda o id). Ver ids 48/49 (Noite de Pizza/Fatia de Calabresa) e 50/51 (Margherita ao Sol/Horta de Manjericão).
- **Vídeo de produto, player da página (`.produto-video__player`):** usa `aspect-ratio` FIXO (9:16, o padrão de todo vídeo do catálogo) + `object-fit:cover`, nunca `width:100%; height:auto` dependendo da proporção que o navegador relatar pro `<video>` — achado real (Leva 2): confirmado por screenshot que isso gerava faixas pretas grossas (pillarbox) em alguns vídeos, porque o `videoWidth`/`videoHeight` que o elemento relata nem sempre bate com o conteúdo de verdade.
- **Carrossel horizontal de vídeos com autoplay (IntersectionObserver):** o `root` do observer precisa ser o PRÓPRIO contêiner que rola (ex.: `.pizza-video-carrossel`), nunca o padrão (viewport) — achado real (Leva 2): com `root` = viewport, cards lado a lado na mesma altura ficavam todos "isIntersecting:true" ao mesmo tempo (viewport não distingue qual está centralizado no scroll horizontal), e a lógica de "pausa os outros antes de tocar" virava uma corrida onde o vídeo errado (ou nenhum) tocava.
- **Todo vídeo do site é sempre mudo** (`-an` no ffmpeg, `muted` no HTML) — não existe mais botão de "toque pra ligar o som" em nenhum carrossel.

## Identidade visual
- Bege/marrom artesanal, fontes **Fraunces + Jost**, botões *gummy* 3D.
- Não mudar a identidade sem pedido.

## Testes
- Mobile: sempre com emulação real de dispositivo (Playwright, **iPhone 15, 393×852**) e gestos de toque reais.
- Pagamento: sem `MERCADOPAGO_ACCESS_TOKEN`, o backend roda em **modo demonstração**. **Nunca gerar pagamento real em teste.**
- **Testar sem risco, sem editar nem mover `backend/.env`:** suba o servidor com `FORCAR_DEMO=1` (dentro de `backend`, PowerShell: `$env:FORCAR_DEMO='1'; npm start`). Isso faz o servidor ignorar `MERCADOPAGO_ACCESS_TOKEN`/`MERCADOPAGO_PUBLIC_KEY` mesmo que venham do `.env`, e cair em modo demonstração. Em produção (`VERCEL_ENV=production`/`preview` ou `NODE_ENV=production`) o interruptor é **ignorado** — o site no ar nunca entra em modo demo sozinho.
  - **CONFIRME no log** a linha `🔒 MODO DEMONSTRAÇÃO FORÇADO: Mercado Pago desativado` antes de abrir qualquer página. Se não aparecer, **pare**.
  - **Nunca** faça `$env:MERCADOPAGO_ACCESS_TOKEN=''` (ou de qualquer outra variável) pra tentar "zerar" uma credencial: no PowerShell isso **remove** a variável, não a deixa vazia — o `--env-file-if-exists=.env` do `server.js` carrega o `.env` de qualquer jeito e a chave real de produção volta. Use `FORCAR_DEMO=1`.
  - Teste offline correspondente: `node backend/scripts/teste-forcar-demo.js` (confere, sem internet, que `FORCAR_DEMO=1` nunca deixa uma chamada real ao Mercado Pago acontecer, mesmo com um token de produção falso no ambiente).
- **Anjos de Luz (preço por quantidade/atacado):** `node backend/scripts/teste-anjos-estoque.js` (1/2/3/4 unidades, mistura dos 3 modelos, acima do estoque, preço adulterado pelo cliente, arredondamento, estoque zerado).
- **Kit dos 3 Vasos Raku (bloqueio por componente vendido):** `node backend/scripts/teste-kit-raku.js` (kit disponível, kit recusado com 1 componente vendido, o próprio componente vendido continua recusado, o outro componente (não vendido) continua comprável).

## Skills
- Usar `frontend-design`, `impeccable`, `code-review` e `security-review` quando fizer sentido.
