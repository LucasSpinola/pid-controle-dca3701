import * as P from '../nucleo/polinomio.js';
import * as C from '../nucleo/complexo.js';
import { raizes, ordenarParaExibicao } from '../nucleo/raizes.js';

const FOLGA_RELATIVA = 1e-12;

export const METODOS = {
  euler: {
    nome: 'Euler (diferença para frente)',
    substituicao: 's = \\frac{z - 1}{T}',
    alfa: () => [1, -1],
    beta: (periodo) => [0, periodo],
  },
  'euler-atraso': {
    nome: 'Euler (diferença para trás)',
    substituicao: 's = \\frac{z - 1}{T\\,z}',
    alfa: () => [1, -1],
    beta: (periodo) => [periodo, 0],
  },
  tustin: {
    nome: 'Tustin (bilinear)',
    substituicao: 's = \\frac{2}{T}\\,\\frac{z - 1}{z + 1}',
    alfa: () => [2, -2],
    beta: (periodo) => [periodo, periodo],
  },
};

export const ALVOS = {
  controlador: 'G_c(s)',
  malha: 'G_c(s)G(s)H(s)',
};

function potencia(base, expoente) {
  let resultado = [1];
  for (let i = 0; i < expoente; i += 1) {
    resultado = P.multiplicar(resultado, base);
  }
  return resultado;
}

function aparar(p) {
  const escala = Math.max(P.maiorCoeficiente(p), 1e-300);
  let inicio = 0;
  while (inicio < p.length - 1 && Math.abs(p[inicio]) < FOLGA_RELATIVA * escala) {
    inicio += 1;
  }
  return p.slice(inicio).map((v) => (Math.abs(v) < FOLGA_RELATIVA * escala ? 0 : v));
}

function substituir(polinomio, alfa, beta, ordem) {
  const p = P.normalizar(polinomio);
  const grau = p.length - 1;
  let resultado = [0];
  for (let k = 0; k <= grau; k += 1) {
    const coeficiente = p[grau - k];
    const termo = P.multiplicar(potencia(alfa, k), potencia(beta, ordem - k));
    resultado = P.somar(resultado, P.escalar(termo, coeficiente));
  }
  return aparar(resultado);
}

function cancelarFatoresZ(numerador, denominador) {
  const num = numerador.slice();
  const den = denominador.slice();
  let cancelados = 0;
  while (num.length > 1 && den.length > 1 && num[num.length - 1] === 0 && den[den.length - 1] === 0) {
    num.pop();
    den.pop();
    cancelados += 1;
  }
  return { num, den, cancelados };
}

function equacaoDeDiferencas(numerador, denominador) {
  const ordem = denominador.length - 1;
  if (numerador.length - 1 > ordem) {
    return null;
  }
  return {
    entrada: P.preencher(numerador, ordem + 1),
    saida: denominador.slice(),
  };
}

export function discretizar(numerador, denominador, idDoMetodo, periodo) {
  const metodo = METODOS[idDoMetodo];
  if (!metodo) {
    throw new Error(`Método de discretização desconhecido: ${idDoMetodo}`);
  }
  const alfa = metodo.alfa(periodo);
  const beta = metodo.beta(periodo);
  const ordem = Math.max(P.grau(numerador), P.grau(denominador));

  const numeradorSubstituido = substituir(numerador, alfa, beta, ordem);
  const denominadorSubstituido = substituir(denominador, alfa, beta, ordem);
  const { num, den, cancelados } = cancelarFatoresZ(numeradorSubstituido, denominadorSubstituido);

  const lider = den[0];
  const numeradorZ = P.escalar(num, 1 / lider);
  const denominadorZ = P.escalar(den, 1 / lider);
  const polos = denominadorZ.length > 1 ? ordenarParaExibicao(raizes(denominadorZ)) : [];
  const polosContinuos = P.grau(denominador) > 0 ? ordenarParaExibicao(raizes(denominador)) : [];

  return {
    id: idDoMetodo,
    metodo,
    periodo,
    numeradorS: P.normalizar(numerador),
    denominadorS: P.normalizar(denominador),
    ordem,
    alfa,
    beta,
    numeradorSubstituido,
    denominadorSubstituido,
    cancelados,
    numeradorZ,
    denominadorZ,
    causal: numeradorZ.length <= denominadorZ.length,
    diferencas: equacaoDeDiferencas(numeradorZ, denominadorZ),
    polos: polos.map((ponto) => ({ ponto, modulo: C.modulo(ponto) })),
    estavel: polos.every((ponto) => C.modulo(ponto) < 1 - 1e-9),
    continuoEstavel: polosContinuos.every((ponto) => ponto.re < -1e-9),
  };
}

export function discretizarProjeto(malhaFechada, pedido) {
  const alvo = pedido.alvo === 'malha'
    ? [malhaFechada.numeradorAberto, malhaFechada.denominadorAberto]
    : [malhaFechada.numeradorControlador, malhaFechada.denominadorControlador];
  return { alvo: pedido.alvo, ...discretizar(alvo[0], alvo[1], pedido.metodo, pedido.periodo) };
}
