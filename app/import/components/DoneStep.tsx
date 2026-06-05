"use client";

import { useEffect, useState } from "react";
import { Check, UserPlus, RefreshCw, AlertTriangle, UsersRound, FileDown } from "lucide-react";
import type { ParsedData, ValidationResult } from "@/lib/import/data";

function ResultCard({ n, label, Icon, tone }: {
  n: number; label: string; Icon: React.ElementType;
  tone: "success" | "accent" | "warning";
}) {
  const color = ({ success: "var(--success)", accent: "var(--accent)", warning: "var(--warning)" } as const)[tone];
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 16, background: "var(--surface)", textAlign: "left" }}>
      <Icon size={17} color={color} />
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums", marginTop: 10 }}>{n}</div>
      <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

export function DoneStep({ data, valid, onRestart, onLearners }: {
  data: ParsedData;
  valid: ValidationResult;
  onRestart: () => void;
  onLearners: () => void;
}) {
  const [phase, setPhase] = useState<"importing" | "done">("importing");
  const [pct, setPct] = useState(0);

  const added   = Math.max(0, valid.okRows - 3);
  const updated = Math.min(3, valid.okRows);
  const skipped = valid.errorRows;

  useEffect(() => {
    const dur = 1600, t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      setPct(Math.round(p * 100));
      if (p >= 1) { clearInterval(id); setTimeout(() => setPhase("done"), 250); }
    }, 60);
    return () => clearInterval(id);
  }, []);

  if (phase === "importing") {
    return (
      <div style={{ maxWidth: 520, margin: "60px auto 0", textAlign: "center" }}>
        <div style={{ display: "inline-flex", marginBottom: 26 }}>
          <span className="lw-pulse" style={{ display: "block", width: 14, height: 14, borderRadius: 999, background: "var(--accent)" }} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 8 }}>
          正在匯入 {valid.okRows} 位學員…
        </div>
        <div style={{ fontSize: 13.5, color: "var(--fg-3)", marginBottom: 28 }}>
          建立帳號、寫入部門與彙報關係
        </div>
        <div style={{ height: 6, background: "var(--bg-inset)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 999, transition: "width 80ms linear" }} />
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>{pct}%</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "32px auto 0", textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: 999, background: "var(--success-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Check size={30} color="var(--success)" />
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}>匯入完成</div>
      <div style={{ fontSize: 14, color: "var(--fg-3)", marginBottom: 28 }}>來源 · {data.srcLabel}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 22, textAlign: "left" }}>
        <ResultCard n={added}   label="新增學員"   Icon={UserPlus}      tone="success" />
        <ResultCard n={updated} label="更新資料"   Icon={RefreshCw}     tone="accent" />
        <ResultCard n={skipped} label="略過（有錯）" Icon={AlertTriangle} tone="warning" />
      </div>

      {skipped > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "var(--bg-subtle)", border: "1px solid var(--border)", textAlign: "left", marginBottom: 24 }}>
          <FileDown size={17} color="var(--fg-3)" />
          <div style={{ flex: 1, fontSize: 13, color: "var(--fg-2)" }}>有 {skipped} 列因格式問題被略過</div>
          <button style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--fg-2)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            下載問題列
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button
          onClick={onLearners}
          style={{ padding: "11px 20px", borderRadius: 9, border: "none", background: "var(--ink-900)", color: "#fff", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7 }}
        >
          <UsersRound size={15} color="#fff" />查看學員列表
        </button>
        <button
          onClick={onRestart}
          style={{ padding: "11px 20px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--fg-2)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
        >
          再匯入一批
        </button>
      </div>
    </div>
  );
}
