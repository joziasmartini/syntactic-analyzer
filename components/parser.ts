/**
 * Analisador Sintático (SLR/LALR Parser) - Projeto 2 (Construção de Compiladores)
 * 
 * Mapeia os tokens produzidos pelo Analisador Léxico (Projeto 1) usando uma
 * tabela de parsing SLR/LALR para reconhecer a Gramática Livre de Contexto (GLC).
 */

import { analisarLexicamente, type Estado as EstadoLexico, type ItemTabelaSimbolos } from './Lexer';

// 1. DEFINIÇÃO DA GRAMÁTICA LIVRE DE CONTEXTO (GLC)
// 0: S' -> S
// 1: S  -> KW_SE CMD KW_FIM
// 2: CMD -> ID OP_ATRIB EXP PONT_PV
// 3: EXP -> ID OP_SOMA NUM
// 4: EXP -> NUM
export interface RegraProducao {
  id: number;
  naoTerminal: string;
  producao: string[];
  tamanho: number;
}

export const REGRAS_GRAMATICA: RegraProducao[] = [
  { id: 0, naoTerminal: "S'", producao: ['S'], tamanho: 1 },
  { id: 1, naoTerminal: 'S', producao: ['KW_SE', 'CMD', 'KW_FIM'], tamanho: 3 },
  { id: 2, naoTerminal: 'CMD', producao: ['ID', 'OP_ATRIB', 'EXP', 'PONT_PV'], tamanho: 4 },
  { id: 3, naoTerminal: 'EXP', producao: ['ID', 'OP_SOMA', 'NUM'], tamanho: 3 },
  { id: 4, naoTerminal: 'EXP', producao: ['NUM'], tamanho: 1 },
];

// 2. TIPOS E ESTRUTURAS DA TABELA DE PARSING SLR
export type AcaoTipo = 'shift' | 'reduce' | 'accept' | 'error';

export interface AcaoParsing {
  tipo: AcaoTipo;
  estadoOuRegra?: number; // Número do próximo Estado (shift) ou ID da Regra (reduce)
}

// Representação de uma linha da tabela SLR: Ações para Terminais + Desvios (Goto) para Não-Terminais
export type TabelaSLR = Record<
  number,
  {
    acoes: Record<string, AcaoParsing>;
    goto: Record<string, number>;
  }
>;

// Tabela de Parsing SLR pré-computada para a linguagem
export const TABELA_SLR: TabelaSLR = {
  0: {
    acoes: { KW_SE: { tipo: 'shift', estadoOuRegra: 2 } },
    goto: { S: 1 },
  },
  1: {
    acoes: { $: { tipo: 'accept' } },
    goto: {},
  },
  2: {
    acoes: { ID: { tipo: 'shift', estadoOuRegra: 4 } },
    goto: { CMD: 3 },
  },
  3: {
    acoes: { KW_FIM: { tipo: 'shift', estadoOuRegra: 5 } },
    goto: {},
  },
  4: {
    acoes: { OP_ATRIB: { tipo: 'shift', estadoOuRegra: 6 } },
    goto: {},
  },
  5: {
    acoes: { $: { tipo: 'reduce', estadoOuRegra: 1 } },
    goto: {},
  },
  6: {
    acoes: {
      ID: { tipo: 'shift', estadoOuRegra: 8 },
      NUM: { tipo: 'shift', estadoOuRegra: 9 },
    },
    goto: { EXP: 7 },
  },
  7: {
    acoes: { PONT_PV: { tipo: 'shift', estadoOuRegra: 10 } },
    goto: {},
  },
  8: {
    acoes: { OP_SOMA: { tipo: 'shift', estadoOuRegra: 11 } },
    goto: {},
  },
  9: {
    acoes: { PONT_PV: { tipo: 'reduce', estadoOuRegra: 4 } },
    goto: {},
  },
  10: {
    acoes: { KW_FIM: { tipo: 'reduce', estadoOuRegra: 2 } },
    goto: {},
  },
  11: {
    acoes: { NUM: { tipo: 'shift', estadoOuRegra: 12 } },
    goto: {},
  },
  12: {
    acoes: { PONT_PV: { tipo: 'reduce', estadoOuRegra: 3 } },
    goto: {},
  },
};

// 3. ESTRUTURA DOS PASSO A PASSO DA PILHA (PARA VISUALIZAÇÃO NO COMPONENTE)
export interface PassoParsing {
  passo: number;
  pilhaEstados: number[];
  pilhaSimbolos: string[];
  fitaRestante: string[];
  acaoExecutada: string;
}

export interface ResultadoAnaliseSintatica {
  aceito: boolean;
  fitaEntrada: string[];
  tabelaSimbolos: ItemTabelaSimbolos[];
  passosParsing: PassoParsing[];
  errosSintaticos: string[];
  errosLexicos: string[];
}

