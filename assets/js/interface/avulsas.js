import { interpretarPolinomio, interpretarNumero } from '../nucleo/entrada.js';
import * as P from '../nucleo/polinomio.js';
import { discretizar } from '../projeto/discretizacao.js';
import { primeiroMetodo, segundoMetodo, pontoCritico } from '../projeto/zieglerNichols.js';
import { razaoLatex } from '../formatacao/latex.js';
import { fixoLatex, numeroLatex } from '../formatacao/numero.js';
import { aviso, elemento, formula, limparNo, paragrafo, secao, separador } from './componentes.js';
import { montarBarraDeResultado } from './ferramentas.js';
import { lerCoeficientes } from './formulario.js';
import { renderizarDiscretizacao } from './passos/passo10.js';
import { esconderRoteiro } from './apresentacao.js';

const NOMES = {
  discretizar: 'Discretização de G(s)',
  zn1: 'Ziegler-Nichols, 1º método',
  zn2: 'Ziegler-Nichols, 2º método',
};

function valor(id) {
  return document.getElementById(id).value;
}

function numero(id) {
  return interpretarNumero(valor(id), NaN);
}

function cabecalho(destino, texto) {
  const bloco = elemento('section', 'enunciado');
  bloco.appendChild(elemento('p', 'enunciado-etiqueta', 'Ferramenta avulsa'));
  paragrafo(bloco, texto);
  destino.appendChild(bloco);
}

function calcularDiscretizacao(destino) {
  const numerador = interpretarPolinomio(valor('ferramenta-numerador'));
  const denominador = interpretarPolinomio(valor('ferramenta-denominador'));
  const periodo = numero('ferramenta-periodo');
  if (!numerador || !denominador || denominador.every((v) => v === 0)) {
    throw new Error('confira o numerador e o denominador de $G(s)$.');
  }
  if (!(periodo > 0)) {
    throw new Error('o período de amostragem $T$ precisa ser positivo.');
  }
  const resultado = { alvo: 'planta', ...discretizar(numerador, denominador, valor('ferramenta-metodo'), periodo) };
  cabecalho(destino, `**Discretizar** $G(s) = ${razaoLatex(numerador, denominador)}$ com $T = ${numeroLatex(periodo)}\\,\\text{s}$.`);
  renderizarDiscretizacao(secao(destino, `**Discretização:** ${resultado.metodo.nome}`, true), resultado);
}

function tempoLatex(valorDoTempo) {
  return Number.isFinite(valorDoTempo) ? numeroLatex(valorDoTempo) : '\\infty';
}

function renderizarTabela(destino, linhas) {
  const corpo = linhas.map((linha) => [
    `\\text{${linha.tipo}}`,
    numeroLatex(linha.kp),
    tempoLatex(linha.ti),
    numeroLatex(linha.td),
    numeroLatex(linha.ki),
    numeroLatex(linha.kd),
  ].join(' & ')).join(' \\\\ ');
  formula(
    destino,
    `\\begin{array}{l|c|c|c|c|c} \\text{Controlador} & K_P & \\tau_i & \\tau_d & K_i = K_P/\\tau_i & K_d = K_P\\,\\tau_d \\\\ \\hline ${corpo} \\end{array}`,
  );
  const pid = linhas[2];
  separador(destino);
  paragrafo(destino, '**PID sintonizado:**');
  formula(
    destino,
    `G_c(s) = K_P\\left(1 + \\frac{1}{\\tau_i s} + \\tau_d s\\right) = ${numeroLatex(pid.kp)} + \\frac{${numeroLatex(pid.ki)}}{s} + ${numeroLatex(pid.kd)}\\,s`,
  );
  formula(destino, `G_c(s) = ${razaoLatex([pid.kd, pid.kp, pid.ki], [1, 0])}`);
  aviso(
    destino,
    'informacao',
    'Ziegler-Nichols dá só a sintonia inicial, pensada para cerca de $25\\%$ de sobressinal. Ajuste fino costuma ser necessário.',
  );
}

function calcularPrimeiroMetodo(destino) {
  const atraso = numero('ferramenta-l');
  const constante = numero('ferramenta-t');
  if (!(atraso > 0 && constante > 0)) {
    throw new Error('informe o atraso $L$ e a constante de tempo $T$, ambos positivos.');
  }
  cabecalho(destino, `**Primeiro método de Ziegler-Nichols** com $L = ${numeroLatex(atraso)}\\,\\text{s}$ e $T = ${numeroLatex(constante)}\\,\\text{s}$, tirados da curva em S.`);
  const corpo = secao(destino, '**Tabela do 1º método**', true);
  formula(
    corpo,
    '\\begin{array}{l|c|c|c} \\text{Controlador} & K_P & \\tau_i & \\tau_d \\\\ \\hline \\text{P} & T/L & \\infty & 0 \\\\ \\text{PI} & 0{,}9\\,T/L & L/0{,}3 & 0 \\\\ \\text{PID} & 1{,}2\\,T/L & 2L & 0{,}5L \\end{array}',
  );
  formula(corpo, `\\frac{T}{L} = \\frac{${numeroLatex(constante)}}{${numeroLatex(atraso)}} = ${numeroLatex(constante / atraso)}`);
  separador(corpo);
  renderizarTabela(corpo, primeiroMetodo(atraso, constante));
}

