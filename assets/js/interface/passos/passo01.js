import { formula, paragrafo, separador, aviso } from '../componentes.js';
import { fixoLatex, numeroLatex } from '../../formatacao/numero.js';

export const titulo = '**Passo 1:** Especificações, $\\zeta$ e $\\omega_n$';
export const abertoPorPadrao = true;

function blocoDoSobressinal(destino, desempenho) {
  const { sobressinal, zeta } = desempenho;
  const logaritmo = Math.log(sobressinal / 100);

  paragrafo(destino, `**Sobressinal máximo:** $M_P \\le ${numeroLatex(sobressinal)}\\%$`);
  formula(
    destino,
    '\\zeta = \\sqrt{\\dfrac{\\left(\\ln \\frac{M_P}{100}\\right)^2}{\\pi^2 + \\left(\\ln \\frac{M_P}{100}\\right)^2}}',
  );
  formula(
    destino,
    `\\ln\\left(\\frac{${numeroLatex(sobressinal)}}{100}\\right) = ${fixoLatex(logaritmo, 4)} \\;\\Rightarrow\\; \\zeta = \\sqrt{\\dfrac{${fixoLatex(logaritmo ** 2, 4)}}{${fixoLatex(Math.PI ** 2, 4)} + ${fixoLatex(logaritmo ** 2, 4)}}} = ${fixoLatex(zeta, 4)}`,
  );
}

function blocoDaAcomodacao(destino, desempenho) {
  const { acomodacao, criterio, constante, sigma } = desempenho;
  paragrafo(destino, `**Tempo de acomodação (${criterio}%):** $t_s < ${numeroLatex(acomodacao)}\\,\\text{s}$`);
  formula(
    destino,
    `t_s(${criterio}\\%) = \\frac{${constante}}{\\zeta\\,\\omega_n} \\;\\Rightarrow\\; \\zeta\\,\\omega_n = \\frac{${constante}}{t_s} = \\frac{${constante}}{${numeroLatex(acomodacao)}} = ${fixoLatex(sigma, 4)}`,
  );
}

function blocoDoPico(destino, desempenho) {
  const { tempoDePico, omegaD } = desempenho;
  paragrafo(destino, `**Tempo de pico:** $t_p = ${numeroLatex(tempoDePico)}\\,\\text{s}$`);
  formula(
    destino,
    `t_p = \\frac{\\pi}{\\omega_d} \\;\\Rightarrow\\; \\omega_d = \\frac{\\pi}{t_p} = \\frac{\\pi}{${numeroLatex(tempoDePico)}} = ${fixoLatex(omegaD, 4)}\\;\\text{rad/s}`,
  );
}

function avisarFronteira(destino) {
  aviso(
    destino,
    'informacao',
    'Os limites viram igualdade: o projeto usa os valores que atendem às especificações no limite, '
    + 'o que deixa os polos desejados sobre a fronteira da região permitida.',
  );
}

function renderizarDesempenho(destino, desempenho) {
  const { zeta, sigma, omegaN } = desempenho;
  blocoDoSobressinal(destino, desempenho);
  separador(destino);
  blocoDaAcomodacao(destino, desempenho);
  formula(
    destino,
    `\\omega_n = \\frac{\\zeta\\,\\omega_n}{\\zeta} = \\frac{${fixoLatex(sigma, 4)}}{${fixoLatex(zeta, 4)}} = ${fixoLatex(omegaN, 4)}\\;\\text{rad/s}`,
  );
  avisarFronteira(destino);
}

function renderizarPico(destino, desempenho) {
  const { zeta, omegaD, omegaN, sigma } = desempenho;
  blocoDoSobressinal(destino, desempenho);
  separador(destino);
  blocoDoPico(destino, desempenho);
  formula(
    destino,
    `\\omega_n = \\frac{\\omega_d}{\\sqrt{1 - \\zeta^2}} = \\frac{${fixoLatex(omegaD, 4)}}{\\sqrt{1 - ${fixoLatex(zeta, 4)}^2}} = ${fixoLatex(omegaN, 4)}\\;\\text{rad/s}`,
  );
  formula(destino, `\\zeta\\,\\omega_n = ${fixoLatex(zeta, 4)} \\cdot ${fixoLatex(omegaN, 4)} = ${fixoLatex(sigma, 4)}`);
  avisarFronteira(destino);
}

