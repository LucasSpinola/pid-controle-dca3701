import { interpretarCoeficientes, interpretarNumero } from '../nucleo/entrada.js';

export const CAMPOS = {
  nG: 'numerador-g',
  dG: 'denominador-g',
  nH: 'numerador-h',
  dH: 'denominador-h',
  controlador: 'controlador',
  modo: 'modo',
  sobressinal: 'sobressinal',
  acomodacao: 'acomodacao',
  criterio: 'criterio',
  zeta: 'zeta',
  omegaN: 'omega-n',
  poloReal: 'polo-real',
  poloImaginario: 'polo-imaginario',
  discretizacao: 'discretizacao',
  periodo: 'periodo',
  alvo: 'alvo',
};

export const CAMPOS_FIXOS = ['nG', 'dG', 'nH', 'dH', 'controlador', 'modo', 'discretizacao'];

export const CAMPOS_POR_MODO = {
  desempenho: ['sobressinal', 'acomodacao', 'criterio'],
  amortecimento: ['zeta', 'omegaN'],
  polos: ['poloReal', 'poloImaginario'],
};

export const CAMPOS_DA_DISCRETIZACAO = ['periodo', 'alvo'];

export const VALORES_PADRAO = {
  nH: '1',
  dH: '1',
  criterio: '5',
  discretizacao: 'nenhuma',
  periodo: '1',
  alvo: 'controlador',
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

export function atualizarModo() {
  const modo = campo('modo').value;
  document.querySelectorAll('[data-modo]').forEach((painel) => {
    painel.hidden = painel.dataset.modo !== modo;
  });
  const discretizar = campo('discretizacao').value !== 'nenhuma';
  document.querySelectorAll('[data-discretizacao]').forEach((painel) => {
    painel.hidden = !discretizar;
  });
}

export function conectarModos() {
  campo('modo').addEventListener('change', atualizarModo);
  campo('discretizacao').addEventListener('change', atualizarModo);
  atualizarModo();
}

function lerDesempenho(valores) {
  const sobressinal = numero(valores, 'sobressinal');
  const acomodacao = numero(valores, 'acomodacao');
  if (!(sobressinal > 0 && sobressinal < 100)) {
    return { erro: 'O sobressinal $M_P$ precisa ficar entre $0\\%$ e $100\\%$, sem os extremos.' };
  }
  if (!(acomodacao > 0)) {
    return { erro: 'O tempo de acomodação $t_s$ precisa ser positivo.' };
  }
  return {
    especificacao: { modo: 'desempenho', sobressinal, acomodacao, criterio: Number(valores.criterio) },
  };
}

function lerAmortecimento(valores) {
  const zeta = numero(valores, 'zeta');
  const omegaN = numero(valores, 'omegaN');
  if (!(zeta > 0 && zeta < 1)) {
    return { erro: 'O fator de amortecimento $\\zeta$ precisa ficar entre $0$ e $1$ para gerar polos complexos.' };
  }
  if (!(omegaN > 0)) {
    return { erro: 'A frequência natural $\\omega_n$ precisa ser positiva.' };
  }
  return { especificacao: { modo: 'amortecimento', zeta, omegaN } };
}

function lerPolos(valores) {
  const real = numero(valores, 'poloReal');
  const imaginario = Math.abs(numero(valores, 'poloImaginario'));
  if (!(real < 0)) {
    return { erro: 'A parte real dos polos desejados precisa ser negativa.' };
  }
  if (!(imaginario > 0)) {
    return { erro: 'A parte imaginária dos polos desejados precisa ser diferente de zero.' };
  }
  return { especificacao: { modo: 'polos', real, imaginario } };
}

const LEITORES = {
  desempenho: lerDesempenho,
  amortecimento: lerAmortecimento,
  polos: lerPolos,
};

function interpretarEspecificacaoDe(valores) {
  const leitor = LEITORES[valores.modo];
  return leitor ? leitor(valores) : { erro: 'Escolha como a especificação será informada.' };
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

export function lerEspecificacao() {
  return interpretarEspecificacaoDe(valoresDoFormulario());
}

export function lerCoeficientes() {
  return ['nG', 'dG', 'nH', 'dH'].map((nome) => interpretarCoeficientes(campo(nome).value));
}

export function interpretarFormulario(dados) {
  const valores = { ...VALORES_PADRAO, ...dados };
  const [nG, dG, nH, dH] = ['nG', 'dG', 'nH', 'dH'].map((nome) => interpretarCoeficientes(String(valores[nome] ?? '')));

  if ([nG, dG, nH, dH].some((item) => item === null)) {
    return { erro: 'Confira os coeficientes: use números separados por espaço, em ordem decrescente de $s$.' };
  }
  if ([nG, dG, nH, dH].some((item) => item.every((v) => v === 0))) {
    return { erro: 'Nenhum numerador ou denominador de $G(s)$ e $H(s)$ pode ser nulo.' };
  }

  const leitura = interpretarEspecificacaoDe(valores);
  if (leitura.erro) {
    return leitura;
  }
  const discretizacao = interpretarDiscretizacao(valores);
  if (discretizacao.erro) {
    return discretizacao;
  }

  return {
    entrada: {
      nG,
      dG,
      nH,
      dH,
      controlador: valores.controlador,
      especificacao: leitura.especificacao,
      discretizacao: discretizacao.discretizacao,
    },
  };
}

export function lerFormulario() {
  return interpretarFormulario(valoresDoFormulario());
}
