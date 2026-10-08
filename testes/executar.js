import assert from 'node:assert/strict';

import * as M from '../assets/js/nucleo/matriz.js';
import {
  amortecimentoDoSobressinal,
  sobressinalDoAmortecimento,
  interpretarEspecificacao,
} from '../assets/js/projeto/especificacoes.js';
import { obterControlador, numeradorDoControlador } from '../assets/js/projeto/controladores.js';
import { montarMalhaAberta } from '../assets/js/projeto/malhaAberta.js';
import { criterioDeAngulo } from '../assets/js/projeto/criterios.js';
import { simularDegrau, medirResposta } from '../assets/js/projeto/respostaDegrau.js';
import { projetarControlador } from '../assets/js/projeto/projeto.js';
import { extrairRamo } from '../assets/js/projeto/lugarRaizes.js';
import { ganhosDeDescolamento } from '../assets/js/projeto/descolamento.js';
import { discretizar } from '../assets/js/projeto/discretizacao.js';
import { interpretarPolinomio } from '../assets/js/nucleo/entrada.js';
import { constantesDeErro } from '../assets/js/projeto/erroEstatico.js';
import { projetarAtraso, ganhoNaRetaDeAmortecimento } from '../assets/js/projeto/atraso.js';
import { primeiroMetodo, segundoMetodo, pontoCritico } from '../assets/js/projeto/zieglerNichols.js';
import * as P from '../assets/js/nucleo/polinomio.js';
import * as C from '../assets/js/nucleo/complexo.js';

let executados = 0;
let falhas = 0;

function teste(nome, corpo) {
  executados += 1;
  try {
    corpo();
    console.log(`ok   ${nome}`);
  } catch (erro) {
    falhas += 1;
    console.log(`FALHA ${nome}`);
    console.log(`      ${erro.message}`);
  }
}

function perto(recebido, esperado, tolerancia = 1e-6) {
  assert.ok(
    Math.abs(recebido - esperado) < tolerancia,
    `esperado ${esperado}, recebido ${recebido}`,
  );
}

const QUESTOES = {
  primeira: {
    nG: [4, 16], dG: [1, 4, 4, 0], nH: [1], dH: [1],
    controlador: 'pd',
    especificacao: { modo: 'desempenho', sobressinal: 10, acomodacao: 4, criterio: 5 },
  },
  segunda: {
    nG: [1], dG: [10000, 0, -11772], nH: [1], dH: [1],
    controlador: 'pd',
    especificacao: { modo: 'amortecimento', zeta: 0.7, omegaN: 0.5 },
  },
  terceira: {
    nG: [5, 25, 20], dG: [1, 4, 4], nH: [0.2], dH: [1, 1],
    controlador: 'pi',
    especificacao: { modo: 'polos', real: -4, imaginario: 4 },
  },
  quarta: {
    nG: [5], dG: [1, 12, 22, 20], nH: [0.4], dH: [1],
    controlador: 'pid',
    especificacao: { modo: 'desempenho', sobressinal: 20, acomodacao: 5, criterio: 2 },
  },
};

function polosDesejadosEmMalhaFechada(projeto) {
  const desejados = projeto.malhaFechada.polos.filter((item) => item.classe === 'desejado');
  assert.equal(desejados.length, 2, 'o par desejado precisa aparecer na malha fechada');
  for (const item of desejados) {
    perto(item.ponto.re, projeto.desempenho.polo.re, 1e-6);
    perto(Math.abs(item.ponto.im), projeto.desempenho.polo.im, 1e-6);
  }
}

teste('exponencial de matriz diagonal', () => {
  const resultado = M.exponencial([[-2, 0], [0, 3]]);
  perto(resultado[0][0], Math.exp(-2), 1e-12);
  perto(resultado[1][1], Math.exp(3), 1e-10);
  perto(resultado[0][1], 0, 1e-14);
});

teste('exponencial de matriz de rotacao', () => {
  const resultado = M.exponencial([[0, -Math.PI / 2], [Math.PI / 2, 0]]);
  perto(resultado[0][0], 0, 1e-12);
  perto(resultado[1][0], 1, 1e-12);
});