// 4. ALGORITMO PRINCIPAL DE PARSING SLR
export function analisarSintaticamente(codigoFonte: string): ResultadoAnaliseSintatica {
  // Passo 1: Executa o analisador léxico
  const resultadoLexico = analisarLexicamente(codigoFonte);

  // Obtém os tokens da fita de saída e adiciona o cifrão '$'
  const fitaTokens = resultadoLexico.fitaSaida
    .replace(/^FITA:\s*/, '')
    .replace(/\s*\$$/, '')
    .split(' ')
    .filter(Boolean);

  // Se a fita possuir erros léxicos graves ('X'), filtramos ou marcamos
  const fitaEntrada = [...fitaTokens, '$'];

  const pilhaEstados: number[] = [0];
  const pilhaSimbolos: string[] = ['$'];
  const passosParsing: PassoParsing[] = [];
  const errosSintaticos: string[] = [];

  let ponteiroFita = 0;
  let numeroPasso = 1;
  let aceito = false;

  // Interrompe se houver erros léxicos
  if (resultadoLexico.erros.length > 0) {
    return {
      aceito: false,
      fitaEntrada,
      tabelaSimbolos: resultadoLexico.tabelaSimbolos,
      passosParsing: [],
      errosSintaticos: ['Análise sintática cancelada devido a erros léxicos no código-fonte.'],
      errosLexicos: resultadoLexico.erros,
    };
  }

  // Loop de execução do Maapeamento da Tabela SLR
  while (ponteiroFita < fitaEntrada.length) {
    const estadoAtual = pilhaEstados[pilhaEstados.length - 1];
    const tokenAtual = fitaEntrada[ponteiroFita];

    const fitaRestanteStr = fitaEntrada.slice(ponteiroFita);
    const entradaTabela = TABELA_SLR[estadoAtual];
    const acao = entradaTabela?.acoes[tokenAtual];

    if (!acao) {
      // Trata erro de parsing
      const tokensEsperados = entradaTabela ? Object.keys(entradaTabela.acoes).join(', ') : 'nenhum';
      const itemSimbolo = resultadoLexico.tabelaSimbolos[ponteiroFita];
      const linhaErro = itemSimbolo ? itemSimbolo.linha : 'desconhecida';

      errosSintaticos.push(
        `Erro Sintático na linha ${linhaErro}: token inesperado '${tokenAtual}'. Esperado um dos seguintes: [${tokensEsperados}]`
      );

      passosParsing.push({
        passo: numeroPasso,
        pilhaEstados: [...pilhaEstados],
        pilhaSimbolos: [...pilhaSimbolos],
        fitaRestante: fitaRestanteStr,
        acaoExecutada: `ERRO (Sintaxe inválida no token '${tokenAtual}')`,
      });
      break;
    }

    if (acao.tipo === 'shift') {
      const proximoEstado = acao.estadoOuRegra!;
      passosParsing.push({
        passo: numeroPasso++,
        pilhaEstados: [...pilhaEstados],
        pilhaSimbolos: [...pilhaSimbolos],
        fitaRestante: fitaRestanteStr,
        acaoExecutada: `Empilhar (Shift) ${proximoEstado} com símbolo '${tokenAtual}'`,
      });

      pilhaEstados.push(proximoEstado);
      pilhaSimbolos.push(tokenAtual);
      ponteiroFita++;
    } else if (acao.tipo === 'reduce') {
      const regraId = acao.estadoOuRegra!;
      const regra = REGRAS_GRAMATICA.find((r) => r.id === regraId)!;

      passosParsing.push({
        passo: numeroPasso++,
        pilhaEstados: [...pilhaEstados],
        pilhaSimbolos: [...pilhaSimbolos],
        fitaRestante: fitaRestanteStr,
        acaoExecutada: `Reduzir (Reduce) regra ${regra.id}: ${regra.naoTerminal} -> ${regra.producao.join(' ')}`,
      });

      // Desempilha 'tamanho da produção' elementos
      for (let i = 0; i < regra.tamanho; i++) {
        pilhaEstados.pop();
        pilhaSimbolos.pop();
      }

      // Aplica o salto (Goto)
      const estadoTopo = pilhaEstados[pilhaEstados.length - 1];
      const proximoEstadoGoto = TABELA_SLR[estadoTopo]?.goto[regra.naoTerminal];

      if (proximoEstadoGoto === undefined) {
        errosSintaticos.push(`Erro Interno no Parsing: Falha no Salto (Goto) para o Não-Terminal '${regra.naoTerminal}'.`);
        break;
      }

      pilhaSimbolos.push(regra.naoTerminal);
      pilhaEstados.push(proximoEstadoGoto);
    } else if (acao.tipo === 'accept') {
      passosParsing.push({
        passo: numeroPasso++,
        pilhaEstados: [...pilhaEstados],
        pilhaSimbolos: [...pilhaSimbolos],
        fitaRestante: fitaRestanteStr,
        acaoExecutada: 'ACEITO (Sentença Válida)',
      });
      aceito = true;
      break;
    }
  }

  return {
    aceito,
    fitaEntrada,
    tabelaSimbolos: resultadoLexico.tabelaSimbolos,
    passosParsing,
    errosSintaticos,
    errosLexicos: resultadoLexico.erros,
  };
}
