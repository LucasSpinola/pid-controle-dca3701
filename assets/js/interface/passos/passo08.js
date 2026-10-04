import { formula, paragrafo, separador, aviso, quadroDeGrafico } from '../componentes.js';
import { polinomioLatex, razaoLatex, complexoLatex } from '../../formatacao/latex.js';
import { fixoLatex } from '../../formatacao/numero.js';
import { criarPlano } from '../../grafico/fabrica.js';
import {
  desenharPolosZeros,
  desenharPolosDesejados,
  desenharPolosDeMalhaFechada,
  desenharRetasDeAmortecimento,
} from '../../grafico/camadas.js';
import { RAZAO_DE_DOMINANCIA } from '../../projeto/malhaFechada.js';

export const titulo = '**Passo 8:** Malha fechada e dominância';
export const requerViabilidade = true;

function descreverPolo(item) {
  const razao = `${fixoLatex(item.razao, 2)}\\,\\sigma`;
  const descricoes = {
    desejado: '\\text{polo desejado}',
    cancelado: '\\text{cancelado por um zero de } T(s)',
    rapido: `\\text{rápido: } \\lvert \\operatorname{Re} \\rvert = ${razao}`,
    influente: `\\text{próximo: } \\lvert \\operatorname{Re} \\rvert = ${razao}`,
    instavel: '\\text{instável}',
  };
  return descricoes[item.classe];
}

function concluirDominancia(destino, malhaFechada) {
  if (!malhaFechada.estavel) {
    aviso(
      destino,
      'erro',
      'A malha fechada tem polo no semiplano direito ou sobre o eixo $j\\omega$: o sistema é **instável**.',
    );
    return;
  }
  if (malhaFechada.dominante) {
    aviso(
      destino,
      'sucesso',
      `Os demais polos estão pelo menos ${RAZAO_DE_DOMINANCIA} vezes mais à esquerda que $s_d$ ou foram `
      + 'cancelados por zeros: o par desejado domina a resposta.',
    );
    return;
  }
  aviso(
    destino,
    'atencao',
    `Há polo a menos de ${RAZAO_DE_DOMINANCIA} vezes a parte real de $s_d$. A aproximação de segunda ordem `
    + 'fica fraca, e a resposta real (passo 9) pode fugir das especificações.',
  );
}

export function renderizar(destino, projeto) {
  const { malhaFechada, desempenho, malhaAberta, controlador } = projeto;

  paragrafo(destino, '**Função de transferência de malha fechada:**');
  formula(
    destino,
    'T(s) = \\frac{G_c(s)G(s)}{1 + G_c(s)G(s)H(s)} = \\frac{N_c N_G D_H}{D_c D_G D_H + N_c N_G N_H}',
  );
  formula(destino, `T(s) = ${razaoLatex(malhaFechada.numerador, malhaFechada.caracteristica)}`);

  separador(destino);
  paragrafo(destino, '**Equação característica:**');
  formula(destino, `${polinomioLatex(malhaFechada.caracteristica)} = 0`);

  paragrafo(destino, `**Polos de malha fechada** (com $\\sigma = ${fixoLatex(desempenho.sigma, 4)}$):`);
  malhaFechada.polos.forEach((item, indice) => {
    formula(destino, `s_{${indice + 1}} = ${complexoLatex(item.ponto)} \\quad ${descreverPolo(item)}`);
  });

  if (malhaFechada.zeros.length > 0) {
    paragrafo(destino, '**Zeros de malha fechada:**');
    formula(
      destino,
      malhaFechada.zeros.map((z, indice) => `z_{${indice + 1}} = ${complexoLatex(z)}`).join(', \\quad '),
    );
  }

  concluirDominancia(destino, malhaFechada);

  separador(destino);
  const pontos = [
    ...malhaFechada.polos.map((item) => item.ponto),
    ...malhaFechada.zeros,
    desempenho.polo,
    { re: desempenho.polo.re, im: -desempenho.polo.im },
  ];
  const plano = criarPlano(pontos, `Malha fechada com o ${controlador.nome}`);
  desenharRetasDeAmortecimento(plano, desempenho.zeta);
  desenharPolosZeros(plano, [], malhaFechada.zeros, { legendaZeros: 'Zeros de T(s)' });
  desenharPolosDesejados(plano, desempenho.polo, { rotular: false });
  desenharPolosDeMalhaFechada(plano, malhaFechada.polos.map((item) => item.ponto));
  quadroDeGrafico(destino, plano.elemento());

  if (malhaAberta.cancelamentos.length > 0) {
    paragrafo(destino, 'Os cancelamentos da planta reaparecem aqui como polo e zero coincidentes de $T(s)$.');
  }
}