teste('sobressinal e amortecimento sao inversos', () => {
  const zeta = amortecimentoDoSobressinal(10);
  perto(zeta, 0.591155, 1e-6);
  perto(sobressinalDoAmortecimento(zeta), 10, 1e-9);
});

teste('especificacao por desempenho com criterio de 5%', () => {
  const desempenho = interpretarEspecificacao(QUESTOES.primeira.especificacao);
  perto(desempenho.sigma, 0.75, 1e-12);
  perto(desempenho.omegaN, 0.75 / 0.591155, 1e-5);
});

teste('especificacao por polos recupera zeta e omega n', () => {
  const desempenho = interpretarEspecificacao({ modo: 'polos', real: -4, imaginario: 4 });
  perto(desempenho.zeta, Math.SQRT1_2, 1e-12);
  perto(desempenho.omegaN, 4 * Math.SQRT2, 1e-12);
});

teste('numerador do PID tem zero duplo', () => {
  assert.deepEqual(numeradorDoControlador(obterControlador('pid'), 3), [1, 6, 9]);
});

teste('deficiencia angular sai entre 0 e 360 graus', () => {
  const malhaAberta = montarMalhaAberta([1], [1, 2, 0], [1], [1]);
  const angulo = criterioDeAngulo({ re: -2, im: 2 }, malhaAberta, obterControlador('pd'));
  perto(angulo.fase, -225, 1e-9);
  perto(angulo.deficiencia, 45, 1e-9);
  assert.equal(angulo.viavel, true);
});

teste('PD sem deficiencia angular e recusado', () => {
  const malhaAberta = montarMalhaAberta([1], [1, 2, 0], [1], [1]);
  const angulo = criterioDeAngulo({ re: -1, im: 2 }, malhaAberta, obterControlador('pd'));
  assert.equal(angulo.viavel, false);
  assert.equal(angulo.motivo, 'semDeficiencia');
});

teste('PD sobre planta bipropria e recusado', () => {
  assert.throws(
    () => projetarControlador({ ...QUESTOES.terceira, controlador: 'pd', dH: [1], nH: [1] }),
    /imprópria/,
  );
});

teste('ganho de descolamento entre dois polos reais', () => {
  const ganhos = ganhosDeDescolamento([1], [1, 2, 0]);
  assert.equal(ganhos.length, 1);
  perto(ganhos[0], 1, 1e-12);
});

teste('degrau de primeira ordem bate com a solucao exata', () => {
  const simulacao = simularDegrau([2], [1, 2], 3);
  for (let k = 0; k < simulacao.tempos.length; k += 160) {
    perto(simulacao.saidas[k], 1 - Math.exp(-2 * simulacao.tempos[k]), 1e-10);
  }
});

teste('metricas de segunda ordem padrao', () => {
  const zeta = 0.5;
  const omegaN = 2;
  const simulacao = simularDegrau([omegaN ** 2], [1, 2 * zeta * omegaN, omegaN ** 2], 12);
  const metricas = medirResposta(simulacao, 1);
  perto(metricas.sobressinal, sobressinalDoAmortecimento(zeta), 1e-3);
  perto(metricas.tempoDePico, Math.PI / (omegaN * Math.sqrt(1 - zeta ** 2)), 1e-2);
});

teste('questao 1: PD com zero em -8.66', () => {
  const projeto = projetarControlador(QUESTOES.primeira);
  perto(projeto.angulo.deficiencia, 7.371, 1e-3);
  perto(projeto.zero.valor, 8.6598, 1e-3);
  perto(projeto.modulo.kc, 0.030458, 1e-5);
  perto(projeto.ganhos.kp, projeto.modulo.kc * projeto.zero.valor, 1e-12);
  polosDesejadosEmMalhaFechada(projeto);
});

teste('questao 2: PD da planta instavel', () => {
  const projeto = projetarControlador(QUESTOES.segunda);
  perto(projeto.modulo.kc, 7000, 1e-6);
  perto(projeto.zero.valor, 2.0389, 1e-4);
  perto(projeto.ganhos.kd, 7000, 1e-6);
  perto(projeto.ganhos.kp, 14272, 1e-4);
  polosDesejadosEmMalhaFechada(projeto);
});

