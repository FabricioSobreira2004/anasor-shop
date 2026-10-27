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
- Cada peça de cerâmica é **única (estoque 1)**: não existe seletor de quantidade.
- Peça indisponível: campo `disponivel: false` + botão **"Encomendar peça parecida"** pelo WhatsApp.
- **Peça vendida nunca sai do site:** marque `disponivel: false` em `js/produtos.js` e **nunca apague** a peça. Ela vira portfólio (foto desbotada, selo "Vendido", fim das listas, seção "Já encontraram um lar") e gera encomenda. O front e o `POST /api/checkout` (409) bloqueiam a compra.
- **Selos:** campo opcional `selo` em `js/produtos.js` (`"mais-vendido"`, `"queridinho"`, `"novidade"`, `"assinada"`, ou uma lista). Um selo por card, prioridade vendido > mais-vendido > assinada > queridinho > novidade. Só o que for verdade: "mais-vendido" só com vendas confirmadas; "assinada" só com assinatura da artesã.
- **"De" riscado (`precoOriginal`):** só um preço que a peça realmente teve. O selo mostra "Lançamento -N%"; com desconto abaixo de 5%, o "de/por" inteiro (riscado e selo) não aparece.
- Preços e produtos ficam em `js/produtos.js`, a fonte única. O backend recalcula os valores a partir dele.
- O frete é **grátis**, embutido no preço.

## Identidade visual
- Bege/marrom artesanal, fontes **Fraunces + Jost**, botões *gummy* 3D.
- Não mudar a identidade sem pedido.

## Testes
- Mobile: sempre com emulação real de dispositivo (Playwright, **iPhone 15, 393×852**) e gestos de toque reais.
- Pagamento: sem `MERCADOPAGO_ACCESS_TOKEN`, o backend roda em **modo demonstração**. **Nunca gerar pagamento real em teste.**

## Skills
- Usar `frontend-design`, `impeccable`, `code-review` e `security-review` quando fizer sentido.
