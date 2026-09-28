import { test, expect } from "vitest";

const loja = "https://serverest.dev";

// Cria um usuário administrador, faz login e devolve o token
async function criarUsuarioEObterToken() {
  const email = `teste${Date.now()}-${Math.random()}@teste.com`;
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

// Cadastra um produto com 10 unidades e devolve o ID
async function criarProduto(token: string) {
  const produto = await fetch(`${loja}/produtos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({
      nome: `Produto ${Date.now()}-${Math.random()}`,
      preco: 100,
      descricao: "Produto de teste",
      quantidade: 10,
    }),
  });

  expect(produto.status).toBe(201);

  const dadosProduto = (await produto.json()) as {
    _id: string;
  };

  return dadosProduto._id;
}

// Coloca 3 unidades do produto no carrinho
async function criarCarrinho(token: string, idProduto: string) {
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
}

// APIs envolvidas: usuários, login, produtos e carrinhos.
// O teste coloca 3 unidades no carrinho e verifica se o estoque cai de 10 para 7.
test(
  "colocar três unidades no carrinho diminui o estoque do produto",
  async () => {
    const token = await criarUsuarioEObterToken();
    const idProduto = await criarProduto(token);

    await criarCarrinho(token, idProduto);

    const consulta = await fetch(`${loja}/produtos/${idProduto}`);

    expect(consulta.status).toBe(200);

    const produtoAtualizado = (await consulta.json()) as {
      quantidade: number;
    };

    expect(produtoAtualizado.quantidade).toBe(7);
  },
  15000,
);

// APIs envolvidas: usuários, login, produtos e carrinhos.
// O teste coloca 3 unidades no carrinho, cancela a compra
// e verifica se o estoque do produto volta para 10.
test(
  "cancelar a compra devolve o produto ao estoque",
  async () => {
    // Cada teste cria seu próprio usuário, token, produto e carrinho
    const token = await criarUsuarioEObterToken();
    const idProduto = await criarProduto(token);

    await criarCarrinho(token, idProduto);

    // Antes do cancelamento, o estoque deve estar em 7
    const consultaAntes = await fetch(
      `${loja}/produtos/${idProduto}`,
    );

    expect(consultaAntes.status).toBe(200);

    const produtoAntes = (await consultaAntes.json()) as {
      quantidade: number;
    };

    expect(produtoAntes.quantidade).toBe(7);

    // Cancela o carrinho pertencente ao usuário do token
    const cancelamento = await fetch(
      `${loja}/carrinhos/cancelar-compra`,
      {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      },
    );

    expect(cancelamento.status).toBe(200);

    // Consulta novamente o mesmo produto
    const consultaDepois = await fetch(
      `${loja}/produtos/${idProduto}`,
    );

    expect(consultaDepois.status).toBe(200);

    const produtoDepois = (await consultaDepois.json()) as {
      quantidade: number;
    };

    // As 3 unidades devem ter voltado ao estoque
    expect(produtoDepois.quantidade).toBe(10);
  },
  15000,
);