teste('questao 3: PI com cancelamento em -1', () => {
  const projeto = projetarControlador(QUESTOES.terceira);
  assert.equal(projeto.malhaAberta.cancelamentos.length, 1);
  perto(projeto.ganhos.kp, 7, 1e-9);
  perto(projeto.ganhos.ki, 24, 1e-9);
  polosDesejadosEmMalhaFechada(projeto);
  perto(projeto.resposta.metricas.valorFinal, 5, 1e-9);
});

teste('questao 4: PID com zeros reais e iguais', () => {
  const projeto = projetarControlador(QUESTOES.quarta);
  perto(projeto.zero.valor, 2.049, 1e-3);
  perto(projeto.modulo.kc, 3.13596, 1e-4);
  perto(projeto.ganhos.ki, projeto.modulo.kc * projeto.zero.valor ** 2, 1e-12);
  polosDesejadosEmMalhaFechada(projeto);
  assert.ok(projeto.resposta.metricas.sobressinal <= 20);
  assert.ok(projeto.resposta.metricas.acomodacao2 < 5);
});

teste('a varredura passa pelos polos desejados em K = Kc', () => {
  const projeto = projetarControlador(QUESTOES.quarta);
  const { varredura, modulo, desempenho } = projeto;
  const indice = varredura.ganhos.findIndex((ganho) => Math.abs(ganho - modulo.kc) < 1e-9 * modulo.kc);
  assert.ok(indice >= 0, 'Kc precisa virar amostra da varredura');

  const pontos = [];
  for (let j = 0; j < varredura.ramos; j += 1) {
    pontos.push(extrairRamo(varredura, j)[indice]);
  }
  const folga = pontos.reduce(
    (menor, s) => Math.min(menor, Math.hypot(s.re - desempenho.polo.re, s.im - desempenho.polo.im)),
    Infinity,
  );
  assert.ok(folga < 1e-6, `ramo passou a ${folga} de s_d`);
});

teste('Euler para frente em 1/(s+1) com T = 0.5', () => {
  const d = discretizar([1], [1, 1], 'euler', 0.5);
  perto(d.numeradorZ[0], 0.5, 1e-12);
  perto(d.denominadorZ[0], 1, 1e-12);
  perto(d.denominadorZ[1], -0.5, 1e-12);
});

teste('discretizacao bate com a substituicao de s em z', () => {
  const numerador = [0.539, 1.436, 0.957];
  const denominador = [1, 0];
  const z = C.complexo(0.3, 0.7);
  const substituicoes = {
    euler: (T) => C.dividir(C.subtrair(z, C.complexo(1)), C.complexo(T)),
    'euler-atraso': (T) => C.dividir(C.subtrair(z, C.complexo(1)), C.escalar(z, T)),
    tustin: (T) => C.escalar(C.dividir(C.subtrair(z, C.complexo(1)), C.somar(z, C.complexo(1))), 2 / T),
  };
  for (const [metodo, substituir] of Object.entries(substituicoes)) {
    const s = substituir(2);
    const esperado = C.dividir(P.avaliarComplexo(numerador, s), P.avaliarComplexo(denominador, s));
    const d = discretizar(numerador, denominador, metodo, 2);
    const obtido = C.dividir(P.avaliarComplexo(d.numeradorZ, z), P.avaliarComplexo(d.denominadorZ, z));
    perto(obtido.re, esperado.re, 1e-9);
    perto(obtido.im, esperado.im, 1e-9);
  }
});

teste('2o exercicio, questao 1: PID com Tustin', () => {
  const projeto = projetarControlador({
    nG: [5, 15], dG: [1, 4, 0], nH: [1], dH: [1, 1],
    controlador: 'pid',
    especificacao: { modo: 'desempenho', sobressinal: 10, acomodacao: 3, criterio: 5 },
    discretizacao: { metodo: 'tustin', periodo: 2, alvo: 'controlador' },
  });
  assert.equal(projeto.viavel, true);
  polosDesejadosEmMalhaFechada(projeto);
  perto(projeto.zero.valor, 1.3322, 1e-4);
  perto(projeto.modulo.kc, 0.5390, 1e-4);
  const { numeradorZ, denominadorZ } = projeto.discretizacao;
  assert.deepEqual(denominadorZ.map((v) => Number(v.toFixed(9))), [1, 0, -1]);
  perto(numeradorZ[0], 2.9319, 1e-4);
});

