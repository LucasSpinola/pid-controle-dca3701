import { formula, paragrafo, separador, aviso, quadroDeGrafico } from '../componentes.js';
import { complexoLatex, rotularContribuicoes } from '../../formatacao/latex.js';
import { fixoLatex } from '../../formatacao/numero.js';
import { criarPlano } from '../../grafico/fabrica.js';
import {
  CORES,
  desenharPolosZeros,
  desenharPolosDesejados,
  desenharPoloDoControlador,
  desenharVetores,
} from '../../grafico/camadas.js';
import { pontosNotaveis } from '../../projeto/pontosNotaveis.js';

export const titulo = '**Passo 4:** Critério de ângulo em $s_d$';

function listarAngulos(destino, itens, simbolo, polo) {
  for (const item of itens) {
    formula(
      destino,
      `\\angle(s_d - ${item.rotulo}) = \\angle(${complexoLatex(polo)} - (${complexoLatex(item.referencia)})) = \\angle(${complexoLatex(item.diferenca)}) = ${fixoLatex(item.angulo, 2)}^\\circ`,
    );
  }
}

function explicarInviabilidade(destino, projeto) {
  const { angulo, controlador } = projeto;
  if (angulo.motivo === 'semDeficiencia') {
    aviso(
      destino,
      'erro',
      `**Sem deficiência angular.** $s_d$ já satisfaz o critério de ângulo sem o zero, então um ganho `
      + `proporcional basta e o zero do ${controlador.nome} iria para o infinito.`,
    );
    return;
  }
  aviso(
    destino,
    'erro',
    `**Deficiência grande demais.** Cada zero real contribui com menos de $180^\\circ$, e aqui cada um `
    + `precisaria de $${fixoLatex(angulo.porZero, 2)}^\\circ$. O ${controlador.nome} não alcança $s_d$; `
    + 'revise as especificações ou use um controlador com mais zeros.',
  );
}

export function renderizar(destino, projeto) {
  const { angulo, desempenho, malhaAberta, controlador } = projeto;
  const polo = desempenho.polo;
  const polos = rotularContribuicoes(angulo.contribuicaoPolos, 'p');
  const zeros = rotularContribuicoes(angulo.contribuicaoZeros, 'z');

  paragrafo(destino, '**Condição para $s_d$ pertencer ao LGR:**');
  formula(
    destino,
    '\\angle G_c(s_d)G(s_d)H(s_d) = \\sum \\angle(s_d - z_j) - \\sum \\angle(s_d - p_i) = 180^\\circ \\pm q\\,360^\\circ',
  );
  paragrafo(
    destino,
    `Primeiro soma-se tudo o que já é conhecido${controlador.polosNaOrigem > 0 ? ', incluindo o polo do controlador na origem ($p_c$)' : ''}. O zero do controlador fica para depois.`,
  );

  separador(destino);
  paragrafo(destino, '**Ângulos dos polos:**');
  listarAngulos(destino, polos, 'p', polo);
  formula(destino, `\\sum \\angle(s_d - p_i) = ${fixoLatex(angulo.somaPolos, 2)}^\\circ`);

  if (zeros.length > 0) {
    paragrafo(destino, '**Ângulos dos zeros da planta:**');
    listarAngulos(destino, zeros, 'z', polo);
    formula(destino, `\\sum \\angle(s_d - z_j) = ${fixoLatex(angulo.somaZeros, 2)}^\\circ`);
  } else {
    paragrafo(destino, 'Sem zeros finitos na planta: $\\sum \\angle(s_d - z_j) = 0^\\circ$.');
  }

  if (angulo.anguloDoGanho !== 0) {
    aviso(destino, 'informacao', 'O ganho $k$ de $G(s)H(s)$ é negativo e soma $180^\\circ$ à fase.');
  }

  separador(destino);
  paragrafo(destino, '**Fase sem o zero do controlador:**');
  const parcelaDoGanho = angulo.anguloDoGanho !== 0 ? ` + ${fixoLatex(angulo.anguloDoGanho, 0)}^\\circ` : '';
  formula(
    destino,
    `\\theta = ${fixoLatex(angulo.somaZeros, 2)}^\\circ - ${fixoLatex(angulo.somaPolos, 2)}^\\circ${parcelaDoGanho} = ${fixoLatex(angulo.fase, 2)}^\\circ`,
  );
  paragrafo(destino, '**Deficiência angular** que o zero precisa suprir:');
  formula(
    destino,
    `\\phi_c = -180^\\circ - \\theta = -180^\\circ - (${fixoLatex(angulo.fase, 2)}^\\circ) \\equiv ${fixoLatex(angulo.deficiencia, 2)}^\\circ \\pmod{360^\\circ}`,
  );

  if (controlador.zeros > 1) {
    formula(
      destino,
      `${controlador.zeros}\\,\\angle(s_d + z) = \\phi_c \\;\\Rightarrow\\; \\angle(s_d + z) = \\frac{${fixoLatex(angulo.deficiencia, 2)}^\\circ}{${controlador.zeros}} = ${fixoLatex(angulo.porZero, 2)}^\\circ`,
    );
  } else {
    formula(destino, `\\angle(s_d + z) = \\phi_c = ${fixoLatex(angulo.porZero, 2)}^\\circ`);
  }

  if (!angulo.viavel) {
    explicarInviabilidade(destino, projeto);
  }

  separador(destino);
  const plano = criarPlano(
    pontosNotaveis(projeto, { zeroDoControlador: false }),
    'Contribuições angulares em sd',
  );
  const origens = [...malhaAberta.polos, ...(controlador.polosNaOrigem > 0 ? [{ re: 0, im: 0 }] : [])];
  desenharVetores(plano, origens, polo, CORES.polo);
  desenharVetores(plano, malhaAberta.zeros, polo, CORES.zero);
  desenharPolosZeros(plano, malhaAberta.polos, malhaAberta.zeros);
  if (controlador.polosNaOrigem > 0) {
    desenharPoloDoControlador(plano);
  }
  desenharPolosDesejados(plano, polo);
  quadroDeGrafico(destino, plano.elemento());
}
