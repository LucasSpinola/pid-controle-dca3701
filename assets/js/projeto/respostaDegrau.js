import * as M from '../nucleo/matriz.js';
import * as P from '../nucleo/polinomio.js';
import { CONSTANTES_DE_ACOMODACAO } from './especificacoes.js';

const AMOSTRAS = 1600;
const CONSTANTES_DE_TEMPO = 7;
const MULTIPLO_MINIMO = 2.5;
const MULTIPLO_MAXIMO = 25;

export function realizarEmEspacoDeEstados(numerador, denominador) {
  const den = P.normalizar(denominador);
  const ordem = den.length - 1;
  const a = den.map((valor) => valor / den[0]);
  const num = P.preencher(P.normalizar(numerador).map((valor) => valor / den[0]), ordem + 1);
  const direto = num[0];
  const saida = num.slice(1).map((valor, i) => valor - direto * a[i + 1]);

  const estados = M.zeros(ordem);
  for (let j = 0; j < ordem; j += 1) {
    estados[0][j] = -a[j + 1];
  }
  for (let i = 1; i < ordem; i += 1) {
    estados[i][i - 1] = 1;
  }
  return { estados, saida, direto, ordem };
}

export function discretizarEstados(estados, ordem, passo) {
  const aumentada = M.zeros(ordem + 1);
  for (let i = 0; i < ordem; i += 1) {
    for (let j = 0; j < ordem; j += 1) {
      aumentada[i][j] = estados[i][j] * passo;
    }
  }
  aumentada[0][ordem] = passo;

  const exponencial = M.exponencial(aumentada);
  return {
    transicao: exponencial.slice(0, ordem).map((linha) => linha.slice(0, ordem)),
    entrada: exponencial.slice(0, ordem).map((linha) => linha[ordem]),
  };
}

export function valorFinal(numerador, denominador) {
  return P.avaliar(numerador, 0) / P.avaliar(denominador, 0);
}

export function horizonteDeSimulacao(polos, sigma) {
  const base = CONSTANTES_DE_ACOMODACAO[2] / sigma;
  const relevantes = polos
    .filter((item) => item.classe !== 'cancelado')
    .map((item) => -item.ponto.re);
  const lento = Math.min(...relevantes);
  const estimado = CONSTANTES_DE_TEMPO / lento;
  return Math.min(Math.max(estimado, MULTIPLO_MINIMO * base), MULTIPLO_MAXIMO * base);
}

export function simularDegrau(numerador, denominador, duracao) {
  const { estados, saida, direto, ordem } = realizarEmEspacoDeEstados(numerador, denominador);
  const passo = duracao / (AMOSTRAS - 1);
  const { transicao, entrada } = discretizarEstados(estados, ordem, passo);

  const tempos = new Float64Array(AMOSTRAS);
  const saidas = new Float64Array(AMOSTRAS);
  let estado = new Array(ordem).fill(0);

  for (let k = 0; k < AMOSTRAS; k += 1) {
    tempos[k] = k * passo;
    saidas[k] = estado.reduce((total, valor, i) => total + valor * saida[i], direto);
    estado = M.aplicar(transicao, estado).map((valor, i) => valor + entrada[i]);
  }
  return { tempos, saidas, duracao };
}

function acomodacao(tempos, normalizadas, faixa) {
  const ultima = normalizadas.length - 1;
  for (let k = ultima; k >= 0; k -= 1) {
    const excesso = Math.abs(normalizadas[k] - 1) - faixa;
    if (excesso <= 0) {
      continue;
    }
    if (k === ultima) {
      return Infinity;
    }
    const seguinte = Math.abs(normalizadas[k + 1] - 1) - faixa;
    return tempos[k] + ((tempos[k + 1] - tempos[k]) * excesso) / (excesso - seguinte);
  }
  return 0;
}

export function medirResposta(simulacao, final) {
  if (!Number.isFinite(final) || Math.abs(final) < 1e-12) {
    return null;
  }
  const { tempos, saidas } = simulacao;
  const normalizadas = Array.from(saidas, (valor) => valor / final);

  let indicePico = 0;
  for (let k = 1; k < normalizadas.length; k += 1) {
    if (normalizadas[k] > normalizadas[indicePico]) {
      indicePico = k;
    }
  }
  const sobressinal = Math.max(0, (normalizadas[indicePico] - 1) * 100);

  return {
    valorFinal: final,
    pico: saidas[indicePico],
    tempoDePico: sobressinal > 0 ? tempos[indicePico] : null,
    sobressinal,
    acomodacao2: acomodacao(tempos, normalizadas, 0.02),
    acomodacao5: acomodacao(tempos, normalizadas, 0.05),
  };
}