teste('2o exercicio, questao 2: a/(s+b) e Euler', () => {
  const projeto = projetarControlador({
    nG: [2, 2], dG: [1, 2, 2], nH: [1, 3], dH: [1, 5],
    controlador: 'polo',
    especificacao: { modo: 'polos', real: -2.5, imaginario: 2 },
    discretizacao: { metodo: 'euler', periodo: 1, alvo: 'malha' },
  });
  assert.equal(projeto.viavel, true);
  polosDesejadosEmMalhaFechada(projeto);
  perto(projeto.zero.valor, 2.80608, 1e-5);
  perto(projeto.modulo.kc, 3.79990, 1e-5);
  assert.deepEqual(projeto.ganhos, { a: projeto.modulo.kc, b: projeto.zero.valor });
  assert.equal(projeto.discretizacao.estavel, false);
  const modulos = projeto.discretizacao.polos.map((item) => item.modulo).sort((a, b) => a - b);
  perto(modulos[3], 4, 1e-9);
});

teste('a/(s+b) recusa quando falta fase', () => {
  const malhaAberta = montarMalhaAberta([1], [1, 2, 0], [1], [1]);
  const angulo = criterioDeAngulo({ re: -2, im: 2 }, malhaAberta, obterControlador('polo'));
  assert.equal(angulo.viavel, false);
  assert.equal(angulo.motivo, 'excesso');
});

teste('expressao fatorada vira coeficientes', () => {
  const casos = [
    ['5(s+3)', [5, 15]],
    ['s(s+4)', [1, 4, 0]],
    ['(s+2)^2', [1, 4, 4]],
    ['s^2 + 2s + 2', [1, 2, 2]],
    ['5(s+1)(s+4)', [5, 25, 20]],
    ['10000s^2 - 11772', [10000, 0, -11772]],
    ['-(s+1)', [-1, -1]],
    ['0,2', [0.2]],
    ['1 4 4 0', [1, 4, 4, 0]],
  ];
  for (const [texto, esperado] of casos) {
    assert.deepEqual(interpretarPolinomio(texto), esperado, texto);
  }
  for (const texto of ['(s+', 'abc', '', 's^-1']) {
    assert.equal(interpretarPolinomio(texto), null, texto);
  }
});

teste('especificacao por Mp e tempo de pico', () => {
  const d = interpretarEspecificacao({ modo: 'pico', sobressinal: 10, tempoDePico: 1 });
  perto(d.omegaD, Math.PI, 1e-12);
  perto(d.zeta, amortecimentoDoSobressinal(10), 1e-12);
});

teste('especificacao por zeta e ts', () => {
  const d = interpretarEspecificacao({ modo: 'amortecimentoAcomodacao', zeta: 0.6, acomodacao: 2, criterio: 2 });
  perto(d.sigma, 2, 1e-12);
  perto(d.omegaN, 2 / 0.6, 1e-12);
});

teste('especificacao por ts e tempo de pico', () => {
  const d = interpretarEspecificacao({ modo: 'acomodacaoPico', acomodacao: 2, criterio: 2, tempoDePico: 1 });
  perto(d.sigma, 2, 1e-12);
  perto(d.omegaD, Math.PI, 1e-12);
});

teste('compensador com zero dado acha o polo e K', () => {
  const projeto = projetarControlador({
    nG: [1], dG: [1, 2, 0], nH: [1], dH: [1],
    controlador: 'compensador-zero', fixo: 1,
    especificacao: { modo: 'polos', real: -2, imaginario: 2 },
  });
  polosDesejadosEmMalhaFechada(projeto);
  perto(projeto.zero.valor, 8 / 3, 1e-9);
  perto(projeto.modulo.kc, 16 / 3, 1e-9);
});

teste('compensador com polo dado acha o zero e K', () => {
  const projeto = projetarControlador({
    nG: [1], dG: [1, 2, 0], nH: [1], dH: [1],
    controlador: 'compensador-polo', fixo: 10,
    especificacao: { modo: 'polos', real: -2, imaginario: 2 },
  });
  polosDesejadosEmMalhaFechada(projeto);
  perto(projeto.zero.valor, 3.2, 1e-9);
  perto(projeto.modulo.kc, 20, 1e-9);
});

