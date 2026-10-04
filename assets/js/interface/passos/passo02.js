import { formula, paragrafo, separador, quadroDeGrafico } from '../componentes.js';
import { fixoLatex } from '../../formatacao/numero.js';
import { criarPlano } from '../../grafico/fabrica.js';
import {
  desenharPolosZeros,
  desenharRetasDeAmortecimento,
  desenharPolosDesejados,
} from '../../grafico/camadas.js';
import { pontosNotaveis } from '../../projeto/pontosNotaveis.js';

export const titulo = '**Passo 2:** Polos dominantes desejados';
export const abertoPorPadrao = true;

export function renderizar(destino, projeto) {
  const { desempenho, malhaAberta } = projeto;
  const { zeta, omegaN, sigma, omegaD } = desempenho;

  paragrafo(destino, 'Par de polos complexos de um sistema de segunda ordem:');
  formula(destino, 's_d = -\\zeta\\,\\omega_n \\pm j\\,\\omega_n\\sqrt{1 - \\zeta^2} = -\\sigma \\pm j\\,\\omega_d');
  formula(
    destino,
    `s_d = -${fixoLatex(sigma, 4)} \\pm ${fixoLatex(omegaD, 4)}\\,j`,
  );

  paragrafo(destino, 'Os polos ficam sobre a reta de amortecimento, que faz com o semieixo real negativo o ângulo:');
  formula(
    destino,
    `\\beta = \\arccos \\zeta = \\arccos(${fixoLatex(zeta, 4)}) = ${fixoLatex((Math.acos(zeta) * 180) / Math.PI, 2)}^\\circ, \\qquad |s_d| = \\omega_n = ${fixoLatex(omegaN, 4)}`,
  );

  separador(destino);
  const plano = criarPlano(
    pontosNotaveis(projeto, { poloDoControlador: false, zeroDoControlador: false }),
    'Polos desejados no plano s',
  );
  desenharRetasDeAmortecimento(plano, zeta);
  desenharPolosZeros(plano, malhaAberta.polos, malhaAberta.zeros);
  desenharPolosDesejados(plano, desempenho.polo);
  quadroDeGrafico(destino, plano.elemento());
}
