"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, WandSparkles, ArrowRight, Minus, ChevronDown, Check, AlertCircle } from "lucide-react";
import { FIELDS, type ParsedData, type Mapping } from "@/lib/import/data";

// ── Dropdown ────────────────────────────────────────────────────

interface Option { value: number; label: string; disabled?: boolean }

function Dropdown({ value, options, onChange, danger }: {
  value: number; options: Option[]; onChange: (v: number) => void; danger: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const current = options.find(o => o.value === value) ?? options[0];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8, textAlign: "left",
          padding: "8px 10px 8px 12px", fontSize: 13, fontFamily: "inherit", cursor: "pointer",
          border: `1px solid ${danger ? "var(--danger)" : open ? "var(--accent)" : value >= 0 ? "var(--border-strong)" : "var(--border)"}`,
          borderRadius: 8, background: danger ? "var(--danger-bg)" : "var(--surface)",
          color: (current?.value ?? -1) >= 0 ? "var(--fg)" : "var(--fg-4)",
          boxShadow: open ? "var(--ring-accent)" : "none",
          transition: "border-color var(--dur-fast)",
        }}
      >
        {(current?.value ?? -1) >= 0 && (
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)", flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.label ?? "— 不對應 —"}
        </span>
        <ChevronDown size={15} color="var(--fg-3)" />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
          boxShadow: "var(--shadow-lg)", padding: 4, maxHeight: 260, overflowY: "auto",
        }}>
          {options.map(o => {
            const sel = o.value === value;
            return (
              <button
                key={o.value} disabled={o.disabled}
                onClick={() => { if (!o.disabled) { onChange(o.value); setOpen(false); } }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                  padding: "8px 10px", fontSize: 13, fontFamily: "inherit", borderRadius: 6, border: "none",
                  cursor: o.disabled ? "not-allowed" : "pointer",
                  background: sel ? "var(--accent-subtle)" : "transparent",
                  color: o.disabled ? "var(--fg-4)" : sel ? "var(--accent)" : "var(--fg-2)",
                  fontWeight: sel ? 600 : 400, opacity: o.disabled ? 0.6 : 1,
                }}
              >
                <span style={{ flex: 1 }}>{o.label}</span>
                {o.disabled && <span style={{ fontSize: 11, color: "var(--fg-4)" }}>已用</span>}
                {sel && <Check size={14} color="var(--accent)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── main component ───────────────────────────────────────────────

export function MappingStep({ data, mapping, onChange, onAutoMap, aiAssist }: {
  data: ParsedData;
  mapping: Mapping;
  onChange: (key: string, col: number) => void;
  onAutoMap: () => void;
  aiAssist: boolean;
}) {
  const { headers, rows } = data;
  const mappedCount = FIELDS.filter(f => mapping[f.key] >= 0).length;
  const requiredMissing = FIELDS.filter(f => f.required && !(mapping[f.key] >= 0));

  const taken: Record<number, string> = {};
  FIELDS.forEach(f => { if (mapping[f.key] >= 0) taken[mapping[f.key]] = f.key; });

  const sampleFor = (col: number) => {
    if (col < 0) return [];
    const vals: string[] = [];
    for (let i = 0; i < rows.length && vals.length < 3; i++) {
      const v = (rows[i][col] ?? "").trim();
      if (v) vals.push(v);
    }
    return vals;
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>對應欄位</div>
        <div style={{ fontSize: 13.5, color: "var(--fg-3)", marginTop: 4 }}>
          把來源欄位對應到 Loopwise 的學員欄位
        </div>
      </div>

      {/* AI banner */}
      {aiAssist && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 12, background: "var(--accent-subtle)", border: "1px solid var(--violet-100)", marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={17} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg)" }}>
              已自動對應 {mappedCount} / {FIELDS.length} 個欄位
            </div>
            <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>
              根據欄位名稱與內容比對，下面可以手動調整
            </div>
          </div>
          <button
            onClick={onAutoMap}
            style={{ padding: "7px 13px", borderRadius: 8, border: "1px solid var(--violet-200)", background: "var(--surface)", color: "var(--accent)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <WandSparkles size={14} color="var(--accent)" />重新對應
          </button>
        </div>
      )}

      {/* mapping table */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 28px 1.1fr 1.2fr", gap: 14, padding: "10px 18px", background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 500, color: "var(--fg-3)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          <div>Loopwise 欄位</div><div /><div>來源欄位</div><div>範例值</div>
        </div>
        {FIELDS.map((f, i) => {
          const col = mapping[f.key] ?? -1;
          const mapped = col >= 0;
          const samples = sampleFor(col);
          const missing = f.required && !mapped;
          return (
            <div
              key={f.key}
              style={{ display: "grid", gridTemplateColumns: "1fr 28px 1.1fr 1.2fr", gap: 14, padding: "14px 18px", alignItems: "center", borderBottom: i < FIELDS.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
            >
              {/* target field */}
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                  {f.label}
                  {f.required && <span style={{ color: "var(--danger)", fontSize: 12 }}>*</span>}
                </div>
                {f.hint && <div style={{ fontSize: 11.5, color: "var(--fg-4)", marginTop: 2 }}>{f.hint}</div>}
              </div>
              {/* connector arrow */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                {mapped
                  ? <ArrowRight size={15} color="var(--accent)" />
                  : <Minus size={15} color="var(--border-strong)" />
                }
              </div>
              {/* source dropdown */}
              <Dropdown
                value={col}
                danger={missing}
                onChange={v => onChange(f.key, v)}
                options={[
                  { value: -1, label: "— 不對應 —" },
                  ...headers.map((h, ci) => ({
                    value: ci,
                    label: h || `欄 ${ci + 1}`,
                    disabled: taken[ci] !== undefined && taken[ci] !== f.key,
                  })),
                ]}
              />
              {/* sample values */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                {missing ? (
                  <span style={{ fontSize: 12, color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <AlertCircle size={13} color="var(--danger)" />必填，請選一個來源欄位
                  </span>
                ) : samples.length ? (
                  samples.slice(0, 2).map((s, k) => (
                    <span key={k} style={{ fontSize: 12, color: "var(--fg-3)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 12, color: "var(--fg-4)" }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {requiredMissing.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--danger)", background: "var(--danger-bg)", padding: "11px 14px", borderRadius: 8 }}>
          <AlertCircle size={15} color="var(--danger)" />
          還有 {requiredMissing.length} 個必填欄位未對應：{requiredMissing.map(f => f.label).join("、")}
        </div>
      )}
    </div>
  );
}
