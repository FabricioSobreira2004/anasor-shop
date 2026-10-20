# Backend — Anasor Sobreira

**Estado: catálogo + checkout em modo stub (v0.2.0).** Já existe a
estrutura inteira de checkout/pagamento (Mercado Pago, Checkout Pro),
só que sem credenciais reais ainda — por isso "stub": os endpoints
funcionam, recalculam preço e frete de verdade, mas o link de
pagamento devolvido é FAKE (aponta pra dentro do próprio site, não pro
Mercado Pago). Ver os comentários `TODO` em `server.js` pra saber
exatamente onde entra cada peça real.

## Rodar localmente

```bash
cd backend
npm install      # baixa express + cors
npm start        # ou: npm run dev  (reinicia ao salvar)
```

Os scripts já carregam `backend/.env` sozinhos (flag nativa do Node
`--env-file-if-exists`, sem precisar da lib `dotenv`) — funciona com
ou sem o `.env` existir. Sem ele, o checkout continua funcionando em
modo fake (é exatamente o estado de hoje). Ver `.env.example` pra
saber quais variáveis existem e como preenchê-las quando as
credenciais do Mercado Pago chegarem.

**Requer Node 20.12+** (a flag `--env-file-if-exists` é nativa do
Node a partir daí). Este projeto foi testado em Node 24.

Depois abra:

- <http://localhost:3001/api/produtos> — catálogo completo
- <http://localhost:3001/api/produtos/1> — uma peça
- <http://localhost:3001/api/health> — "está no ar?"
- `POST http://localhost:3001/api/checkout` — cria um pedido (ver
  `js/checkout.js` no front pro formato do corpo esperado)
- `POST http://localhost:3001/api/webhook/mercadopago` — stub do
  webhook (hoje só loga e responde 200; ver TODO em `server.js`)

## Estrutura

```
backend/
  package.json        dependências e scripts (já carregam o .env)
  .env.example         modelo das variáveis de ambiente (COMMITADO)
  .env                 valores reais — NÃO commitado (.gitignore),
                       "ainda não existe" até as credenciais chegarem
  server.js            o servidor Express + as rotas + a LISTA DE TODOs
                       (o que falta pra chegar no pagamento de verdade)
  data/
    produtos.js        ponte temporária: lê o catálogo de ../../js/produtos.js
                       (fonte única da verdade) sem duplicar os dados
```

## De onde vêm os produtos hoje

Do próprio arquivo do front-end (`js/produtos.js`). O backend lê o
texto daquele arquivo e extrai o array `produtos`. É proposital e
**temporário** — evita manter duas cópias do catálogo. O próximo
passo é mover o catálogo para um banco de dados.

## De onde vêm os pedidos hoje

De um array em memória (`pedidosFake`, dentro de `server.js`) — some
toda vez que o servidor reinicia. Suficiente pra testar o fluxo
inteiro (formulário → checkout → link de pagamento → página de
retorno) sem precisar de banco de dados ainda.

## Próximos passos

A lista completa e comentada está no topo de `server.js`. Resumo:
banco de dados (catálogo **e** pedidos) → Preference real da API do
Mercado Pago em `POST /api/checkout` → conferir pagamentos de verdade
em `POST /api/webhook/mercadopago` → estoque (peça única = vendida
some da vitrine) → autenticação da artesã → deploy.