teste('compensador sem o valor dado e recusado', () => {
  assert.throws(
    () => projetarControlador({
      nG: [1], dG: [1, 2, 0], nH: [1], dH: [1],
      controlador: 'compensador-zero', fixo: null,
      especificacao: { modo: 'polos', real: -2, imaginario: 2 },
    }),
    /informe o zero dado/,
  );
});

teste('constantes de erro do exemplo do PI da apostila', () => {
  const erro = constantesDeErro([2], [1, 2, 0]);
  assert.equal(erro.tipo, 1);
  assert.equal(erro.kp, Infinity);
  perto(erro.kv, 1, 1e-12);
  assert.equal(erro.ka, 0);
  perto(erro.erroRampa, 1, 1e-12);
});

teste('atraso de fase do exemplo 4.6 da apostila', () => {
  const projeto = projetarAtraso({
    nG: [5], dG: [1, 2, 0], nH: [1], dH: [1],
    atraso: { zeta: null, constante: 20, zero: 0.1 },
  });
  perto(projeto.parte.atual, 2.5, 1e-12);
  perto(projeto.parte.beta, 8, 1e-12);
  perto(projeto.parte.polo, 0.0125, 1e-12);
  perto(projeto.constanteFinal, 20, 1e-9);
});

teste('ganho na reta de zeta do exercicio 2b da apostila', () => {
  const ajuste = ganhoNaRetaDeAmortecimento([820], [1, 30, 200, 0], 0.6);
  perto(ajuste.ganho, 1, 2e-3);
  perto(-ajuste.ponto.re / ajuste.omegaN, 0.6, 1e-9);
});

teste('atraso-avanco do exemplo 4.7 da apostila', () => {
  const projeto = projetarControlador({
    nG: [4], dG: [1, 0.5, 0], nH: [1], dH: [1],
    controlador: 'atraso-avanco', fixo: 0.5,
    especificacao: { modo: 'amortecimento', zeta: 0.5, omegaN: 5 },
    atraso: { constante: 80, zero: 0.2 },
  });
  perto(projeto.zero.valor, 5, 1e-6);
  perto(projeto.modulo.kc, 6.25, 1e-6);
  perto(projeto.atraso.beta, 16, 1e-6);
  perto(projeto.atraso.polo, 0.0125, 1e-9);
});

teste('invariancia ao degrau bate com as formas fechadas', () => {
  const T = 0.5;
  const a = 2;
  const e = Math.exp(-a * T);
  let d = discretizar([1], [1, a], 'degrau', T);
  perto(d.numeradorZ[0], (1 - e) / a, 1e-12);
  perto(d.denominadorZ[1], -e, 1e-12);
  d = discretizar([1], [1, 0, 0], 'degrau', T);
  assert.deepEqual(d.numeradorZ.map((v) => Number(v.toFixed(12))), [0.125, 0.125]);
  assert.deepEqual(d.denominadorZ.map((v) => Number(v.toFixed(12))), [1, -2, 1]);
  assert.throws(() => discretizar([1, 1], [1], 'degrau', T), /própria/);
});

teste('Ziegler-Nichols bate com os exemplos da apostila', () => {
  const primeiro = primeiroMetodo(0.19104, 2.0041)[2];
  perto(primeiro.kp, 12.5886, 1e-3);
  perto(primeiro.ti, 0.3821, 1e-4);
  perto(primeiro.td, 0.0955, 1e-4);
  const segundo = segundoMetodo(4, 6.3)[2];
  perto(segundo.kp, 2.4, 1e-12);
  perto(segundo.ti, 3.15, 1e-12);
  perto(segundo.td, 0.7875, 1e-12);
});

teste('ganho critico de 1/(s(s+1)(s+5))', () => {
  const critico = pontoCritico([1], [1, 6, 5, 0]);
  perto(critico.ganhoCritico, 30, 1e-6);
  perto(critico.omega, Math.sqrt(5), 1e-6);
  assert.equal(pontoCritico([1], [1, 1]), null);
});

console.log(`\n${executados - falhas}/${executados} testes passaram`);
if (falhas > 0) {
  process.exitCode = 1;
}
