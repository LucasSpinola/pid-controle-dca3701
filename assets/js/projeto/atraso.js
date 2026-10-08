import * as P from '../nucleo/polinomio.js';
import * as C from '../nucleo/complexo.js';
import { raizes, ordenarParaExibicao } from '../nucleo/raizes.js';
import { montarMalhaAberta } from './malhaAberta.js';
import { constantesDeErro } from './erroEstatico.js';
import { simularDegrau, medirResposta, valorFinal } from './respostaDegrau.js';

const AMOSTRAS_NA_RETA = 4000;
const PASSOS_DE_BISSECAO = 80;
const JANELA_EM_CONSTANTES = 12;

export const SIMBOLOS_DE_CONSTANTE = ['K_p', 'K_v', 'K_a'];

function erroDeFase(numerador, denominador, ponto, alvo) {
  const valor = C.dividir(P.avaliarComplexo(numerador, ponto), P.avaliarComplexo(denominador, ponto));
  const fase = C.argumentoGraus(valor) - alvo;
  return ((fase % 360) + 540) % 360 - 180;
}

export function ganhoNaRetaDeAmortecimento(numerador, denominador, zeta) {
  const malha = montarMalhaAberta(numerador, [1], [1], denominador);
  const alvo = malha.ganho < 0 ? 0 : 180;
  const direcao = { re: -zeta, im: Math.sqrt(1 - zeta ** 2) };
  const raio = Math.max(1, ...[...malha.polos, ...malha.zeros].map((p) => C.modulo(p)));
  const minimo = raio * 1e-4;
  const maximo = raio * 50;
  const ponto = (r) => C.escalar(direcao, r);
  const erro = (r) => erroDeFase(malha.numerador, malha.denominador, ponto(r), alvo);

  let anterior = minimo;
  let erroAnterior = erro(anterior);
  for (let i = 1; i <= AMOSTRAS_NA_RETA; i += 1) {
    const atual = minimo * (maximo / minimo) ** (i / AMOSTRAS_NA_RETA);
    const erroAtual = erro(atual);
    if (Math.sign(erroAtual) !== Math.sign(erroAnterior) && Math.abs(erroAtual) < 90 && Math.abs(erroAnterior) < 90) {
      let baixo = anterior;
      let alto = atual;
      for (let k = 0; k < PASSOS_DE_BISSECAO; k += 1) {
        const meio = (baixo + alto) / 2;
        if (Math.sign(erro(meio)) === Math.sign(erro(baixo))) {
          baixo = meio;
        } else {
          alto = meio;
        }
      }
      const s1 = ponto((baixo + alto) / 2);
      const modulo = C.modulo(C.dividir(P.avaliarComplexo(malha.numerador, s1), P.avaliarComplexo(malha.denominador, s1)));
      return { ponto: s1, ganho: 1 / modulo, omegaN: (baixo + alto) / 2 };
    }
    anterior = atual;
    erroAnterior = erroAtual;
  }
  return null;
}

export function malhaFechadaCom(numeradorControlador, denominadorControlador, entrada) {
  const { nG, dG, nH, dH } = entrada;
  const numeradorDireto = P.multiplicar(numeradorControlador, nG);
  const numeradorAberto = P.multiplicar(numeradorDireto, nH);
  const denominadorAberto = P.multiplicar(P.multiplicar(denominadorControlador, dG), dH);
  const caracteristica = P.normalizar(P.somar(denominadorAberto, numeradorAberto));
  const numerador = P.normalizar(P.multiplicar(numeradorDireto, dH));
  return {
    numeradorControlador,
    denominadorControlador,
    numeradorAberto: P.normalizar(numeradorAberto),
    denominadorAberto: P.normalizar(denominadorAberto),
    numerador,
    caracteristica,
    polos: ordenarParaExibicao(raizes(caracteristica)),
    zeros: ordenarParaExibicao(raizes(numerador)),
  };
}

export function poloDominante(polos) {
  const complexos = polos.filter((p) => p.im > 1e-9);
  const candidatos = complexos.length > 0 ? complexos : polos;
  return candidatos.reduce((melhor, p) => (Math.abs(p.re) < Math.abs(melhor.re) ? p : melhor), candidatos[0]);
}

export function constanteDoTipo(erro) {
  return [erro.kp, erro.kv, erro.ka][erro.tipo];
}

export function parteEmAtraso(numeradorBase, denominadorBase, constanteDesejada, zero, ponto) {
  const erro = constantesDeErro(numeradorBase, denominadorBase);
  if (erro.tipo > 2) {
    throw new Error('o sistema é de tipo maior que 2; as constantes K_p, K_v e K_a não se aplicam.');
  }
  const atual = constanteDoTipo(erro);
  const beta = constanteDesejada / atual;
  const polo = zero / beta;
  const fatorNoPonto = C.dividir(C.somar(ponto, C.complexo(zero)), C.somar(ponto, C.complexo(polo)));
  return {
    tipo: erro.tipo,
    simbolo: SIMBOLOS_DE_CONSTANTE[erro.tipo],
    atual,
    desejada: constanteDesejada,
    beta,
    zero,
    polo,
    angulo: C.argumentoGraus(fatorNoPonto),
    modulo: C.modulo(fatorNoPonto),
    necessario: beta > 1,
  };
}

function responder(malha, duracao) {
  const estavel = malha.polos.every((p) => p.re < -1e-9);
  if (!estavel) {
    return null;
  }
  const simulacao = simularDegrau(malha.numerador, malha.caracteristica, duracao);
  return { simulacao, metricas: medirResposta(simulacao, valorFinal(malha.numerador, malha.caracteristica)) };
}

export function projetarAtraso(entrada) {
  const { nG, dG, nH, dH, atraso } = entrada;
  const numeradorGH = P.multiplicar(nG, nH);
  const denominadorGH = P.multiplicar(dG, dH);

  let ganho = 1;
  let ajuste = null;
  if (atraso.zeta !== null) {
    ajuste = ganhoNaRetaDeAmortecimento(numeradorGH, denominadorGH, atraso.zeta);
    if (!ajuste) {
      throw new Error(`o LGR de G(s)H(s) não cruza a reta de ζ = ${atraso.zeta}.`);
    }
    ganho = ajuste.ganho;
  }

  const original = malhaFechadaCom([ganho], [1], entrada);
  const dominante = ajuste ? ajuste.ponto : poloDominante(original.polos);
  const parte = parteEmAtraso(P.escalar(numeradorGH, ganho), denominadorGH, atraso.constante, atraso.zero, dominante);
  const compensada = malhaFechadaCom(P.escalar([1, parte.zero], ganho), [1, parte.polo], entrada);
  const duracao = Math.min(JANELA_EM_CONSTANTES / Math.max(Math.abs(dominante.re), 1e-6), 400);

  return {
    tipo: 'atraso',
    entrada,
    malhaAberta: montarMalhaAberta(nG, dG, nH, dH),
    ganho,
    ajuste,
    dominante,
    parte,
    original: { ...original, resposta: responder(original, duracao) },
    compensada: { ...compensada, resposta: responder(compensada, duracao) },
    novoDominante: poloDominante(compensada.polos.filter((p) => C.distancia(p, C.complexo(-parte.polo)) > 1e-6 * Math.max(1, parte.zero))),
    constanteFinal: constanteDoTipo(constantesDeErro(compensada.numeradorAberto, compensada.denominadorAberto)),
    viavel: true,
  };
}
