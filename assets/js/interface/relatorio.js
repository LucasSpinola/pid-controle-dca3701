import { projetarControlador } from '../projeto/projeto.js';
import { aviso, elemento, limparNo } from './componentes.js';
import { interpretarFormulario } from './formulario.js';
import { imprimir } from './ferramentas.js';
import { renderizarResultado } from './resultado.js';

const CLASSE_DE_IMPRESSAO = 'imprimindo-lista';

export function montarQuestao(destino, exercicio, questao) {
  const bloco = elemento('section', 'relatorio-questao');
  const descricao = { ...questao, exercicio: exercicio.nome };
  const leitura = interpretarFormulario(questao);

  try {
    if (leitura.erro) {
      throw new Error(leitura.erro);
    }
    renderizarResultado(bloco, projetarControlador(leitura.entrada), { questao: descricao, barra: false, aberto: true });
  } catch (falha) {
    bloco.appendChild(elemento('p', 'enunciado-etiqueta', `${exercicio.nome} · ${questao.nome}`));
    aviso(bloco, 'erro', `Não foi possível concluir o projeto: ${falha.message}`);
  }
  destino.appendChild(bloco);
  return bloco;
}

export function imprimirLista(exercicio) {
  const destino = limparNo(document.getElementById('impressao'));
  for (const questao of exercicio.questoes) {
    montarQuestao(destino, exercicio, questao);
  }

  document.body.classList.add(CLASSE_DE_IMPRESSAO);
  window.requestAnimationFrame(() => {
    imprimir(`${exercicio.nome} - PD, PI e PID pelo LGR`, () => {
      document.body.classList.remove(CLASSE_DE_IMPRESSAO);
      limparNo(destino);
    });
  });
}