function renderizarAmortecimentoEAcomodacao(destino, desempenho) {
  const { zeta, sigma, omegaN } = desempenho;
  paragrafo(destino, `**Amortecimento dado:** $\\zeta = ${numeroLatex(zeta)}$`);
  separador(destino);
  blocoDaAcomodacao(destino, desempenho);
  formula(
    destino,
    `\\omega_n = \\frac{\\zeta\\,\\omega_n}{\\zeta} = \\frac{${fixoLatex(sigma, 4)}}{${numeroLatex(zeta)}} = ${fixoLatex(omegaN, 4)}\\;\\text{rad/s}`,
  );
  avisarFronteira(destino);
}

function renderizarAcomodacaoEPico(destino, desempenho) {
  const { sigma, omegaD, omegaN, zeta } = desempenho;
  blocoDaAcomodacao(destino, desempenho);
  separador(destino);
  blocoDoPico(destino, desempenho);
  separador(destino);
  paragrafo(destino, 'Com a parte real e a parte imaginária dos polos definidas:');
  formula(
    destino,
    `\\omega_n = \\sqrt{(\\zeta\\omega_n)^2 + \\omega_d^2} = \\sqrt{${fixoLatex(sigma, 4)}^2 + ${fixoLatex(omegaD, 4)}^2} = ${fixoLatex(omegaN, 4)}\\;\\text{rad/s}`,
  );
  formula(
    destino,
    `\\zeta = \\frac{\\zeta\\omega_n}{\\omega_n} = \\frac{${fixoLatex(sigma, 4)}}{${fixoLatex(omegaN, 4)}} = ${fixoLatex(zeta, 4)}`,
  );
  avisarFronteira(destino);
}

function renderizarAmortecimento(destino, desempenho) {
  const { zeta, omegaN, sigma } = desempenho;
  paragrafo(destino, '**Especificação dada diretamente:**');
  formula(destino, `\\zeta = ${numeroLatex(zeta)}, \\qquad \\omega_n = ${numeroLatex(omegaN)}\\;\\text{rad/s}`);
  formula(
    destino,
    `\\zeta\\,\\omega_n = ${numeroLatex(zeta)} \\cdot ${numeroLatex(omegaN)} = ${fixoLatex(sigma, 4)}`,
  );
}

function renderizarPolos(destino, desempenho) {
  const { real, imaginario, zeta, omegaN } = desempenho;
  paragrafo(destino, '**Polos de malha fechada dados:**');
  formula(destino, `s_d = ${numeroLatex(real)} \\pm ${numeroLatex(Math.abs(imaginario))}\\,j`);
  formula(
    destino,
    `\\omega_n = |s_d| = \\sqrt{(${numeroLatex(real)})^2 + (${numeroLatex(Math.abs(imaginario))})^2} = ${fixoLatex(omegaN, 4)}\\;\\text{rad/s}`,
  );
  formula(
    destino,
    `\\zeta = \\frac{-\\operatorname{Re}(s_d)}{\\omega_n} = \\frac{${numeroLatex(-real)}}{${fixoLatex(omegaN, 4)}} = ${fixoLatex(zeta, 4)}`,
  );
}

const RENDERIZADORES = {
  desempenho: renderizarDesempenho,
  amortecimento: renderizarAmortecimento,
  polos: renderizarPolos,
  pico: renderizarPico,
  amortecimentoAcomodacao: renderizarAmortecimentoEAcomodacao,
  acomodacaoPico: renderizarAcomodacaoEPico,
};

export function renderizar(destino, projeto) {
  const { desempenho } = projeto;
  RENDERIZADORES[desempenho.modo](destino, desempenho);

  separador(destino);
  paragrafo(destino, '**Frequência natural amortecida:**');
  formula(
    destino,
    `\\omega_d = \\omega_n\\sqrt{1 - \\zeta^2} = ${fixoLatex(desempenho.omegaN, 4)}\\sqrt{1 - ${fixoLatex(desempenho.zeta, 4)}^2} = ${fixoLatex(desempenho.omegaD, 4)}\\;\\text{rad/s}`,
  );
}
