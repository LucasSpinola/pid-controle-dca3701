import { formula, paragrafo, separador, aviso, quadroDeGrafico } from '../componentes.js';
import { complexoLatex, rotularContribuicoes } from '../../formatacao/latex.js';
import { fixoLatex, numeroLatex } from '../../formatacao/numero.js';
import { criarPlano } from '../../grafico/fabrica.js';
import {
  CORES,
  desenharPolosZeros,
  desenharPolosDesejados,
  desenharFixosDoControlador,
  desenharVetores,
} from '../../grafico/camadas.js';
import { pontosNotaveis } from '../../projeto/pontosNotaveis.js';
import { zerosFixosComoPontos, polosFixosComoPontos } from '../../projeto/controladores.js';

export const titulo = '**Passo 4:** Critério de ângulo em $s_d$';
export const abertoPorPadrao = true;

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
  const singularidade = controlador.polosLivres > 0 ? 'polo' : 'zero';
  if (angulo.motivo === 'semDeficiencia') {
    aviso(
      destino,
      'erro',
      `**Sem deficiência angular.** $s_d$ já satisfaz o critério de ângulo sem o ${singularidade}, então um `
      + `ganho proporcional basta e o ${singularidade} do ${controlador.nome} iria para o infinito.`,
    );
    return;
  }
  if (controlador.polosLivres > 0) {
    aviso(
      destino,
      'erro',
      '**Falta fase em $s_d$.** Um polo real só retira fase, e aqui ele precisaria retirar '
      + `$${fixoLatex(angulo.porSingularidade, 2)}^\\circ$, mais que os $180^\\circ$ possíveis. `
      + 'Use um controlador com zero, como PD ou PID.',
    );
    return;
  }
  aviso(
    destino,
    'erro',
    `**Deficiência grande demais.** Cada zero real contribui com menos de $180^\\circ$, e aqui cada um `
    + `precisaria de $${fixoLatex(angulo.porSingularidade, 2)}^\\circ$. O ${controlador.nome} não alcança $s_d$; `
    + 'revise as especificações ou use um controlador com mais zeros.',
  );
}

export function renderizar(destino, projeto) {
  const { angulo, desempenho, malhaAberta, controlador } = projeto;
  const polo = desempenho.polo;
  const polos = rotularContribuicoes(angulo.contribuicaoPolos, 'p');
  const zeros = rotularContribuicoes(angulo.contribuicaoZeros, 'z');
  const singularidade = controlador.polosLivres > 0 ? 'polo' : 'zero';
  const simbolo = controlador.simboloLivre;

  paragrafo(destino, '**Condição para $s_d$ pertencer ao LGR:**');
  formula(
    destino,
    '\\angle G_c(s_d)G(s_d)H(s_d) = \\sum \\angle(s_d - z_j) - \\sum \\angle(s_d - p_i) = 180^\\circ \\pm q\\,360^\\circ',
  );
  const conhecidos = [
    ...(controlador.polosNaOrigem > 0 ? ['o polo do controlador na origem ($p_c$)'] : []),
    ...(controlador.polosFixos || []).map((valor) => `o polo dado em $s = ${numeroLatex(-valor)}$ ($p_c$)`),
    ...(controlador.zerosFixos || []).map((valor) => `o zero dado em $s = ${numeroLatex(-valor)}$ ($z_c$)`),
  ];
  paragrafo(
    destino,
    `Primeiro soma-se tudo o que já é conhecido${conhecidos.length > 0 ? `, incluindo ${conhecidos.join(' e ')}` : ''}. `
    + `O ${singularidade} do controlador fica para depois.`,
  );

  separador(destino);
  paragrafo(destino, '**Ângulos dos polos:**');
  listarAngulos(destino, polos, 'p', polo);
  formula(destino, `\\sum \\angle(s_d - p_i) = ${fixoLatex(angulo.somaPolos, 2)}^\\circ`);

  if (zeros.length > 0) {
    paragrafo(destino, (controlador.zerosFixos || []).length > 0 ? '**Ângulos dos zeros:**' : '**Ângulos dos zeros da planta:**');
    listarAngulos(destino, zeros, 'z', polo);
    formula(destino, `\\sum \\angle(s_d - z_j) = ${fixoLatex(angulo.somaZeros, 2)}^\\circ`);
  } else {
    paragrafo(destino, 'Sem zeros finitos na planta: $\\sum \\angle(s_d - z_j) = 0^\\circ$.');
  }

  if (angulo.anguloDoGanho !== 0) {
    aviso(destino, 'informacao', 'O ganho $k$ de $G(s)H(s)$ é negativo e soma $180^\\circ$ à fase.');
  }

  separador(destino);
  paragrafo(destino, `**Fase sem o ${singularidade} do controlador:**`);
  const parcelaDoGanho = angulo.anguloDoGanho !== 0 ? ` + ${fixoLatex(angulo.anguloDoGanho, 0)}^\\circ` : '';
  formula(
    destino,
    `\\theta = ${fixoLatex(angulo.somaZeros, 2)}^\\circ - ${fixoLatex(angulo.somaPolos, 2)}^\\circ${parcelaDoGanho} = ${fixoLatex(angulo.fase, 2)}^\\circ`,
  );
  paragrafo(destino, `**Deficiência angular** que o ${singularidade} precisa suprir:`);
  formula(
    destino,
    `\\phi_c = -180^\\circ - \\theta = -180^\\circ - (${fixoLatex(angulo.fase, 2)}^\\circ) \\equiv ${fixoLatex(angulo.deficiencia, 2)}^\\circ \\pmod{360^\\circ}`,
  );

  if (controlador.polosLivres > 0) {
    paragrafo(destino, `Um polo contribui com sinal negativo, então $-\\angle(s_d + ${simbolo}) \\equiv \\phi_c$:`);
    formula(
      destino,
      `\\angle(s_d + ${simbolo}) = 360^\\circ - \\phi_c = 360^\\circ - ${fixoLatex(angulo.deficiencia, 2)}^\\circ = ${fixoLatex(angulo.porSingularidade, 2)}^\\circ`,
    );
  } else if (controlador.zeros > 1) {
    formula(
      destino,
      `${controlador.zeros}\\,\\angle(s_d + z) = \\phi_c \\;\\Rightarrow\\; \\angle(s_d + z) = \\frac{${fixoLatex(angulo.deficiencia, 2)}^\\circ}{${controlador.zeros}} = ${fixoLatex(angulo.porSingularidade, 2)}^\\circ`,
    );
  } else {
    formula(destino, `\\angle(s_d + z) = \\phi_c = ${fixoLatex(angulo.porSingularidade, 2)}^\\circ`);
  }

  if (!angulo.viavel) {
    explicarInviabilidade(destino, projeto);
  }

  separador(destino);
  const plano = criarPlano(
    pontosNotaveis(projeto, { zeroDoControlador: false }),
    'Contribuições angulares em sd',
  );
  desenharVetores(plano, [...malhaAberta.polos, ...polosFixosComoPontos(controlador)], polo, CORES.polo);
  desenharVetores(plano, [...malhaAberta.zeros, ...zerosFixosComoPontos(controlador)], polo, CORES.zero);
  desenharPolosZeros(plano, malhaAberta.polos, malhaAberta.zeros);
  desenharFixosDoControlador(plano, controlador);
  desenharPolosDesejados(plano, polo);
  quadroDeGrafico(destino, plano.elemento());
}
