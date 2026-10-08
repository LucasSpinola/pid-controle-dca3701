import assert from 'node:assert/strict';

class NoFalso {
  constructor(tag, espaco = null) {
    this.tagName = tag;
    this.namespaceURI = espaco;
    this.children = [];
    this.attributes = {};
    this.ouvintes = {};
    this.className = '';
    this.hidden = false;
    this.open = false;
    this.type = '';
    this.value = '';
    this.conteudo = '';
    this.classList = {
      add: (nome) => {
        this.className = `${this.className} ${nome}`.trim();
      },
      remove: (nome) => {
        this.className = this.className.split(' ').filter((item) => item !== nome).join(' ');
      },
      contains: (nome) => this.className.split(' ').includes(nome),
    };
  }

  setAttribute(nome, valor) {
    this.attributes[nome] = String(valor);
  }

  getAttribute(nome) {
    return this.attributes[nome];
  }

  appendChild(filho) {
    this.children.push(filho);
    return filho;
  }

  insertBefore(filho) {
    this.children.unshift(filho);
    return filho;
  }

  removeChild(filho) {
    this.children = this.children.filter((item) => item !== filho);
  }

  addEventListener(nome, funcao) {
    this.ouvintes[nome] = funcao;
  }

  get firstChild() {
    return this.children[0] || null;
  }

  set textContent(valor) {
    this.conteudo = String(valor);
    this.children = [];
  }

  get textContent() {
    return this.conteudo;
  }

  serializar() {
    const atributos = Object.entries(this.attributes)
      .map(([chave, valor]) => `${chave}="${valor}"`)
      .join(' ');
    const interno = this.conteudo
      + this.children.map((filho) => (filho.serializar ? filho.serializar() : String(filho))).join('');
    return `<${this.tagName}${atributos ? ` ${atributos}` : ''}>${interno}</${this.tagName}>`;
  }
}

const registrados = new Map();

