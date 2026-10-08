import * as P from '../nucleo/polinomio.js';
import { interpretarEspecificacao } from './especificacoes.js';
import {
  obterControlador,
  numeradorDoControlador,
  denominadorDoControlador,
  excessoDeZeros,
  zerosFixosComoPontos,
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
import { discretizarProjeto } from './discretizacao.js';
import { parteEmAtraso, projetarAtraso } from './atraso.js';

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

function tentarDiscretizar(projeto, pedido) {
  try {
    return discretizarProjeto(projeto, pedido);
  } catch (falha) {
    return { alvo: pedido.alvo, erro: falha.message };
  }
}

function varrer(projeto) {
  const { zero, malhaAberta, modulo } = projeto;
  const controlador = projeto.controladorFinal;
  const numeradorBruto = P.multiplicar(numeradorDoControlador(controlador, zero.valor), malhaAberta.numerador);
  const denominadorBruto = P.multiplicar(
    denominadorDoControlador(controlador, zero.valor),
    malhaAberta.denominador,
  );
  const tamanho = Math.max(numeradorBruto.length, denominadorBruto.length);

  return calcularLugarRaizes(P.preencher(numeradorBruto, tamanho), P.preencher(denominadorBruto, tamanho), {
    zeros: [
      ...malhaAberta.zeros,
      ...new Array(controlador.zeros).fill(zero.ponto),
      ...zerosFixosComoPontos(controlador),
    ],
    ganhosNotaveis: [modulo.kc, ...ganhosDeDescolamento(numeradorBruto, denominadorBruto)],
    raioDeInteresse: raioDeInteresse(pontosNotaveis(projeto, { malhaFechada: true })),
  });
}

export function esbocarProjeto(nG, dG, nH, dH, especificacao, idDoControlador, fixo = null) {
  const malhaAberta = montarMalhaAberta(nG, dG, nH, dH);
  const desempenho = especificacao ? interpretarEspecificacao(especificacao) : null;
  const controlador = idDoControlador ? obterControlador(idDoControlador, fixo) : null;
  const esboco = { malhaAberta, desempenho, controlador, zero: null };

  if (controlador && desempenho && !controlador.pipeline) {
    const angulo = criterioDeAngulo(desempenho.polo, malhaAberta, controlador);
    if (angulo.viavel) {
      esboco.zero = localizarZero(desempenho.polo, angulo);
    }
  }
  return esboco;
}

export function projetarControlador(entrada) {
  const controlador = obterControlador(entrada.controlador, entrada.fixo);
  if (controlador.pipeline === 'atraso') {
    return projetarAtraso(entrada);
  }
  if (controlador.fixo && controlador.zerosFixos.length + controlador.polosFixos.length === 0) {
    throw new Error(`informe o ${controlador.fixo} dado do compensador.`);
  }
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

  let controladorFinal = controlador;
  let atraso = null;
  if (controlador.atraso) {
    const numeradorBase = P.escalar(
      P.multiplicar(numeradorDoControlador(controlador, zero.valor), malhaAberta.numerador),
      modulo.kc,
    );
    const denominadorBase = P.multiplicar(denominadorDoControlador(controlador, zero.valor), malhaAberta.denominador);
    atraso = parteEmAtraso(numeradorBase, denominadorBase, entrada.atraso.constante, entrada.atraso.zero, desempenho.polo);
    controladorFinal = {
      ...controlador,
      zerosFixos: [...controlador.zerosFixos, atraso.zero],
      polosFixos: [...controlador.polosFixos, atraso.polo],
    };
  }
  const malhaFechada = analisarMalhaFechada(entrada, controladorFinal, zero, modulo.kc, desempenho.polo);

  const projeto = {
    ...base,
    controladorFinal,
    atraso,
    zero,
    modulo,
    ganhos,
    malhaFechada,
    resposta: malhaFechada.estavel ? responder(malhaFechada, desempenho) : null,
    discretizacao: entrada.discretizacao ? tentarDiscretizar({ malhaFechada, entrada }, entrada.discretizacao) : null,
  };
  projeto.varredura = varrer(projeto);
  return projeto;
}
