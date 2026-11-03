# language: pt
@checkout
Funcionalidade: Checkout de compra
  Como cliente da loja
  Quero comprar produtos
  Para recebê-los no meu endereço

  @smoke
  Cenário: C1 - Compra completa com dados válidos
    Dado que tenho uma conta cadastrada
    E que estou logado
    Quando adiciono os produtos "1" e "2" ao carrinho
    Então o carrinho exibe os produtos com nome, preço, quantidade e total corretos
    Quando sigo para o checkout
    Então o endereço de entrega exibido é o da minha conta
    Quando confirmo o pedido com o comentário "Entregar em horário comercial"
    E pago com um cartão válido
    Então vejo a confirmação do pedido

  @negative
  Cenário: C2 - Checkout sem estar logado
    Dado que não estou logado
    Quando adiciono os produtos "1" ao carrinho
    E tento seguir para o checkout
    Então sou informado de que preciso entrar na conta para finalizar a compra

  @negative
  Cenário: C3 - Carrinho vazio
    Dado que tenho uma conta cadastrada
    E que estou logado
    Quando acesso o carrinho sem ter adicionado produtos
    Então vejo que o carrinho está vazio
    E não é possível seguir para o checkout

  @negative
  Cenário: C4 - Dados de pagamento em branco
    Dado que tenho uma conta cadastrada
    E que estou logado
    E que adicionei os produtos "1" ao carrinho e cheguei ao pagamento
    Quando tento pagar sem preencher os dados do cartão
    Então o navegador bloqueia o pagamento indicando os dados do cartão como obrigatórios
    E o pedido não é confirmado

  # Defeito do site: aceita qualquer valor nos campos do cartão (ver docs/bugs/BUG-001).
  @negative @known-defect @BUG-001
  Cenário: C5 - Número de cartão inválido
    Dado que tenho uma conta cadastrada
    E que estou logado
    E que adicionei os produtos "1" ao carrinho e cheguei ao pagamento
    Quando pago com o cartão inválido:
      | nome      | numero | cvc | mes | ano  |
      | QA Teste  | abc123 | x   | 99  | 1900 |
    Então o pagamento é recusado
    E o pedido não é confirmado

  # Defeito do site: o endereço só é validado no navegador; contas sem endereço chegam ao pagamento (ver docs/bugs/BUG-002).
  @negative @known-defect @BUG-002
  Cenário: C6 - Endereço de entrega incompleto
    Dado que tenho uma conta cadastrada sem endereço de entrega
    E que estou logado
    Quando adiciono os produtos "1" ao carrinho
    E sigo para o checkout
    Então a compra é bloqueada por endereço de entrega incompleto
