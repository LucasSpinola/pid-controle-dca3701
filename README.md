<div align="center" markdown="1">

# PD, PI e PID pelo lugar das raízes

**Projeto de controladores pelo LGR com a conta inteira, passo a passo.**

### [Abrir a aplicação →](https://lucasspinola.github.io/pid-controle-dca3701/)

![Licença de código: MIT](https://img.shields.io/badge/c%C3%B3digo-MIT-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-f7df1e) ![Sem dependências](https://img.shields.io/badge/depend%C3%AAncias-nenhuma-brightgreen) ![Funciona offline](https://img.shields.io/badge/offline-sim-brightgreen)

**Lucas Augusto Spinola Pinto**<br>
DCA-3701 Projeto de Sistemas de Controle · 2ª unidade · DCA · UFRN

</div>

---

Informe $G(s)$, $H(s)$, o tipo de controlador e a especificação de malha fechada. A página encontra
os polos dominantes desejados, aplica o critério de ângulo para posicionar o zero do controlador e o
critério de módulo para achar o ganho, devolve $K_p$, $K_i$ e $K_d$ e confere o projeto na resposta
ao degrau simulada.

**[Os nove passos](#os-nove-passos)** · **[Rodar local](#rodar-local)** · **[Estrutura](#estrutura)** · **[Testes](#testes)**

## Destaques

| | |
|---|---|
| **PD, PI e PID** | o PID usa zeros reais e iguais, $G_c(s) = K_c (s+z)^2 / s$ |
| **Três formas de especificar** | $M_P$ e $t_s$ (2% ou 5%), $\zeta$ e $\omega_n$, ou os próprios polos desejados |
| **A conta, não só o resultado** | fórmula, substituição e resultado de cada passo, em LaTeX |
| **Projeto conferido** | polos de malha fechada, dominância e resposta ao degrau exata em espaço de estados |
| **Questões da lista** | cada questão do exercício preenche o formulário com um clique |
| **Link que reabre o projeto** | os campos vão para a barra de endereços |

## Os nove passos

| | Passo | O que aparece |
|---|---|---|
| 1 | Especificações | $\zeta$ a partir de $M_P$, $\zeta\omega_n$ a partir de $t_s$, e $\omega_d$ |
| 2 | Polos desejados | $s_d = -\sigma \pm j\omega_d$ sobre a reta de amortecimento |
| 3 | Malha aberta | $G(s)H(s)$, polos, zeros, cancelamentos e a forma de $G_c(s)$ |
| 4 | Critério de ângulo | contribuição de cada polo e zero em $s_d$ e a deficiência angular $\phi_c$ |
| 5 | Zero do controlador | $z = \sigma + \omega_d / \tan\phi_z$ |
| 6 | Critério de módulo | produto das distâncias e o ganho $K_c$ |
| 7 | Ganhos | $K_p$, $K_i$ e $K_d$ e o controlador nas formas fatorada e paralela |
| 8 | Malha fechada | $T(s)$, polos de malha fechada e a verificação de dominância |
| 9 | Resposta ao degrau | $M_P$, $t_p$ e $t_s$ simulados contra a referência de segunda ordem |

Depois dos passos vem o LGR do sistema compensado, com os polos de malha fechada no ganho projetado.
Quando o critério de ângulo não tem solução para o controlador escolhido, o roteiro para no passo 4 e
explica o motivo.

## Rodar local

A página usa módulos ES, então precisa ser servida por HTTP — abrir o `index.html` direto do disco
não funciona, o navegador bloqueia `import` em `file://`.

```bash
git clone https://github.com/LucasSpinola/pid-controle-dca3701.git
cd pid-controle-dca3701
npm start                    # ou: python -m http.server 8000
```

Depois abra <http://localhost:8000>.

**Como usar:** coeficientes em ordem decrescente de $s$, separados por espaço — `1 4 4 0` é
$s^3 + 4s^2 + 4s$. Escolha o controlador, a forma da especificação e clique em
**Projetar controlador**.

## Estrutura

```
index.html              página única da aplicação
assets/
├── css/estilo.css      interface, planos e folha de impressão
├── vendor/katex/       KaTeX embarcado, sem CDN
└── js/
    ├── principal.js    ponto de entrada e orquestração
    ├── nucleo/         complexos, polinômios, raízes e matrizes
    ├── projeto/        especificações, controladores, critérios, malha fechada e degrau
    ├── formatacao/     números, controladores e conversão para LaTeX
    ├── grafico/        janela, plano SVG e camadas de desenho
    └── interface/      apresentação, formulário, questões da lista e os passos
testes/                 três suítes em Node puro
```

A direção de dependência é fixa: `nucleo` não conhece ninguém, `projeto` usa `nucleo`, `grafico` e
`formatacao` só traduzem resultados, e `interface` é a única camada que toca o DOM. Um controlador
novo entra como mais uma entrada em `projeto/controladores.js`, e as questões de outra lista entram
em `interface/exercicios.js`.

## Testes

```bash
npm run teste
```

`executar.js` cobre especificações, critérios de ângulo e de módulo, a simulação do degrau e as quatro
questões do 1º exercício. `raizes.js` planta raízes de grau 2 a 8 e confere se o solver as reencontra.
`interface.js` renderiza os passos sobre um DOM falso, caçando exceção, `undefined` e `NaN`.

## Publicação

Site estático puro. Em **Settings › Pages**, escolha **Deploy from a branch**, `main` e `/ (root)`.
O `.nojekyll` na raiz impede o Jekyll de mexer nos arquivos.

## Licença

Código sob licença MIT, em [LICENSE](LICENSE). As marcas da UFRN e do DCA em `assets/img/`
pertencem às respectivas instituições e aparecem apenas para identificar a disciplina.
