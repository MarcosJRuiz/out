import { z } from 'zod';

const id = z.string().regex(/^[A-Za-z0-9]{16}$/, 'id do ServeRest (16 caracteres alfanuméricos)');

export const mensagemSchema = z.object({ message: z.string().min(1) }).strict();

/** Erros de validação: { campo: "mensagem" } */
export const errosValidacaoSchema = z.record(z.string(), z.string().min(1));

export const cadastroSchema = z
  .object({ message: z.literal('Cadastro realizado com sucesso'), _id: id })
  .strict();

export const loginSchema = z
  .object({
    message: z.literal('Login realizado com sucesso'),
    authorization: z.string().regex(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/, 'token JWT no formato Bearer'),
  })
  .strict();

export const usuarioSchema = z
  .object({
    nome: z.string(),
    email: z.email(),
    password: z.string(),
    administrador: z.enum(['true', 'false']),
    _id: id,
  })
  .strict();

export const listaUsuariosSchema = z
  .object({ quantidade: z.number().int().nonnegative(), usuarios: z.array(usuarioSchema) })
  .strict();

export const produtoSchema = z
  .object({
    nome: z.string(),
    preco: z.number().int().positive(),
    descricao: z.string(),
    quantidade: z.number().int().nonnegative(),
    _id: id,
  })
  .strict();

export const listaProdutosSchema = z
  .object({ quantidade: z.number().int().nonnegative(), produtos: z.array(produtoSchema) })
  .strict();

export const carrinhoSchema = z
  .object({
    produtos: z.array(
      z
        .object({ idProduto: id, quantidade: z.number().int().positive(), precoUnitario: z.number() })
        .strict(),
    ),
    precoTotal: z.number(),
    quantidadeTotal: z.number().int(),
    idUsuario: id,
    _id: id,
  })
  .strict();

export const listaCarrinhosSchema = z
  .object({ quantidade: z.number().int().nonnegative(), carrinhos: z.array(carrinhoSchema) })
  .strict();
