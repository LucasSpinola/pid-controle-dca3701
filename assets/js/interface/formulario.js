import { interpretarPolinomio, interpretarNumero } from '../nucleo/entrada.js';
import { obterControlador } from '../projeto/controladores.js';

export const CAMPOS = {
  nG: 'numerador-g',
  dG: 'denominador-g',
  nH: 'numerador-h',
  dH: 'denominador-h',
  controlador: 'controlador',
  fixo: 'valor-fixo',
  modo: 'modo',
  sobressinal: 'sobressinal',
  acomodacao: 'acomodacao',
  criterio: 'criterio',
  zeta: 'zeta',
  omegaN: 'omega-n',
  tempoPico: 'tempo-pico',
  poloReal: 'polo-real',
  poloImaginario: 'polo-imaginario',
  discretizacao: 'discretizacao',
  periodo: 'periodo',
  alvo: 'alvo',
  constante: 'constante-desejada',
  zeroAtraso: 'zero-atraso',
  zetaAtraso: 'zeta-atraso',
};

export const CAMPOS_FIXOS = ['nG', 'dG', 'nH', 'dH', 'controlador', 'modo', 'discretizacao'];

export const CAMPOS_POR_MODO = {
  desempenho: ['sobressinal', 'acomodacao', 'criterio'],
  amortecimento: ['zeta', 'omegaN'],
  polos: ['poloReal', 'poloImaginario'],
  pico: ['sobressinal', 'tempoPico'],
  amortecimentoAcomodacao: ['zeta', 'acomodacao', 'criterio'],
  acomodacaoPico: ['acomodacao', 'criterio', 'tempoPico'],
};

export const CAMPOS_DA_DISCRETIZACAO = ['periodo', 'alvo'];

export const VALORES_PADRAO = {
  nH: '1',
  dH: '1',
  criterio: '5',
  fixo: '1',
  discretizacao: 'nenhuma',
  periodo: '1',
  alvo: 'controlador',
  constante: '',
  zeroAtraso: '0.1',
  zetaAtraso: '',
};

const ROTULOS_DO_FIXO = {
  zero: 'Zero dado z, fator (s + z)',
  polo: 'Polo dado p, fator (s + p)',
};

const VALIDACOES = {
  sobressinal: {
    chave: 'sobressinal',
    valido: (v) => v > 0 && v < 100,
    erro: 'O sobressinal $M_P$ precisa ficar entre $0\\%$ e $100\\%$, sem os extremos.',
  },
  acomodacao: {
    chave: 'acomodacao',
    valido: (v) => v > 0,
    erro: 'O tempo de acomodação $t_s$ precisa ser positivo.',
  },
  zeta: {
    chave: 'zeta',
    valido: (v) => v > 0 && v < 1,
    erro: 'O fator de amortecimento $\\zeta$ precisa ficar entre $0$ e $1$ para gerar polos complexos.',
  },
  omegaN: {
    chave: 'omegaN',
    valido: (v) => v > 0,
    erro: 'A frequência natural $\\omega_n$ precisa ser positiva.',
  },
  tempoPico: {
    chave: 'tempoDePico',
    valido: (v) => v > 0,
    erro: 'O tempo de pico $t_p$ precisa ser positivo.',
  },
  poloReal: {
    chave: 'real',
    valido: (v) => v < 0,
    erro: 'A parte real dos polos desejados precisa ser negativa.',
  },
  poloImaginario: {
    chave: 'imaginario',
    valido: (v) => v > 0,
    ajustar: Math.abs,
    erro: 'A parte imaginária dos polos desejados precisa ser diferente de zero.',
  },
};

export function campo(nome) {
  return document.getElementById(CAMPOS[nome]);
}

export function valoresDoFormulario() {
  return Object.fromEntries(Object.keys(CAMPOS).map((nome) => [nome, campo(nome).value]));
}

function numero(valores, nome) {
  return interpretarNumero(String(valores[nome] ?? ''), NaN);
}

function informacaoDoControlador(idDoControlador) {
  try {
    return obterControlador(idDoControlador);
  } catch (falha) {
    return null;
  }
}

export function tipoDoFixo(idDoControlador) {
  return informacaoDoControlador(idDoControlador)?.fixo || null;
}

export function usaAtraso(idDoControlador) {
  const controlador = informacaoDoControlador(idDoControlador);
  return Boolean(controlador && (controlador.atraso || controlador.pipeline === 'atraso'));
}

export function soAtraso(idDoControlador) {
  return informacaoDoControlador(idDoControlador)?.pipeline === 'atraso';
}

function mostrar(seletor, visivel) {
  document.querySelectorAll(seletor).forEach((painel) => {
    painel.hidden = !visivel;
  });
}