function obterPontoCritico(destino) {
  const ganho = numero('ferramenta-kcr');
  const periodo = numero('ferramenta-pcr');
  if (ganho > 0 && periodo > 0) {
    return { ganhoCritico: ganho, periodoCritico: periodo, origem: 'dado' };
  }
  const [nG, dG, nH, dH] = lerCoeficientes();
  if ([nG, dG, nH, dH].some((item) => item === null)) {
    throw new Error('informe $K_{cr}$ e $P_{cr}$, ou preencha $G(s)$ e $H(s)$ no formulário acima.');
  }
  const numerador = P.multiplicar(nG, nH);
  const denominador = P.multiplicar(dG, dH);
  const critico = pontoCritico(numerador, denominador);
  if (!critico) {
    throw new Error('o LGR de $G(s)H(s)$ não cruza o eixo $j\\omega$, então não há ganho crítico e o 2º método não se aplica.');
  }
  const corpo = secao(destino, '**Ganho e período críticos pelo modelo**', true);
  formula(corpo, `G(s)H(s) = ${razaoLatex(numerador, denominador)}`);
  paragrafo(corpo, 'O LGR cruza o eixo $j\\omega$ onde a fase de $G(j\\omega)H(j\\omega)$ vale $-180^\\circ$:');
  formula(corpo, `\\angle G(j\\omega_{cr})H(j\\omega_{cr}) = -180^\\circ \\;\\Rightarrow\\; \\omega_{cr} = ${fixoLatex(critico.omega, 4)}\\;\\text{rad/s}`);
  formula(corpo, `K_{cr} = \\frac{1}{|G(j\\omega_{cr})H(j\\omega_{cr})|} = ${numeroLatex(critico.ganhoCritico)}, \\qquad P_{cr} = \\frac{2\\pi}{\\omega_{cr}} = ${numeroLatex(critico.periodoCritico)}\\;\\text{s}`);
  return { ...critico, origem: 'modelo' };
}

function calcularSegundoMetodo(destino) {
  const ganho = numero('ferramenta-kcr');
  const periodo = numero('ferramenta-pcr');
  const dados = ganho > 0 && periodo > 0;
  cabecalho(
    destino,
    dados
      ? `**Segundo método de Ziegler-Nichols** com $K_{cr} = ${numeroLatex(ganho)}$ e $P_{cr} = ${numeroLatex(periodo)}\\,\\text{s}$.`
      : '**Segundo método de Ziegler-Nichols**, com $K_{cr}$ e $P_{cr}$ tirados de $G(s)H(s)$.',
  );
  const critico = obterPontoCritico(destino);
  const corpo = secao(destino, '**Tabela do 2º método**', true);
  formula(
    corpo,
    '\\begin{array}{l|c|c|c} \\text{Controlador} & K_P & \\tau_i & \\tau_d \\\\ \\hline \\text{P} & 0{,}5\\,K_{cr} & \\infty & 0 \\\\ \\text{PI} & 0{,}45\\,K_{cr} & P_{cr}/1{,}2 & 0 \\\\ \\text{PID} & 0{,}6\\,K_{cr} & 0{,}5\\,P_{cr} & 0{,}125\\,P_{cr} \\end{array}',
  );
  separador(corpo);
  renderizarTabela(corpo, segundoMetodo(critico.ganhoCritico, critico.periodoCritico));
}

const CALCULOS = {
  discretizar: calcularDiscretizacao,
  zn1: calcularPrimeiroMetodo,
  zn2: calcularSegundoMetodo,
};

function atualizarFerramenta() {
  const escolhida = valor('ferramenta');
  document.querySelectorAll('[data-ferramenta]').forEach((painel) => {
    painel.hidden = painel.dataset.ferramenta !== escolhida;
  });
}

export function calcularFerramenta(destino, escolhida = valor('ferramenta')) {
  limparNo(destino);
  montarBarraDeResultado(destino, NOMES[escolhida]);
  try {
    CALCULOS[escolhida](destino);
  } catch (falha) {
    aviso(destino, 'erro', `Não foi possível calcular: ${falha.message}`);
  }
}

export function montarFerramentas() {
  const seletor = document.getElementById('ferramenta');
  const botao = document.getElementById('calcular-ferramenta');
  if (!seletor || !botao) {
    return;
  }
  seletor.addEventListener('change', atualizarFerramenta);
  botao.addEventListener('click', () => {
    const destino = document.getElementById('resultado');
    esconderRoteiro();
    calcularFerramenta(destino);
    destino.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  atualizarFerramenta();
}
