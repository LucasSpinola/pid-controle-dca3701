import { projetarControlador } from './projeto/projeto.js';
import { lerFormulario, conectarModos } from './interface/formulario.js';
import { aviso, elemento, limparNo } from './interface/componentes.js';
import { montarApresentacao, esconderRoteiro } from './interface/apresentacao.js';
import { aplicarEndereco, atualizarEndereco } from './interface/endereco.js';
import { conectarImpressao } from './interface/ferramentas.js';
import { renderizarResultado } from './interface/resultado.js';

function executar(destino, rolar = true) {
  const leitura = lerFormulario();
  limparNo(destino);

  if (leitura.erro) {
    aviso(destino, 'erro', leitura.erro);
    return;
  }

  atualizarEndereco();
  destino.appendChild(elemento('p', 'carregando', 'Calculando'));

  window.requestAnimationFrame(() => {
    try {
      const projeto = projetarControlador(leitura.entrada);
      limparNo(destino);
      esconderRoteiro();
      renderizarResultado(destino, projeto);
      if (rolar) {
        destino.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    } catch (falha) {
      limparNo(destino);
      aviso(destino, 'erro', `Não foi possível concluir o projeto: ${falha.message}`);
    }
  });
}

function iniciar() {
  const destino = document.getElementById('resultado');
  const formulario = document.getElementById('formulario');

  const veioDoEndereco = aplicarEndereco();
  conectarModos();
  montarApresentacao(!veioDoEndereco);
  conectarImpressao();

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    executar(destino);
  });

  if (veioDoEndereco) {
    executar(destino, false);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}
