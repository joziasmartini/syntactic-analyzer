"use client";

import { useMemo, useState } from "react";
import {
  analisarSintaticamente,
  REGRAS_GRAMATICA,
  TABELA_SLR,
} from "@/components/parser";

const CODIGO_EXEMPLO_CORRETO = `se x = 10 ;
fim`;

const CODIGO_EXEMPLO_ERRO = `se x = + 10 ;
fim`;

export default function Home() {
  const [codigo, setCodigo] = useState(CODIGO_EXEMPLO_CORRETO);

  const resultado = useMemo(() => analisarSintaticamente(codigo), [codigo]);

  const fitaTokens = useMemo(
    () =>
      resultado.fitaEntrada.filter((t) => t !== "$"),
    [resultado.fitaEntrada]
  );

  const linhasCodigo = codigo.split("\n").length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        {/* Header */}
        <header className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
            Compiladores · Projeto 2 · Analisador Sintático SLR
          </span>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Analisador Sintático (Parser SLR)
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-500">
            Realiza o reconhecimento sintático com base na fita de saída do analisador léxico,
            aplicando o algoritmo de deslocamento/redução (Shift-Reduce) via Tabela SLR/LALR.
          </p>
        </header>

        {/* Editor de Código */}
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-xs text-zinc-500">
                parser.ts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-xs text-zinc-500 sm:inline">
                {linhasCodigo} linhas · {codigo.length} caracteres
              </span>
              <button
                onClick={() => setCodigo("")}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                Limpar
              </button>
              <button
                onClick={() => setCodigo(CODIGO_EXEMPLO_ERRO)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                Exemplo com Erro
              </button>
              <button
                onClick={() => setCodigo(CODIGO_EXEMPLO_CORRETO)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                Restaurar Exemplo
              </button>
            </div>
          </div>
          <textarea
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            placeholder="Escreva seu código-fonte aqui..."
            className="block w-full resize-y bg-transparent px-4 py-4 font-mono text-sm leading-7 text-zinc-800 caret-violet-600 outline-none placeholder:text-zinc-400"
            rows={6}
          />
        </section>

        {/* Estatísticas / Status do Parsing */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Status Sintático",
              valor: resultado.aceito ? "Aceito" : "Rejeitado",
              cor: resultado.aceito ? "text-emerald-600" : "text-red-600",
              icone: resultado.aceito ? "✓" : "✕",
            },
            {
              label: "Passos de Parsing",
              valor: resultado.passosParsing.length,
              cor: "text-violet-600",
              icone: "⚙",
            },
            {
              label: "Erros Encontrados",
              valor: resultado.errosSintaticos.length + resultado.errosLexicos.length,
              cor:
                resultado.errosSintaticos.length + resultado.errosLexicos.length > 0
                  ? "text-red-600"
                  : "text-zinc-400",
              icone: "!",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-lg ${stat.cor}`}
              >
                {stat.icone}
              </span>
              <div className="flex flex-col">
                <span className="text-2xl font-semibold tabular-nums text-zinc-900">
                  {stat.valor}
                </span>
                <span className="text-xs text-zinc-500">{stat.label}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Fita de Entrada para a Análise Sintática */}
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-700">
              Fita de Entrada (Saída do Léxico)
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Cadeia de tokens repassada para o reconhecedor sintático
            </p>
          </div>
          <div className="px-5 py-5">
            <div className="flex flex-wrap items-center gap-2">
              {fitaTokens.length === 0 && (
                <span className="font-mono text-xs text-zinc-400">
                  (sem tokens, aguardando entrada)
                </span>
              )}
              {fitaTokens.map((token, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md bg-violet-50 px-2.5 py-1 font-mono text-xs font-semibold text-violet-700 ring-1 ring-violet-200"
                >
                  {token}
                </span>
              ))}
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 font-mono text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200">
                $
              </span>
            </div>
          </div>
        </section>

        {/* Regras da Gramática Livre de Contexto (GLC) */}
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-700">
              Regras da Gramática (GLC)
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Conjunto de produções da linguagem hipotética
            </p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-zinc-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="p-4 font-mono text-xs text-zinc-700 space-y-1">
              {REGRAS_GRAMATICA.map((r) => (
                <div key={r.id}>
                  <span className="text-zinc-400">({r.id})</span>{" "}
                  <span className="font-semibold text-violet-700">{r.naoTerminal}</span>{" "}
                  → {r.producao.join(" ")}
                </div>
              ))}
            </div>
            <div className="p-4 text-xs text-zinc-500 space-y-1">
              <p className="font-semibold text-zinc-700">Terminais:</p>
              <p className="font-mono">KW_SE, KW_FIM, ID, OP_ATRIB, OP_SOMA, NUM, PONT_PV</p>
              <p className="font-semibold text-zinc-700 mt-2">Não-Terminais:</p>
              <p className="font-mono">S', S, CMD, EXP</p>
            </div>
          </div>
        </section>

        {/* Passo a Passo do Parsing (Execução do Algoritmo SLR) */}
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-700">
              Execução do Parsing (Pilha de Reconhecimento)
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Histórico das operações de Shift e Reduce efetuadas pelo algoritmo
            </p>
          </div>
          {resultado.passosParsing.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
              Nenhuma etapa executada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-5 py-3 font-medium">Passo</th>
                    <th className="px-5 py-3 font-medium">Pilha de Estados</th>
                    <th className="px-5 py-3 font-medium">Pilha de Símbolos</th>
                    <th className="px-5 py-3 font-medium">Entrada Restante</th>
                    <th className="px-5 py-3 font-medium">Ação Executada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {resultado.passosParsing.map((passo) => (
                    <tr
                      key={passo.passo}
                      className="transition-colors hover:bg-zinc-50"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                        {String(passo.passo).padStart(2, "0")}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-violet-700">
                        [{passo.pilhaEstados.join(", ")}]
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-sky-700">
                        {passo.pilhaSimbolos.join(" ")}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-zinc-600">
                        {passo.fitaRestante.join(" ")}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-zinc-800">
                        {passo.acaoExecutada}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Erros Sintáticos e Léxicos */}
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-700">
              Erros Sintáticos / Léxicos
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Mensagens tratadas do reconhecedor
            </p>
          </div>
          {resultado.errosSintaticos.length === 0 &&
          resultado.errosLexicos.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-6">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                ✓
              </span>
              <span className="text-sm text-zinc-500">
                Nenhum erro sintático ou léxico detectado. A frase foi aceita pela linguagem!
              </span>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {[...resultado.errosLexicos, ...resultado.errosSintaticos].map(
                (erro, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 px-5 py-3.5 text-sm text-red-700"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-200">
                      !
                    </span>
                    <span className="font-mono text-[13px] leading-5">
                      {erro}
                    </span>
                  </li>
                )
              )}
            </ul>
          )}
        </section>

        <footer className="border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400">
          Desenvolvido por Jozias Martini
        </footer>
      </div>
    </div>
  );
}