globalThis.document = {
  createElement: (tag) => new NoFalso(tag),
  createElementNS: (espaco, tag) => new NoFalso(tag, espaco),
  createTextNode: (texto) => ({ texto, serializar: () => texto }),
  getElementById: (identificador) => {
    if (!registrados.has(identificador)) {
      registrados.set(identificador, new NoFalso('div'));
    }
    return registrados.get(identificador);
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  readyState: 'complete',
  styleSheets: [],
};

globalThis.window = {
  requestAnimationFrame: (funcao) => funcao(),
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  setTimeout: () => 0,
  clearTimeout: () => {},
};

const { projetarControlador } = await import('../assets/js/projeto/projeto.js');
const { renderizarResultado } = await import('../assets/js/interface/resultado.js');
const { passos } = await import('../assets/js/interface/passos/indice.js');
const { EXERCICIOS } = await import('../assets/js/interface/exercicios.js');
const { CAMPOS, interpretarFormulario } = await import('../assets/js/interface/formulario.js');
const { montarQuestao } = await import('../assets/js/interface/relatorio.js');

let executados = 0;
let falhas = 0;

function teste(nome, corpo) {
  executados += 1;
  try {
    corpo();
    console.log(`ok   ${nome}`);
  } catch (erro) {
    falhas += 1;
    console.log(`FALHA ${nome}`);
    console.log(`      ${erro.message}`);
  }
}

const CASOS = [
  {
    nome: 'questao 1 (PD, Mp e ts de 5%)',
    entrada: {
      nG: [4, 16], dG: [1, 4, 4, 0], nH: [1], dH: [1],
      controlador: 'pd',
      especificacao: { modo: 'desempenho', sobressinal: 10, acomodacao: 4, criterio: 5 },
    },
  },
  {
    nome: 'questao 2 (PD, zeta e omega n)',
    entrada: {
      nG: [1], dG: [10000, 0, -11772], nH: [1], dH: [1],
      controlador: 'pd',
      especificacao: { modo: 'amortecimento', zeta: 0.7, omegaN: 0.5 },
    },
  },
  {
    nome: 'questao 3 (PI, polos dados)',
    entrada: {
      nG: [5, 25, 20], dG: [1, 4, 4], nH: [0.2], dH: [1, 1],
      controlador: 'pi',
      especificacao: { modo: 'polos', real: -4, imaginario: 4 },
    },
  },
  {
    nome: 'questao 4 (PID, Mp e ts de 2%)',
    entrada: {
      nG: [5], dG: [1, 12, 22, 20], nH: [0.4], dH: [1],
      controlador: 'pid',
      especificacao: { modo: 'desempenho', sobressinal: 20, acomodacao: 5, criterio: 2 },
    },
  },
  {
    nome: 'ganho negativo na planta',
    entrada: {
      nG: [-1], dG: [1, 3, 2], nH: [1], dH: [1],
      controlador: 'pid',
      especificacao: { modo: 'polos', real: -2, imaginario: 2 },
    },
  },
  {
    nome: '2o exercicio, questao 1 (PID e Tustin no controlador)',
    entrada: {
      nG: [5, 15], dG: [1, 4, 0], nH: [1], dH: [1, 1],
      controlador: 'pid',
      especificacao: { modo: 'desempenho', sobressinal: 10, acomodacao: 3, criterio: 5 },
      discretizacao: { metodo: 'tustin', periodo: 2, alvo: 'controlador' },
    },
  },
  {
    nome: '2o exercicio, questao 2 (a/(s+b) e Euler na malha)',
    entrada: {
      nG: [2, 2], dG: [1, 2, 2], nH: [1, 3], dH: [1, 5],
      controlador: 'polo',
      especificacao: { modo: 'polos', real: -2.5, imaginario: 2 },
      discretizacao: { metodo: 'euler', periodo: 1, alvo: 'malha' },
    },
  },
  {
    nome: 'PD com Euler para frente (nao causal)',
    entrada: {
      nG: [4, 16], dG: [1, 4, 4, 0], nH: [1], dH: [1],
      controlador: 'pd',
      especificacao: { modo: 'desempenho', sobressinal: 10, acomodacao: 4, criterio: 5 },
      discretizacao: { metodo: 'euler', periodo: 0.1, alvo: 'controlador' },
    },
  },
];

function passosAplicaveis(projeto) {
  return passos.filter((passo) => !passo.aplicavel || passo.aplicavel(projeto)).length;
}

function renderizar(projeto) {
  const raiz = new NoFalso('div');
  renderizarResultado(raiz, projeto);
  return raiz;
}

function verificarSaida(html) {
  assert.ok(html.length > 1000, 'saida curta demais');
  assert.ok(!html.includes('undefined'), 'saida contem undefined');
  assert.ok(!html.includes('NaN'), 'saida contem NaN');
}

for (const caso of CASOS) {
  teste(`os passos renderizam para ${caso.nome}`, () => {
    const projeto = projetarControlador(caso.entrada);
    const raiz = renderizar(projeto);
    verificarSaida(raiz.serializar());
    if (projeto.viavel) {
      assert.equal(raiz.children.filter((item) => item.tagName === 'details').length, passosAplicaveis(projeto));
    }
  });
}

teste('projeto inviavel para no criterio de angulo', () => {
  const projeto = projetarControlador({
    nG: [1], dG: [1, 2, 0], nH: [1], dH: [1],
    controlador: 'pd',
    especificacao: { modo: 'polos', real: -1, imaginario: 2 },
  });
  assert.equal(projeto.viavel, false);
  const raiz = renderizar(projeto);
  const html = raiz.serializar();
  verificarSaida(html);
  assert.ok(html.includes('Sem deficiência angular'));
  assert.equal(raiz.children.filter((item) => item.tagName === 'details').length, 4);
  assert.ok(!html.includes('grafico-final'), 'grafico final nao deveria aparecer');
});

teste('as questoes da lista so usam campos do formulario', () => {
  for (const exercicio of EXERCICIOS) {
    for (const questao of exercicio.questoes) {
      for (const nome of Object.keys(questao)) {
        assert.ok(['nome', 'enunciado'].includes(nome) || nome in CAMPOS, `campo desconhecido: ${nome}`);
      }
    }
  }
});

const { montarApresentacao } = await import('../assets/js/interface/apresentacao.js');

teste('escolher uma questao preenche o formulario', () => {
  document.getElementById(CAMPOS.controlador).value = 'pd';
  montarApresentacao();
  const grupo = document.getElementById('exemplos').children[0];
  const botoes = grupo.children.filter((item) => item.tagName === 'button' && !item.className.includes('pilula-pdf'));
  assert.equal(botoes.length, EXERCICIOS[0].questoes.length);

  botoes[3].ouvintes.click();
  assert.equal(document.getElementById(CAMPOS.dG).value, '1 12 22 20');
  assert.equal(document.getElementById(CAMPOS.controlador).value, 'pid');
  assert.equal(document.getElementById(CAMPOS.criterio).value, '2');
});

teste('o controlador a/(s+b) aparece com polo nos passos', () => {
  const projeto = projetarControlador(CASOS.find((caso) => caso.entrada.controlador === 'polo').entrada);
  const html = renderizar(projeto).serializar();
  assert.ok(html.includes('Localização do polo do controlador'));
  assert.ok(html.includes('Passo 10'));
  assert.ok(html.includes('fora do círculo unitário'));
});

teste('todas as questoes das listas viram entrada valida e renderizam', () => {
  for (const exercicio of EXERCICIOS) {
    for (const questao of exercicio.questoes) {
      const leitura = interpretarFormulario(questao);
      assert.ok(!leitura.erro, `${exercicio.nome}, ${questao.nome}: ${leitura.erro}`);
      const raiz = new NoFalso('div');
      montarQuestao(raiz, exercicio, questao);
      const html = raiz.serializar();
      verificarSaida(html);
      assert.ok(html.includes(questao.nome));
      assert.ok(!html.includes('aviso-erro'), `${exercicio.nome}, ${questao.nome} terminou com erro`);
    }
  }
});

teste('cada lista tem botao de PDF', () => {
  const grupos = document.getElementById('exemplos').children;
  for (const grupo of grupos) {
    assert.equal(grupo.children.filter((item) => item.className.includes('pilula-pdf')).length, 1);
  }
});

console.log(`\n${executados - falhas}/${executados} testes de interface passaram`);
if (falhas > 0) {
  process.exitCode = 1;
}
