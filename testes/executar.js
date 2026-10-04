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

console.log(`\n${executados - falhas}/${executados} testes passaram`);
if (falhas > 0) {
  process.exitCode = 1;
}
