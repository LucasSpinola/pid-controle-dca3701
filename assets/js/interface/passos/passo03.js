import { formula, paragrafo, separador, aviso, colunas } from '../componentes.js';
import { razaoLatex, complexoLatex } from '../../formatacao/latex.js';
import { numeroLatex } from '../../formatacao/numero.js';
import { formaParalelaLatex, formaFatoradaLatex } from '../../formatacao/controlador.js';

export const titulo = '**Passo 3:** Malha aberta com o controlador';

function listarRaizes(destino, rotulo, simbolo, lista, vazio) {
  paragrafo(destino, `**${rotulo}** ($${simbolo === 'p' ? 'n_p' : 'n_z'} = ${lista.length}$)`);
  if (lista.length === 0) {
    paragrafo(destino, vazio);
    return;
  }
  lista.forEach((item, indice) => {
    formula(destino, `${simbolo}_{${indice + 1}} = ${complexoLatex(item)}`);
  });
}

export function renderizar(destino, projeto) {
  const { entrada, malhaAberta, controlador } = projeto;

  formula(destino, `G(s) = ${razaoLatex(entrada.nG, entrada.dG)}, \\qquad H(s) = ${razaoLatex(entrada.nH, entrada.dH)}`);
  paragrafo(destino, 'Função de transferência de malha aberta da planta:');
  formula(destino, `G(s)H(s) = ${razaoLatex(malhaAberta.numerador, malhaAberta.denominador)}`);
  formula(destino, `k = \\frac{${numeroLatex(malhaAberta.numerador[0])}}{${numeroLatex(malhaAberta.denominador[0])}} = ${numeroLatex(malhaAberta.ganho)}`);

  const [esquerda, direita] = colunas(destino, 2);
  listarRaizes(esquerda, 'Polos', 'p', malhaAberta.polos, 'Nenhum polo finito.');
  listarRaizes(direita, 'Zeros', 'z', malhaAberta.zeros, 'Nenhum zero finito.');

  for (const ponto of malhaAberta.cancelamentos) {
    aviso(
      destino,
      'informacao',
      `Polo e zero coincidem em $s = ${complexoLatex(ponto)}$. As contribuições deles se anulam nos `
      + 'critérios de ângulo e de módulo, mas o modo continua presente na malha fechada.',
    );
  }

  separador(destino);
  paragrafo(destino, `**Controlador ${controlador.nome}:**`);
  formula(destino, `G_c(s) = ${formaParalelaLatex(controlador)} = ${formaFatoradaLatex(controlador)}`);
  if (controlador.zeros > 1) {
    paragrafo(destino, 'Os dois zeros são reais e iguais, então um único valor $z$ descreve os dois.');
  }

  paragrafo(destino, 'Malha aberta compensada:');
  formula(
    destino,
    `G_c(s)G(s)H(s) = ${formaFatoradaLatex(controlador)} \\cdot ${razaoLatex(malhaAberta.numerador, malhaAberta.denominador)}`,
  );
  paragrafo(
    destino,
    'Restam duas incógnitas: $z$, que sai do critério de ângulo, e $K_c$, que sai do critério de módulo, '
    + 'ambos aplicados em $s = s_d$.',
  );
}
