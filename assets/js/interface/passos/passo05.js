import { formula, paragrafo, separador, aviso, quadroDeGrafico } from '../componentes.js';
import { fixoLatex } from '../../formatacao/numero.js';
import { criarPlano } from '../../grafico/fabrica.js';
import {
  CORES,
  desenharPolosZeros,
  desenharPolosDesejados,
  desenharControlador,
  desenharVetores,
} from '../../grafico/camadas.js';
import { pontosNotaveis } from '../../projeto/pontosNotaveis.js';

export const titulo = '**Passo 5:** Localização do zero do controlador';
export const requerViabilidade = true;

export function renderizar(destino, projeto) {
  const { zero, angulo, desempenho, malhaAberta, controlador } = projeto;

  paragrafo(
    destino,
    'O zero em $s = -z$ enxerga $s_d$ sob o ângulo $\\phi_z$. No triângulo formado com o eixo real:',
  );
  formula(
    destino,
    '\\tan \\phi_z = \\frac{\\omega_d}{z - \\sigma} \\;\\Longrightarrow\\; z = \\sigma + \\frac{\\omega_d}{\\tan \\phi_z}',
  );

  paragrafo(destino, 'Substituindo:');
  formula(
    destino,
    `z = ${fixoLatex(zero.sigma, 4)} + \\frac{${fixoLatex(zero.omegaD, 4)}}{\\tan(${fixoLatex(angulo.porZero, 2)}^\\circ)} = ${fixoLatex(zero.sigma, 4)} + \\frac{${fixoLatex(zero.omegaD, 4)}}{${fixoLatex(zero.tangente, 4)}} = ${fixoLatex(zero.sigma, 4)} + (${fixoLatex(zero.afastamento, 4)}) = ${fixoLatex(zero.valor, 4)}`,
  );

  const descricao = controlador.zeros > 1 ? 'Zeros do controlador (duplos)' : 'Zero do controlador';
  aviso(destino, 'sucesso', `**${descricao}:** $s = -z = ${fixoLatex(-zero.valor, 4)}$`);

  if (zero.semiplanoDireito) {
    aviso(
      destino,
      'atencao',
      'O zero caiu no semiplano direito: o controlador fica de fase não mínima e a resposta pode '
      + 'começar no sentido contrário ao degrau.',
    );
  } else if (controlador.polosNaOrigem > 0 && Math.abs(zero.valor) < 1e-6 * Math.max(1, desempenho.omegaN)) {
    aviso(destino, 'atencao', 'O zero caiu sobre o polo do controlador na origem e anula a ação integral.');
  }

  separador(destino);
  const plano = criarPlano(pontosNotaveis(projeto), 'Zero do controlador e polos desejados');
  desenharVetores(plano, [zero.ponto], desempenho.polo, CORES.controlador);
  desenharPolosZeros(plano, malhaAberta.polos, malhaAberta.zeros);
  desenharControlador(plano, controlador, zero);
  desenharPolosDesejados(plano, desempenho.polo);
  quadroDeGrafico(destino, plano.elemento());
}
