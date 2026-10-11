/**
 * Analisador Léxico (Scanner) - Projeto 1 (Construção de Compiladores)
 *
 * Percorre o código-fonte caractere a caractere, reconhecendo os tokens da
 * linguagem e montando a fita de saída consumida pelo Analisador Sintático.
 */

// 1. ESTADOS DO AUTÔMATO FINITO DO ANALISADOR LÉXICO
export type Estado =
  | 'q0'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'q5'
  | 'q6'
  | 'q7'
  | 'q8';

// 2. ESTRUTURAS DE DADOS
export interface ItemTabelaSimbolos {
  token: string;
  lexema: string;
  linha: number;
}

export interface ResultadoLexico {
  fitaSaida: string;
  tabelaSimbolos: ItemTabelaSimbolos[];
  erros: string[];
}

// 3. TABELA DE PALAVRAS RESERVADAS / SÍMBOLOS
const PALAVRAS_RESERVADAS: Record<string, string> = {
  se: 'KW_SE',
  fim: 'KW_FIM',
};

const SIMBOLOS: Record<string, string> = {
  '=': 'OP_ATRIB',
  '+': 'OP_SOMA',
  ';': 'PONT_PV',
};

// 4. ALGORITMO PRINCIPAL DE ANÁLISE LÉXICA
export function analisarLexicamente(codigoFonte: string): ResultadoLexico {
  const tabelaSimbolos: ItemTabelaSimbolos[] = [];
  const erros: string[] = [];

  let estado: Estado = 'q0';
  let linha = 1;
  let buffer = '';
  let i = 0;

  const emitir = (token: string, lexema: string) => {
    tabelaSimbolos.push({ token, lexema, linha });
  };

  while (i < codigoFonte.length) {
    const caractere = codigoFonte[i];

    switch (estado) {
      case 'q0': {
        if (caractere === '\n') {
          linha++;
        } else if (/[ \t\r]/.test(caractere)) {
          // Ignora espaços em branco
        } else if (/[a-zA-Z_]/.test(caractere)) {
          buffer = caractere;
          estado = 'q1';
        } else if (/[0-9]/.test(caractere)) {
          buffer = caractere;
          estado = 'q2';
        } else if (SIMBOLOS[caractere]) {
          emitir(SIMBOLOS[caractere], caractere);
        } else {
          erros.push(
            `Erro Léxico na linha ${linha}: caractere inválido '${caractere}'.`
          );
        }
        break;
      }

      case 'q1': {
        if (/[a-zA-Z0-9_]/.test(caractere)) {
          buffer += caractere;
        } else {
          const token = PALAVRAS_RESERVADAS[buffer] ?? 'ID';
          emitir(token, buffer);
          estado = 'q0';
          continue;
        }
        break;
      }

      case 'q2': {
        if (/[0-9]/.test(caractere)) {
          buffer += caractere;
        } else {
          emitir('NUM', buffer);
          estado = 'q0';
          continue;
        }
        break;
      }

      default:
        estado = 'q0';
        break;
    }

    i++;
  }

  if (estado === 'q1') {
    const token = PALAVRAS_RESERVADAS[buffer] ?? 'ID';
    emitir(token, buffer);
  } else if (estado === 'q2') {
    emitir('NUM', buffer);
  }

  const fitaSaida =
    'FITA: ' +
    tabelaSimbolos.map((item) => item.token).join(' ') +
    (tabelaSimbolos.length > 0 ? ' $' : '$');

  return { fitaSaida, tabelaSimbolos, erros };
}
