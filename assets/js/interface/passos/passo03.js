import { formula, paragrafo, separador, aviso, colunas } from '../componentes.js';
import { razaoLatex, complexoLatex } from '../../formatacao/latex.js';
import { numeroLatex } from '../../formatacao/numero.js';
import { formaFatoradaLatex, controladorLatex } from '../../formatacao/controlador.js';

export const titulo = '**Passo 3:** Malha aberta com o controlador';
export const abertoPorPadrao = true;

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
  const familiaPid = ['pd', 'pi', 'pid'].includes(controlador.id);
  paragrafo(destino, familiaPid ? `**Controlador ${controlador.nome}:**` : '**Controlador:**');
  formula(destino, controladorLatex(controlador));
  if (controlador.zeros > 1) {
    paragrafo(destino, 'Os dois zeros são reais e iguais, então um único valor $z$ descreve os dois.');
  }

  paragrafo(destino, 'Malha aberta compensada:');
  formula(
    destino,
    `G_c(s)G(s)H(s) = ${formaFatoradaLatex(controlador)} \\cdot ${razaoLatex(malhaAberta.numerador, malhaAberta.denominador)}`,
  );
  const livre = controlador.polosLivres > 0 ? 'a posição do polo' : 'a posição do zero';
  paragrafo(
    destino,
    `Restam duas incógnitas: $${controlador.simboloLivre}$, ${livre}, que sai do critério de ângulo, e `
    + `$${controlador.simboloGanho}$, que sai do critério de módulo, ambos aplicados em $s = s_d$.`,
  );
  if (controlador.atraso) {
    aviso(
      destino,
      'informacao',
      'No atraso-avanço, os passos 4 a 6 projetam só a parte em avanço, com o zero $z_1$ dado. '
      + 'A parte em atraso entra no passo 6b, pela constante de erro.',
    );
  }
}