export function atualizarModo() {
  const visiveis = CAMPOS_POR_MODO[campo('modo').value] || [];
  document.querySelectorAll('[data-campo]').forEach((rotulo) => {
    rotulo.hidden = !visiveis.includes(rotulo.dataset.campo);
  });

  const idDoControlador = campo('controlador').value;
  const somenteAtraso = soAtraso(idDoControlador);
  mostrar('[data-discretizacao]', campo('discretizacao').value !== 'nenhuma' && !somenteAtraso);
  mostrar('[data-escolha-discretizacao]', !somenteAtraso);
  mostrar('[data-especificacao]', !somenteAtraso);
  mostrar('[data-atraso]', usaAtraso(idDoControlador));
  mostrar('[data-zeta-atraso]', somenteAtraso);

  const fixo = tipoDoFixo(idDoControlador);
  mostrar('[data-fixo]', fixo !== null);
  const rotulo = document.getElementById('rotulo-fixo');
  if (rotulo && fixo) {
    rotulo.textContent = informacaoDoControlador(idDoControlador).rotuloFixo || ROTULOS_DO_FIXO[fixo];
  }
}

export function conectarModos() {
  for (const nome of ['modo', 'discretizacao', 'controlador']) {
    campo(nome).addEventListener('change', atualizarModo);
  }
  atualizarModo();
}

function interpretarEspecificacaoDe(valores) {
  const nomes = CAMPOS_POR_MODO[valores.modo];
  if (!nomes) {
    return { erro: 'Escolha como a especificação será informada.' };
  }
  const especificacao = { modo: valores.modo };
  for (const nome of nomes) {
    if (nome === 'criterio') {
      especificacao.criterio = Number(valores.criterio);
      continue;
    }
    const regra = VALIDACOES[nome];
    const valor = (regra.ajustar || ((v) => v))(numero(valores, nome));
    if (!regra.valido(valor)) {
      return { erro: regra.erro };
    }
    especificacao[regra.chave] = valor;
  }
  return { especificacao };
}

function interpretarDiscretizacao(valores) {
  if (!valores.discretizacao || valores.discretizacao === 'nenhuma') {
    return { discretizacao: null };
  }
  const periodo = numero(valores, 'periodo');
  if (!(periodo > 0)) {
    return { erro: 'O período de amostragem $T$ precisa ser positivo.' };
  }
  return { discretizacao: { metodo: valores.discretizacao, periodo, alvo: valores.alvo || 'controlador' } };
}

function interpretarFixo(valores) {
  if (tipoDoFixo(valores.controlador) === null) {
    return { fixo: null };
  }
  const fixo = numero(valores, 'fixo');
  if (!Number.isFinite(fixo)) {
    return { erro: 'Informe o valor dado do compensador.' };
  }
  return { fixo };
}

function interpretarAtraso(valores) {
  if (!usaAtraso(valores.controlador)) {
    return { atraso: null };
  }
  const constante = numero(valores, 'constante');
  if (!(constante > 0)) {
    return { erro: 'Informe a constante de erro desejada ($K_p$, $K_v$ ou $K_a$, conforme o tipo do sistema).' };
  }
  const zero = numero(valores, 'zeroAtraso');
  if (!(zero > 0)) {
    return { erro: 'O zero da parte em atraso precisa ser positivo, perto da origem, como 0,1.' };
  }
  let zeta = null;
  if (soAtraso(valores.controlador) && String(valores.zetaAtraso ?? '').trim() !== '') {
    zeta = numero(valores, 'zetaAtraso');
    if (!(zeta > 0 && zeta < 1)) {
      return { erro: 'O $\\zeta$ dos polos dominantes precisa ficar entre $0$ e $1$, ou ficar em branco.' };
    }
  }
  return { atraso: { constante, zero, zeta } };
}

export function lerEspecificacao() {
  return interpretarEspecificacaoDe(valoresDoFormulario());
}

export function lerFixo() {
  return interpretarFixo(valoresDoFormulario()).fixo ?? null;
}

export function lerCoeficientes() {
  return ['nG', 'dG', 'nH', 'dH'].map((nome) => interpretarPolinomio(campo(nome).value));
}

export function interpretarFormulario(dados) {
  const valores = { ...VALORES_PADRAO, ...dados };
  const [nG, dG, nH, dH] = ['nG', 'dG', 'nH', 'dH'].map((nome) => interpretarPolinomio(String(valores[nome] ?? '')));

  if ([nG, dG, nH, dH].some((item) => item === null)) {
    return {
      erro: 'Confira $G(s)$ e $H(s)$: use coeficientes em ordem decrescente de $s$, como 1 4 0, '
        + 'ou a expressão, como s(s+4).',
    };
  }
  if ([nG, dG, nH, dH].some((item) => item.every((v) => v === 0))) {
    return { erro: 'Nenhum numerador ou denominador de $G(s)$ e $H(s)$ pode ser nulo.' };
  }

  const somenteAtraso = soAtraso(valores.controlador);
  const leituras = [
    interpretarFixo(valores),
    interpretarAtraso(valores),
    ...(somenteAtraso ? [] : [interpretarEspecificacaoDe(valores), interpretarDiscretizacao(valores)]),
  ];
  for (const leitura of leituras) {
    if (leitura.erro) {
      return leitura;
    }
  }

  return {
    entrada: {
      nG,
      dG,
      nH,
      dH,
      controlador: valores.controlador,
      fixo: interpretarFixo(valores).fixo,
      atraso: interpretarAtraso(valores).atraso,
      especificacao: somenteAtraso ? null : interpretarEspecificacaoDe(valores).especificacao,
      discretizacao: somenteAtraso ? null : interpretarDiscretizacao(valores).discretizacao,
    },
  };
}

export function lerFormulario() {
  return interpretarFormulario(valoresDoFormulario());
}
