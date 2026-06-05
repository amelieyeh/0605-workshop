"use client";

import { useState } from "react";
import { FileCheck, CheckCircle2, AlertTriangle, Rows3, ArrowRight, AlertCircle } from "lucide-react";
import { FIELDS, type ParsedData, type ValidationResult } from "@/lib/import/data";
import type { Mapping } from "@/lib/import/data";

export interface DecoratedMapping {
  byCol: Record<number, (typeof FIELDS)[0]>;
  idCol: number;
}

function StatPill({ Icon, tone, value, label }: {
  Icon: React.ElementType;
  tone: "success" | "warning" | "neutral";
  value: number;
  label: string;
}) {
  const [color, bg] = ({
    success: ["var(--success)", "var(--success-bg)"],
    warning: ["var(--warning)", "var(--warning-bg)"],
    neutral: ["var(--fg-3)",  "var(--bg-inset)"],
  } as const)[tone];
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={17} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

function MappedTag({ byCol, col }: { byCol: Record<number, (typeof FIELDS)[0]>; col: number }) {
  const field = byCol?.[col] ?? null;
  if (!field) return <span style={{ fontSize: 10.5, color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>未對應</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "var(--accent)", fontWeight: 500 }}>
      <ArrowRight size={11} color="var(--accent)" />
      {field.label}{field.required ? " *" : ""}
    </span>
  );
}

export function PreviewStep({ data, decorated, valid, dense }: {
  data: ParsedData;
  decorated: DecoratedMapping;
  valid: ValidationResult;
  dense: boolean;
}) {
  const [onlyErrors, setOnlyErrors] = useState(false);
  const { headers, rows } = data;
  const { byCol, idCol } = decorated;
  const cellPad = dense ? "7px 14px" : "11px 14px";
  const visibleIdx = rows.map((_, i) => i).filter(i => !onlyErrors || valid.rowIssues[i]);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>預覽與驗證</div>
        <div style={{ fontSize: 13.5, color: "var(--fg-3)", marginTop: 4, display: "flex", alignItems: "center", gap: 7 }}>
          <FileCheck size={15} color="var(--fg-3)" />
          {data.srcLabel} · {headers.length} 欄 · {rows.length} 列
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <StatPill Icon={CheckCircle2} tone="success" value={valid.okRows}    label="可匯入" />
        <StatPill Icon={AlertTriangle} tone="warning" value={valid.errorRows} label="需修正的列" />
        <StatPill Icon={Rows3}        tone="neutral" value={valid.total}     label="總列數" />
      </div>

      {valid.errorRows > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderRadius: 10, background: "var(--warning-bg)", marginBottom: 14, fontSize: 13, color: "#92660a" }}>
          <AlertTriangle size={16} color="var(--warning)" />
          <span style={{ flex: 1 }}>
            偵測到 <b>{valid.errorRows}</b> 列有問題，紅色標記是需要修正的儲存格。可以先匯入正常的列，稍後再處理。
          </span>
          <button
            onClick={() => setOnlyErrors(v => !v)}
            style={{
              padding: "6px 12px", borderRadius: 7,
              border: "1px solid rgba(146,102,10,0.3)",
              background: onlyErrors ? "#92660a" : "transparent",
              color: onlyErrors ? "#fff" : "#92660a",
              fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            {onlyErrors ? "顯示全部" : "只看問題列"}
          </button>
        </div>
      )}

      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13, minWidth: 720 }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)" }}>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--fg-3)", borderBottom: "1px solid var(--border)", width: 48, position: "sticky", top: 0, background: "var(--bg-subtle)" }}>
                  #
                </th>
                {headers.map((h, c) => (
                  <th key={c} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--fg-3)", whiteSpace: "nowrap", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg-subtle)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ color: "var(--fg-2)" }}>{h || <span style={{ color: "var(--fg-4)" }}>（無標題）</span>}</span>
                      <MappedTag byCol={byCol} col={c} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleIdx.map(r => {
                const bad = !!valid.rowIssues[r];
                return (
                  <tr key={r} style={{ borderTop: "1px solid var(--border-subtle)", background: bad ? "rgba(220,38,38,0.025)" : "transparent" }}>
                    <td style={{ padding: cellPad, textAlign: "center", color: bad ? "var(--danger)" : "var(--fg-4)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                      {bad ? <AlertCircle size={14} color="var(--danger)" /> : r + 1}
                    </td>
                    {headers.map((_, c) => {
                      const issue = valid.cellIssues[`${r}-${c}`];
                      const val = rows[r][c] ?? "";
                      return (
                        <td key={c} style={{ padding: cellPad, verticalAlign: "middle", maxWidth: 220, position: "relative" }} title={issue ?? ""}>
                          {issue ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--danger-bg)", color: "var(--danger)", padding: "2px 8px", borderRadius: 6, fontWeight: 500, maxWidth: "100%" }}>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {val || "（空白）"}
                              </span>
                            </span>
                          ) : (
                            <span style={{ color: c === idCol ? "var(--fg)" : "var(--fg-2)", fontFamily: /KK-|@|\d{4}-/.test(val) ? "var(--font-mono)" : "inherit" }}>
                              {val}
                            </span>
                          )}
                          {issue && (
                            <span style={{ position: "absolute", bottom: -1, left: 8, right: 8, height: 2, background: "var(--danger)", borderRadius: 2, opacity: 0.5 }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibleIdx.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
            沒有問題列 · 全部都能匯入 ✓
          </div>
        )}
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "var(--fg-4)" }}>
        顯示 {visibleIdx.length} / {rows.length} 列。錯誤的儲存格之後可在匯入後逐筆修正。
      </div>
    </div>
  );
}
