import { formula, paragrafo, separador, aviso } from '../componentes.js';
import { numeroLatex } from '../../formatacao/numero.js';
import { razaoLatex } from '../../formatacao/latex.js';
import {
  formaParalelaLatex,
  formaFatoradaLatex,
  relacoesDeGanho,
} from '../../formatacao/controlador.js';

export const titulo = '**Passo 7:** Ganhos do controlador';
export const requerViabilidade = true;
export const abertoPorPadrao = true;

function formaParalelaNumerica(controlador, ganhos) {
  const termos = [numeroLatex(ganhos.kp)];
  if (controlador.polosNaOrigem > 0) {
    termos.push(`\\dfrac{${numeroLatex(ganhos.ki)}}{s}`);
  }
  if (controlador.zeros > controlador.polosNaOrigem) {
    termos.push(`${numeroLatex(ganhos.kd)}\\,s`);
  }
  return termos.join(' + ');
}

function renderizarPolo(destino, projeto) {
  const { controlador, zero, modulo } = projeto;
  paragrafo(destino, 'Os parâmetros saem direto dos dois critérios:');
  formula(
    destino,
    `a = ${numeroLatex(modulo.kc)} \\quad (\\text{critério de módulo}), \\qquad b = ${numeroLatex(zero.valor)} \\quad (\\text{critério de ângulo})`,
  );

  separador(destino);
  paragrafo(destino, '**Controlador projetado:**');
  formula(destino, `G_c(s) = ${formaFatoradaLatex(controlador, zero.valor, numeroLatex(modulo.kc))}`);
  aviso(destino, 'sucesso', `**Controlador:** $a = ${numeroLatex(modulo.kc)}$, $b = ${numeroLatex(zero.valor)}$`);
}

export function renderizar(destino, projeto) {
  const { controlador, zero, modulo, ganhos, malhaFechada } = projeto;
  if (controlador.polosLivres > 0) {
    renderizarPolo(destino, projeto);
    return;
  }

  paragrafo(destino, 'Expandindo a forma fatorada e comparando com a forma paralela:');
  formula(destino, `G_c(s) = ${formaFatoradaLatex(controlador)} = ${formaParalelaLatex(controlador)}`);

  separador(destino);
  for (const relacao of relacoesDeGanho(controlador)) {
    formula(
      destino,
      `${relacao.simbolo} = ${relacao.expressao} = ${numeroLatex(ganhos[relacao.chave])}`,
    );
  }
  paragrafo(destino, `com $K_c = ${numeroLatex(modulo.kc)}$ e $z = ${numeroLatex(zero.valor)}$.`);

  separador(destino);
  paragrafo(destino, '**Controlador projetado:**');
  formula(destino, `G_c(s) = ${formaFatoradaLatex(controlador, zero.valor, numeroLatex(modulo.kc))}`);
  formula(destino, `G_c(s) = ${formaParalelaNumerica(controlador, ganhos)}`);
  formula(
    destino,
    `G_c(s) = ${razaoLatex(malhaFechada.numeradorControlador, malhaFechada.denominadorControlador)}`,
  );

  const valores = relacoesDeGanho(controlador)
    .map((relacao) => `$${relacao.simbolo} = ${numeroLatex(ganhos[relacao.chave])}$`)
    .join(', ');
  aviso(destino, 'sucesso', `**${controlador.nome}:** ${valores}`);
}
