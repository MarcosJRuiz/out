# BUG-002 — Compra segue para o pagamento sem endereço de entrega

| Campo                | Valor                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Aplicação            | AutomationExercise — https://automationexercise.com                                                  |
| Funcionalidade       | Cadastro de conta e Checkout (`/signup`, `/checkout`)                                                |
| Severidade           | Alta — pedido sem endereço de entrega                                                                |
| Prioridade           | Alta                                                                                                 |
| Cenário automatizado | `e2e/features/checkout.feature` › **C6 - Endereço de entrega incompleto** (`@known-defect @BUG-002`) |
| Status               | Aberto — reproduzido em 03/11/2026                                                                   |

## Contexto

No AutomationExercise o endereço de entrega é informado no **cadastro da conta**; o checkout apenas exibe o endereço salvo. Por isso o cenário "endereço de entrega incompleto" do checkout depende de uma conta sem endereço.

## Passos para reproduzir

Pela interface:

1. Iniciar um cadastro em `/login` › **New User Signup!**.
2. No formulário de conta, remover o atributo `required` dos campos de endereço (DevTools) e deixá-los em branco.
3. Clicar em **Create Account** — a conta é criada.

Ou pela API pública do site: `POST /api/createAccount` com `address1`, `city`, `state` e `zipcode` vazios — responde `responseCode: 201`.

Depois:

4. Entrar com essa conta, adicionar um produto ao carrinho e clicar em **Proceed To Checkout**.
5. Clicar em **Place Order**.

## Resultado esperado

O servidor recusa o cadastro sem endereço, ou o checkout bloqueia a compra informando que o endereço de entrega está incompleto.

## Resultado obtido

- A conta é criada sem endereço (servidor e API não validam os campos obrigatórios).
- O checkout exibe o bloco de endereço vazio e o botão **Place Order** leva para `/payment`, permitindo concluir a compra.

## Análise

A validação de endereço existe apenas no navegador (atributo `required`). Validação somente no cliente pode ser contornada; o servidor deveria validar os campos obrigatórios.

## Evidências

- Relatório E2E (job `e2e-known-defects` da pipeline): screenshot da tela de pagamento, vídeo da execução e trace do Playwright.
- Mensagem do teste: `o site não deveria permitir seguir para o pagamento sem endereço de entrega — Received: ".../payment"`.
