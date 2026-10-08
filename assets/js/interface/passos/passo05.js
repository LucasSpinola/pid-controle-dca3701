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

export function tituloPara(projeto) {
  return projeto.controlador.polosLivres > 0 ? '**Passo 5:** Localização do polo do controlador' : titulo;
}

function descrever(controlador) {
  if (controlador.polosLivres > 0) {
    return 'Polo do controlador';
  }
  return controlador.zeros > 1 ? 'Zeros do controlador (duplos)' : 'Zero do controlador';
}

export function renderizar(destino, projeto) {
  const { zero, angulo, desempenho, malhaAberta, controlador } = projeto;
  const ehPolo = controlador.polosLivres > 0;
  const simbolo = controlador.simboloLivre;
  const angular = ehPolo ? '\\phi_p' : '\\phi_z';

  paragrafo(
    destino,
    `O ${ehPolo ? 'polo' : 'zero'} em $s = -${simbolo}$ enxerga $s_d$ sob o ângulo $${angular}$. `
    + 'No triângulo formado com o eixo real:',
  );
  formula(
    destino,
    `\\tan ${angular} = \\frac{\\omega_d}{${simbolo} - \\sigma} \\;\\Longrightarrow\\; ${simbolo} = \\sigma + \\frac{\\omega_d}{\\tan ${angular}}`,
  );

  paragrafo(destino, 'Substituindo:');
  formula(
    destino,
    `${simbolo} = ${fixoLatex(zero.sigma, 4)} + \\frac{${fixoLatex(zero.omegaD, 4)}}{\\tan(${fixoLatex(angulo.porSingularidade, 2)}^\\circ)} = ${fixoLatex(zero.sigma, 4)} + \\frac{${fixoLatex(zero.omegaD, 4)}}{${fixoLatex(zero.tangente, 4)}} = ${fixoLatex(zero.sigma, 4)} + (${fixoLatex(zero.afastamento, 4)}) = ${fixoLatex(zero.valor, 4)}`,
  );

  aviso(destino, 'sucesso', `**${descrever(controlador)}:** $s = -${simbolo} = ${fixoLatex(-zero.valor, 4)}$`);

  if (zero.semiplanoDireito) {
    aviso(
      destino,
      'atencao',
      ehPolo
        ? 'O polo caiu no semiplano direito: o controlador sozinho é instável.'
        : 'O zero caiu no semiplano direito: o controlador fica de fase não mínima e a resposta pode '
          + 'começar no sentido contrário ao degrau.',
    );
  } else if (controlador.polosNaOrigem > 0 && Math.abs(zero.valor) < 1e-6 * Math.max(1, desempenho.omegaN)) {
    aviso(destino, 'atencao', 'O zero caiu sobre o polo do controlador na origem e anula a ação integral.');
  }

  separador(destino);
  const plano = criarPlano(pontosNotaveis(projeto), `${descrever(controlador)} e polos desejados`);
  desenharVetores(plano, [zero.ponto], desempenho.polo, CORES.controlador);
  desenharPolosZeros(plano, malhaAberta.polos, malhaAberta.zeros);
  desenharControlador(plano, controlador, zero);
  desenharPolosDesejados(plano, desempenho.polo);
  quadroDeGrafico(destino, plano.elemento());
}
