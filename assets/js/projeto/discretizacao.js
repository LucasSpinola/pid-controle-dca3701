import * as P from '../nucleo/polinomio.js';
import * as C from '../nucleo/complexo.js';
import * as M from '../nucleo/matriz.js';
import { raizes, ordenarParaExibicao } from '../nucleo/raizes.js';
import { realizarEmEspacoDeEstados, discretizarEstados } from './respostaDegrau.js';

const FOLGA_RELATIVA = 1e-12;
const FOLGA_DE_RAIZ_REPETIDA = 1e-6;

export const METODOS = {
  euler: {
    nome: 'Euler ou Forward',
    substituicao: 's = \\frac{z - 1}{T}',
    alfa: () => [1, -1],
    beta: (periodo) => [0, periodo],
  },
  'euler-atraso': {
    nome: 'Backward',
    substituicao: 's = \\frac{z - 1}{T\\,z}',
    alfa: () => [1, -1],
    beta: (periodo) => [periodo, 0],
  },
  tustin: {
    nome: 'Tustin (trapezoidal)',
    substituicao: 's = \\frac{2}{T}\\,\\frac{z - 1}{z + 1}',
    alfa: () => [2, -2],
    beta: (periodo) => [periodo, periodo],
  },
  degrau: {
    nome: 'invariância ao degrau (SOZ)',
    segurador: true,
  },
};

export const ALVOS = {
  controlador: 'G_c(s)',
  malha: 'G_c(s)G(s)H(s)',
  planta: 'G(s)',
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

function traco(matriz) {
  return matriz.reduce((total, linha, i) => total + linha[i], 0);
}

function funcaoDiscretaDosEstados(transicao, entrada, saida, direto) {
  const ordem = transicao.length;
  const identidade = M.identidade(ordem);
  const denominador = [1];
  const numerador = [];
  let acumulada = identidade;
  for (let k = 1; k <= ordem; k += 1) {
    const linha = saida.reduce((total, c, i) => total + c * M.aplicar(acumulada, entrada)[i], 0);
    numerador.push(linha);
    const produto = M.multiplicar(transicao, acumulada);
    const coeficiente = -traco(produto) / k;
    denominador.push(coeficiente);
    acumulada = M.somar(produto, M.escalar(identidade, coeficiente));
  }
  return {
    numerador: P.somar(P.preencher(numerador, ordem + 1), P.escalar(denominador, direto)),
    denominador,
  };
}

function fracoesParciais(numerador, denominador, periodo) {
  const denominadorComDegrau = P.multiplicar(P.normalizar(denominador), [1, 0]);
  const polos = ordenarParaExibicao(raizes(denominadorComDegrau));
  const escala = Math.max(1, ...polos.map((p) => C.modulo(p)));
  for (let i = 0; i < polos.length; i += 1) {
    for (let j = i + 1; j < polos.length; j += 1) {
      if (C.distancia(polos[i], polos[j]) < FOLGA_DE_RAIZ_REPETIDA * escala) {
        return null;
      }
    }
  }
  const derivada = P.derivar(denominadorComDegrau);
  return polos.map((polo) => {
    const residuo = C.dividir(P.avaliarComplexo(numerador, polo), P.avaliarComplexo(derivada, polo));
    const amostrado = C.escalar(
      C.complexo(Math.cos(polo.im * periodo), Math.sin(polo.im * periodo)),
      Math.exp(polo.re * periodo),
    );
    return { polo, residuo, amostrado };
  });
}

function porSegurador(numerador, denominador, periodo) {
  if (P.grau(numerador) > P.grau(denominador)) {
    throw new Error('a invariância ao degrau exige uma função própria, com grau do numerador até o do denominador.');
  }
  const { estados, saida, direto, ordem } = realizarEmEspacoDeEstados(numerador, denominador);
  if (ordem === 0) {
    return { numerador: [direto], denominador: [1], fracoes: null };
  }
  const { transicao, entrada } = discretizarEstados(estados, ordem, periodo);
  const discreta = funcaoDiscretaDosEstados(transicao, entrada, saida, direto);
  return {
    numerador: aparar(discreta.numerador),
    denominador: aparar(discreta.denominador),
    fracoes: fracoesParciais(numerador, denominador, periodo),
  };
}

function finalizar(base, numerador, denominador) {
  const { num, den, cancelados } = cancelarFatoresZ(aparar(numerador), aparar(denominador));
  const lider = den[0];
  const numeradorZ = P.escalar(num, 1 / lider);
  const denominadorZ = P.escalar(den, 1 / lider);
  const polos = denominadorZ.length > 1 ? ordenarParaExibicao(raizes(denominadorZ)) : [];
  const polosContinuos = P.grau(base.denominadorS) > 0 ? ordenarParaExibicao(raizes(base.denominadorS)) : [];
  return {
    ...base,
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

export function discretizar(numerador, denominador, idDoMetodo, periodo) {
  const metodo = METODOS[idDoMetodo];
  if (!metodo) {
    throw new Error(`Método de discretização desconhecido: ${idDoMetodo}`);
  }
  const base = {
    id: idDoMetodo,
    metodo,
    periodo,
    numeradorS: P.normalizar(numerador),
    denominadorS: P.normalizar(denominador),
  };

  if (metodo.segurador) {
    const resultado = porSegurador(numerador, denominador, periodo);
    return finalizar(
      { ...base, fracoes: resultado.fracoes, numeradorBruto: resultado.numerador, denominadorBruto: resultado.denominador },
      resultado.numerador,
      resultado.denominador,
    );
  }

  const alfa = metodo.alfa(periodo);
  const beta = metodo.beta(periodo);
  const ordem = Math.max(P.grau(numerador), P.grau(denominador));
  const numeradorSubstituido = substituir(numerador, alfa, beta, ordem);
  const denominadorSubstituido = substituir(denominador, alfa, beta, ordem);
  return finalizar(
    { ...base, ordem, alfa, beta, numeradorSubstituido, denominadorSubstituido },
    numeradorSubstituido,
    denominadorSubstituido,
  );
}

export function discretizarProjeto(projeto, pedido) {
  const { malhaFechada, entrada } = projeto;
  const alvos = {
    malha: [malhaFechada.numeradorAberto, malhaFechada.denominadorAberto],
    controlador: [malhaFechada.numeradorControlador, malhaFechada.denominadorControlador],
    planta: [entrada.nG, entrada.dG],
  };
  const [numerador, denominador] = alvos[pedido.alvo] || alvos.controlador;
  return { alvo: pedido.alvo, ...discretizar(numerador, denominador, pedido.metodo, pedido.periodo) };
}
