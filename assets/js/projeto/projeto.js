import * as P from '../nucleo/polinomio.js';
import { interpretarEspecificacao } from './especificacoes.js';
import {
  obterControlador,
  numeradorDoControlador,
  denominadorDoControlador,
  excessoDeZeros,
} from './controladores.js';
import { montarMalhaAberta } from './malhaAberta.js';
import { criterioDeAngulo, localizarZero, criterioDeModulo } from './criterios.js';
import { analisarMalhaFechada } from './malhaFechada.js';
import {
  horizonteDeSimulacao,
  simularDegrau,
  valorFinal,
  medirResposta,
} from './respostaDegrau.js';
import { calcularLugarRaizes } from './lugarRaizes.js';
import { ganhosDeDescolamento } from './descolamento.js';
import { pontosNotaveis, raioDeInteresse } from './pontosNotaveis.js';

function validarProprio(entrada, controlador) {
  const { nG, dG, nH, dH } = entrada;
  const folgaDireta = P.grau(dG) - P.grau(nG);
  const folgaAberta = folgaDireta + P.grau(dH) - P.grau(nH);
  if (excessoDeZeros(controlador) > Math.min(folgaDireta, folgaAberta)) {
    throw new Error(
      `com o ${controlador.nome}, $G_c(s)G(s)H(s)$ teria mais zeros que polos e a malha seria imprópria.`,
    );
  }
}

function responder(malhaFechada, desempenho) {
  const { numerador, caracteristica, polos } = malhaFechada;
  const simulacao = simularDegrau(numerador, caracteristica, horizonteDeSimulacao(polos, desempenho.sigma));
  return {
    simulacao,
    metricas: medirResposta(simulacao, valorFinal(numerador, caracteristica)),
  };
}

function varrer(projeto) {
  const { controlador, zero, malhaAberta, modulo } = projeto;
  const numeradorBruto = P.multiplicar(numeradorDoControlador(controlador, zero.valor), malhaAberta.numerador);
  const denominadorBruto = P.multiplicar(denominadorDoControlador(controlador), malhaAberta.denominador);
  const tamanho = Math.max(numeradorBruto.length, denominadorBruto.length);

  return calcularLugarRaizes(P.preencher(numeradorBruto, tamanho), P.preencher(denominadorBruto, tamanho), {
    zeros: [...malhaAberta.zeros, ...new Array(controlador.zeros).fill(zero.ponto)],
    ganhosNotaveis: [modulo.kc, ...ganhosDeDescolamento(numeradorBruto, denominadorBruto)],
    raioDeInteresse: raioDeInteresse(pontosNotaveis(projeto, { malhaFechada: true })),
  });
}

export function esbocarProjeto(nG, dG, nH, dH, especificacao, idDoControlador) {
  const malhaAberta = montarMalhaAberta(nG, dG, nH, dH);
  const desempenho = especificacao ? interpretarEspecificacao(especificacao) : null;
  const controlador = idDoControlador ? obterControlador(idDoControlador) : null;
  const esboco = { malhaAberta, desempenho, controlador, zero: null };

  if (controlador && desempenho) {
    const angulo = criterioDeAngulo(desempenho.polo, malhaAberta, controlador);
    if (angulo.viavel) {
      esboco.zero = localizarZero(desempenho.polo, angulo);
    }
  }
  return esboco;
}

export function projetarControlador(entrada) {
  const controlador = obterControlador(entrada.controlador);
  validarProprio(entrada, controlador);

  const { nG, dG, nH, dH } = entrada;
  const desempenho = interpretarEspecificacao(entrada.especificacao);
  const malhaAberta = montarMalhaAberta(nG, dG, nH, dH);
  const angulo = criterioDeAngulo(desempenho.polo, malhaAberta, controlador);
  const base = { entrada, controlador, desempenho, malhaAberta, angulo, viavel: angulo.viavel };

  if (!angulo.viavel) {
    return base;
  }

  const zero = localizarZero(desempenho.polo, angulo);
  const modulo = criterioDeModulo(desempenho.polo, malhaAberta, controlador, zero);
  const ganhos = controlador.ganhos(modulo.kc, zero.valor);
  const malhaFechada = analisarMalhaFechada(entrada, controlador, zero, modulo.kc, desempenho.polo);

  const projeto = {
    ...base,
    zero,
    modulo,
    ganhos,
    malhaFechada,
    resposta: malhaFechada.estavel ? responder(malhaFechada, desempenho) : null,
  };
  projeto.varredura = varrer(projeto);
  return projeto;
}
