# language: pt
@login
Funcionalidade: Login e navegação até o formulário de contato
  Como cliente da loja
  Quero acessar minha conta
  Para navegar pelo site autenticado

  Contexto:
    Dado que tenho uma conta cadastrada
    E que estou na página de login

  @smoke
  Cenário: L1 - Login válido e navegação até o formulário Contact Us
    Quando faço login com as credenciais da minha conta
    Então vejo que estou logado com o meu nome
    Quando acesso a página de contato pelo menu
    Então o formulário de contato é exibido por completo
    E continuo logado com o meu nome

  @negative
  Cenário: L2 - Senha incorreta
    Quando faço login com o meu e-mail e a senha "senha-incorreta"
    Então vejo a mensagem de login inválido "Your email or password is incorrect!"
    E não estou logado

  @negative
  Cenário: L3 - Usuário inexistente
    Quando faço login com o e-mail "nao.cadastrado.qa@teste.com.br" e a senha "qualquer123"
    Então vejo a mensagem de login inválido "Your email or password is incorrect!"
    E não estou logado

  @negative
  Esquema do Cenário: <id> - Campo obrigatório em branco: <campo>
    Quando tento fazer login deixando o campo "<campo>" em branco
    Então o navegador bloqueia o envio indicando o campo "<campo>" como obrigatório
    E não estou logado

    Exemplos:
      | id | campo |
      | L4 | email |
      | L5 | senha |

  @negative
  Cenário: L6 - E-mail em formato inválido
    Quando faço login com o e-mail "email-sem-arroba" e a senha "qualquer123"
    Então o navegador bloqueia o envio indicando o e-mail como inválido
    E não estou logado

  @negative
  Cenário: L7 - Cadastro com e-mail já existente
    Quando tento iniciar um cadastro com o e-mail da minha conta
    Então vejo a mensagem de cadastro inválido "Email Address already exist!"
