import { formula, paragrafo, separador, aviso, quadroDeGrafico } from '../componentes.js';
import { fixoLatex, numeroLatex } from '../../formatacao/numero.js';
import { criarGraficoTemporal } from '../../grafico/fabrica.js';
import {
  CORES,
  desenharResposta,
  desenharNivel,
  desenharFaixa,
  desenharInstante,
} from '../../grafico/camadas.js';

export const titulo = '**Passo 9:** Resposta ao degrau unitário (verificação)';
export const requerViabilidade = true;

const FOLGA_DE_COMPARACAO = 1e-3;

function tempoLatex(valor) {
  if (valor === null) {
    return '\\text{sem pico}';
  }
  if (!Number.isFinite(valor)) {
    return '\\text{não acomoda}';
  }
  return `${fixoLatex(valor, 3)}\\,\\text{s}`;
}

function montarTabela(referencia, metricas) {
  const linhas = [
    ['M_P', `${fixoLatex(referencia.sobressinal, 2)}\\%`, `${fixoLatex(metricas.sobressinal, 2)}\\%`],
    ['t_p', tempoLatex(referencia.tempoDePico), tempoLatex(metricas.tempoDePico)],
    ['t_s(2\\%)', tempoLatex(referencia.acomodacao2), tempoLatex(metricas.acomodacao2)],
    ['t_s(5\\%)', tempoLatex(referencia.acomodacao5), tempoLatex(metricas.acomodacao5)],
    ['y(\\infty)', '\\text{---}', fixoLatex(metricas.valorFinal, 4)],
  ];
  return [
    '\\begin{array}{l|c|c}',
    '\\text{Grandeza} & \\text{2ª ordem ideal} & \\text{Simulado} \\\\ \\hline',
    linhas.map((linha) => linha.join(' & ')).join(' \\\\ '),
    '\\end{array}',
  ].join(' ');
}

function dentroDoLimite(medido, limite) {
  return medido !== null && Number.isFinite(medido) && medido <= limite * (1 + FOLGA_DE_COMPARACAO);
}

function verificacoes(desempenho, metricas) {
  const lista = [];
  if (desempenho.sobressinal !== undefined) {
    const ok = dentroDoLimite(metricas.sobressinal, desempenho.sobressinal);
    lista.push({
      ok,
      texto: `$M_P = ${fixoLatex(metricas.sobressinal, 2)}\\%$ ${ok ? 'atende' : 'não atende'} a $M_P \\le ${numeroLatex(desempenho.sobressinal)}\\%$.`,
    });
  }
  if (desempenho.acomodacao !== undefined) {
    const medido = desempenho.criterio === 2 ? metricas.acomodacao2 : metricas.acomodacao5;
    const ok = dentroDoLimite(medido, desempenho.acomodacao);
    lista.push({
      ok,
      texto: `$t_s(${desempenho.criterio}\\%) = ${tempoLatex(medido)}$ ${ok ? 'atende' : 'não atende'} a $t_s < ${numeroLatex(desempenho.acomodacao)}\\,\\text{s}$.`,
    });
  }
  if (desempenho.tempoDePico !== undefined) {
    const ok = dentroDoLimite(metricas.tempoDePico, desempenho.tempoDePico);
    lista.push({
      ok,
      texto: `$t_p = ${tempoLatex(metricas.tempoDePico)}$ ${ok ? 'atende' : 'não atende'} a $t_p \\le ${numeroLatex(desempenho.tempoDePico)}\\,\\text{s}$.`,
    });
  }
  return lista;
}

function compararComEspecificacao(destino, desempenho, metricas) {
  const lista = verificacoes(desempenho, metricas);
  for (const item of lista) {
    aviso(destino, item.ok ? 'sucesso' : 'atencao', item.texto);
  }
  if (lista.some((item) => !item.ok)) {
    paragrafo(
      destino,
      'A diferença vem dos polos e zeros que a aproximação de segunda ordem ignora (passo 8). '
      + 'Para ganhar folga, refaça o projeto com especificações um pouco mais rígidas.',
    );
  }
}

function desenhar(destino, projeto, metricas) {
  const { simulacao } = projeto.resposta;
  const { desempenho } = projeto;
  const saidas = Array.from(simulacao.saidas);
  const grafico = criarGraficoTemporal(
    simulacao.duracao,
    Math.min(...saidas),
    Math.max(...saidas, metricas.valorFinal * (1 + desempenho.referencia.sobressinal / 100)),
    'Resposta ao degrau unitário',
  );

  const criterio = desempenho.criterio || 2;
  desenharFaixa(grafico, metricas.valorFinal, criterio / 100);
  desenharNivel(grafico, metricas.valorFinal, CORES.valorFinal, 'Valor final');
  if (desempenho.sobressinal !== undefined) {
    desenharNivel(
      grafico,
      metricas.valorFinal * (1 + desempenho.sobressinal / 100),
      CORES.limite,
      'Limite de sobressinal',
      '3 3',
    );
  }
  if (desempenho.acomodacao !== undefined) {
    desenharInstante(grafico, desempenho.acomodacao, CORES.limite, 'Limite de acomodação');
  }
  if (desempenho.tempoDePico !== undefined) {
    desenharInstante(grafico, desempenho.tempoDePico, CORES.desejado, 'Tempo de pico pedido');
  }
  desenharResposta(grafico, simulacao);
  quadroDeGrafico(destino, grafico.elemento());
}

export function renderizar(destino, projeto) {
  const { resposta, malhaFechada, desempenho } = projeto;

  if (!malhaFechada.estavel || resposta === null) {
    aviso(destino, 'erro', 'A malha fechada é instável, então não há resposta ao degrau para medir.');
    return;
  }

  const { metricas, simulacao } = resposta;
  if (metricas === null) {
    aviso(destino, 'atencao', 'O valor final de $y(t)$ é nulo, então sobressinal e acomodação não se aplicam.');
    return;
  }

  paragrafo(
    destino,
    'Simulação exata de $T(s)$ em espaço de estados, com $x_{k+1} = e^{A\\,\\Delta t}x_k + \\Gamma$ para entrada em degrau.',
  );
  formula(destino, `y(\\infty) = T(0) = ${fixoLatex(metricas.valorFinal, 4)}`);
  if (Math.abs(simulacao.saidas[0]) > 1e-9 * Math.max(1, Math.abs(metricas.valorFinal))) {
    aviso(
      destino,
      'informacao',
      `$G_c(s)G(s)$ tem tantos zeros quanto polos, então a saída salta para $y(0^+) = ${fixoLatex(simulacao.saidas[0], 4)}$ no instante do degrau.`,
    );
  }

  separador(destino);
  formula(destino, montarTabela(desempenho.referencia, metricas));

  compararComEspecificacao(destino, desempenho, metricas);

  separador(destino);
  desenhar(destino, projeto, metricas);
}
