import { test, expect } from "vitest";

const loja = "https://serverest.dev";

// Cria um usuário, faz login e devolve o token
async function criarUsuarioEObterToken() {
  const email = `teste${Date.now()}@teste.com`;
  const senha = "1234";

  const cadastro = await fetch(`${loja}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: "Teste",
      email: email,
      password: senha,
      administrador: "true",
    }),
  });

  expect(cadastro.status).toBe(201);

  const login = await fetch(`${loja}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: senha,
    }),
  });

  expect(login.status).toBe(200);

  const dadosLogin = (await login.json()) as {
    authorization: string;
  };

  return dadosLogin.authorization;
}

// APIs envolvidas: usuários, login, produtos e carrinhos.
// O teste coloca 3 unidades no carrinho e verifica se o estoque cai de 10 para 7.
test(
  "colocar três unidades no carrinho diminui o estoque do produto",
  async () => {
    // PASSO 1: criar usuário, fazer login e obter o token
    const token = await criarUsuarioEObterToken();

    // PASSO 2: cadastrar um produto com 10 unidades
    const produto = await fetch(`${loja}/produtos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        nome: `Produto ${Date.now()}`,
        preco: 100,
        descricao: "Produto de teste",
        quantidade: 10,
      }),
    });

    expect(produto.status).toBe(201);

    const dadosProduto = (await produto.json()) as {
      _id: string;
    };

    const idProduto = dadosProduto._id;

    // PASSO 3: colocar 3 unidades no carrinho
    const carrinho = await fetch(`${loja}/carrinhos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        produtos: [
          {
            idProduto: idProduto,
            quantidade: 3,
          },
        ],
      }),
    });

    expect(carrinho.status).toBe(201);

    // PASSO 4: consultar o produto
    const consulta = await fetch(`${loja}/produtos/${idProduto}`);

    expect(consulta.status).toBe(200);

    const produtoAtualizado = (await consulta.json()) as {
      quantidade: number;
    };

    // O produto tinha 10 unidades e 3 foram colocadas no carrinho
    expect(produtoAtualizado.quantidade).toBe(7);
  },
  15000,
);