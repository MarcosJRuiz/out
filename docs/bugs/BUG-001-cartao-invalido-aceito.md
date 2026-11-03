# BUG-001 — Pagamento aceita dados de cartão inválidos

| Campo                | Valor                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Aplicação            | AutomationExercise — https://automationexercise.com                                             |
| Funcionalidade       | Checkout › Pagamento (`/payment`)                                                               |
| Severidade           | Alta — pedido confirmado sem pagamento válido                                                   |
| Prioridade           | Alta                                                                                            |
| Cenário automatizado | `e2e/features/checkout.feature` › **C5 - Número de cartão inválido** (`@known-defect @BUG-001`) |
| Status               | Aberto — reproduzido em 03/11/2026                                                              |

## Passos para reproduzir

1. Entrar com uma conta válida.
2. Adicionar qualquer produto ao carrinho e clicar em **Proceed To Checkout**.
3. Clicar em **Place Order**.
4. Preencher o pagamento com:
   - Name on Card: `QA Teste`
   - Card Number: `abc123`
   - CVC: `x`
   - Expiration: `99` / `1900`
5. Clicar em **Pay and Confirm Order**.

## Resultado esperado

O pagamento é recusado e o usuário permanece em `/payment` com a indicação dos campos inválidos (número de cartão não numérico, CVC inválido, mês inexistente e validade no passado).

## Resultado obtido

O pedido é confirmado: o site redireciona para `/payment_done/<id>` e exibe **"Order Placed!"** e **"Congratulations! Your order has been confirmed!"**.

## Análise

- Os campos do cartão só têm o atributo `required` do HTML; não há `pattern`, `maxlength` nem validação no servidor.
- Qualquer valor não vazio é aceito, inclusive letras no número do cartão e datas impossíveis.

## Evidências

- Relatório E2E (job `e2e-known-defects` da pipeline): screenshot da confirmação, vídeo da execução e trace do Playwright.
- Mensagem do teste: `o site deveria permanecer no pagamento e recusar o cartão — Received: ".../payment_done/500"`.
