const ORDEM_DE_TAYLOR = 18;
const NORMA_ALVO = 0.5;

export function zeros(linhas, colunas = linhas) {
  return Array.from({ length: linhas }, () => new Array(colunas).fill(0));
}

function identidade(ordem) {
  const saida = zeros(ordem);
  for (let i = 0; i < ordem; i += 1) {
    saida[i][i] = 1;
  }
  return saida;
}

function somar(a, b) {
  return a.map((linha, i) => linha.map((valor, j) => valor + b[i][j]));
}

function escalar(a, k) {
  return a.map((linha) => linha.map((valor) => valor * k));
}

function multiplicar(a, b) {
  const linhas = a.length;
  const colunas = b[0].length;
  const internas = b.length;
  const saida = zeros(linhas, colunas);
  for (let i = 0; i < linhas; i += 1) {
    for (let k = 0; k < internas; k += 1) {
      const fator = a[i][k];
      if (fator === 0) {
        continue;
      }
      for (let j = 0; j < colunas; j += 1) {
        saida[i][j] += fator * b[k][j];
      }
    }
  }
  return saida;
}

export function aplicar(a, vetor) {
  return a.map((linha) => linha.reduce((total, valor, j) => total + valor * vetor[j], 0));
}

function normaInfinito(a) {
  return a.reduce(
    (maior, linha) => Math.max(maior, linha.reduce((soma, valor) => soma + Math.abs(valor), 0)),
    0,
  );
}

export function exponencial(a) {
  const ordem = a.length;
  const norma = normaInfinito(a);
  const quadraturas = norma > NORMA_ALVO ? Math.ceil(Math.log2(norma / NORMA_ALVO)) : 0;
  const reduzida = escalar(a, 2 ** -quadraturas);

  let soma = identidade(ordem);
  let termo = identidade(ordem);
  for (let k = 1; k <= ORDEM_DE_TAYLOR; k += 1) {
    termo = escalar(multiplicar(termo, reduzida), 1 / k);
    soma = somar(soma, termo);
  }

  for (let i = 0; i < quadraturas; i += 1) {
    soma = multiplicar(soma, soma);
  }
  return soma;
}
