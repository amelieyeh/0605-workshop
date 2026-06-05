"use client";

import { useRef, useState, useMemo } from "react";
import { UploadCloud, AlertCircle, Download, RotateCcw } from "lucide-react";
import { parseCSV, detectHeaderRow } from "@/lib/import/data";
import * as XLSX from "xlsx";
import { detectMaskType, maskRows, toCSV, MASK_TYPE_LABELS, type MaskType } from "@/lib/deid/masker";

// ── upload ───────────────────────────────────────────────────────

function UploadZone({ onParsed }: {
  onParsed: (h: string[], r: string[][], name: string) => void;
}) {
  const [over, setOver] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const process = (file: File) => {
    setErr("");
    const isExcel = /\.xlsx?$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let headers: string[], rows: string[][];
        if (isExcel) {
          const wb = XLSX.read(e.target?.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
          // 去掉全空列，再偵測真正的表頭列（跳過橫幅／標題列）
          const cleaned = data
            .map(r => (r as string[]).map(String))
            .filter(r => r.some(c => c.trim() !== ""));
          if (!cleaned.length) { setErr("看起來是空的 Excel"); return; }
          const hi = detectHeaderRow(cleaned);
          headers = cleaned[hi].map(c => c.trim());
          rows = cleaned.slice(hi + 1);
        } else {
          const p = parseCSV(String(e.target?.result ?? ""));
          headers = p.headers; rows = p.rows;
        }
        if (!headers.length) { setErr("找不到標題列，請確認檔案格式"); return; }
        if (!rows.length)    { setErr("只有標題列，沒有資料"); return; }
        onParsed(headers, rows, file.name);
      } catch {
        setErr("檔案解析失敗，請確認是否為有效的 CSV 或 Excel 檔案");
      }
    };
    if (isExcel) reader.readAsArrayBuffer(file); else reader.readAsText(file, "utf-8");
  };

  return (
    <div style={{ maxWidth: 560, margin: "80px auto 0", textAlign: "center", fontFamily: "var(--font-sans)" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--fg)" }}>資料去識別化</div>
        <div style={{ fontSize: 14, color: "var(--fg-3)", marginTop: 8 }}>
          上傳 CSV 或 Excel，勾選要遮蔽的欄位，下載去識別化後的檔案
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) process(f); }}
        onClick={() => ref.current?.click()}
        style={{
          border: `1.5px dashed ${over ? "var(--accent)" : "var(--border-strong)"}`,
          background: over ? "var(--accent-subtle)" : "var(--bg-subtle)",
          borderRadius: 20, padding: "56px 40px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          cursor: "pointer",
          transition: "border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)",
        }}
      >
        <div style={{ width: 60, height: 60, borderRadius: 16, background: over ? "var(--accent)" : "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)", transform: over ? "translateY(-3px)" : "none", transition: "all var(--dur-base) var(--ease-out)" }}>
          <UploadCloud size={28} color={over ? "#fff" : "var(--accent)"} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>拖放檔案到這裡</div>
          <div style={{ fontSize: 13.5, color: "var(--fg-3)", marginTop: 4 }}>
            或 <span style={{ color: "var(--accent)", fontWeight: 500 }}>點擊選擇檔案</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>支援 .csv · .xlsx</div>
      </div>

      <input ref={ref} type="file" accept=".csv,.xlsx,.xls,text/csv" style={{ display: "none" }}
             onChange={e => { const f = e.target.files?.[0]; if (f) process(f); e.target.value = ""; }} />
      {err && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--danger)", background: "var(--danger-bg)", padding: "10px 14px", borderRadius: 8 }}>
          <AlertCircle size={15} color="var(--danger)" />{err}
        </div>
      )}
    </div>
  );
}

// ── table ────────────────────────────────────────────────────────
// Table lives inside a flex:1 overflow:auto container (set by parent),
// so sticky <th top:0> works and the native scrollbar stays at the
// exact bottom of the viewport at all times.

function DataTable({ headers, rows, checked, autoTypes, onToggle }: {
  headers: string[];
  rows: string[][];
  checked: Record<number, boolean>;
  autoTypes: Record<number, MaskType>;
  onToggle: (col: number) => void;
}) {
  const activeMasks = useMemo(() => {
    const m: Record<number, MaskType> = {};
    Object.entries(checked).forEach(([c, on]) => { if (on) m[Number(c)] = autoTypes[Number(c)] ?? "generic"; });
    return m;
  }, [checked, autoTypes]);

  const display = useMemo(() => maskRows(rows, activeMasks), [rows, activeMasks]);
  const PREVIEW = 300;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={TH}>#</th>
            {headers.map((h, c) => {
              const on = !!checked[c];
              const hint = autoTypes[c] ? MASK_TYPE_LABELS[autoTypes[c]] : "通用遮蔽";
              return (
                <th key={c} style={{ ...TH, minWidth: 130 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ color: "var(--fg-2)", fontWeight: 500, fontSize: 12 }}>{h}</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" }}>
                      <input
                        type="checkbox"
                        className="deid-checkbox"
                        checked={on}
                        onChange={() => onToggle(c)}
                      />
                      <span style={{ fontSize: 11.5, color: on ? "var(--accent)" : "var(--fg-4)", fontWeight: on ? 600 : 400 }}>
                        {on ? `遮蔽（${hint}）` : "不遮蔽"}
                      </span>
                    </label>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {display.slice(0, PREVIEW).map((row, r) => (
            <tr key={r} style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <td style={{ ...TD, color: "var(--fg-4)", fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "center", width: 48 }}>{r + 1}</td>
              {row.map((cell, c) => (
                <td key={c} style={{ ...TD, color: checked[c] ? "var(--accent)" : "var(--fg-2)", fontFamily: /KK-|@|\d{4}-/.test(cell) ? "var(--font-mono)" : "inherit" }}>
                  {cell !== "" ? cell : <span style={{ color: "var(--fg-4)" }}>—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > PREVIEW && (
        <div style={{ padding: "10px 16px", fontSize: 12, color: "var(--fg-4)", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-subtle)" }}>
          顯示前 {PREVIEW} 列，下載後包含全部 {rows.length} 列
        </div>
      )}
    </div>
  );
}

// sticky + bg so rows don't bleed through when scrolling vertically
const TH: React.CSSProperties = {
  padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500,
  color: "var(--fg-3)", borderBottom: "1px solid var(--border)", verticalAlign: "top",
  position: "sticky", top: 0, zIndex: 10, background: "var(--bg-subtle)",
};
const TD: React.CSSProperties = { padding: "9px 14px", verticalAlign: "middle", maxWidth: 240 };

// ── page ─────────────────────────────────────────────────────────

export default function DeidPage() {
  const [parsed, setParsed] = useState<{ headers: string[]; rows: string[][]; name: string } | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [autoTypes, setAutoTypes] = useState<Record<number, MaskType>>({});

  const handleParsed = (headers: string[], rows: string[][], name: string) => {
    const initChecked: Record<number, boolean> = {};
    const initTypes: Record<number, MaskType> = {};
    headers.forEach((h, i) => {
      initChecked[i] = false;
      const t = detectMaskType(h);
      if (t) initTypes[i] = t;
    });
    setParsed({ headers, rows, name });
    setChecked(initChecked);
    setAutoTypes(initTypes);
  };

  const toggleCol = (col: number) => setChecked(m => ({ ...m, [col]: !m[col] }));
  const activeCount = Object.values(checked).filter(Boolean).length;

  const handleDownload = () => {
    if (!parsed) return;
    const active: Record<number, MaskType> = {};
    Object.entries(checked).forEach(([c, on]) => {
      if (on) active[Number(c)] = autoTypes[Number(c)] ?? "generic";
    });
    const masked = maskRows(parsed.rows, active);
    const csv = toCSV(parsed.headers, masked);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = parsed.name.replace(/\.[^.]+$/, "") + "_deid.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!parsed) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-subtle)" }}>
        <UploadZone onParsed={handleParsed} />
      </div>
    );
  }

  return (
    // height:100vh + flex-column + overflow:hidden makes the table area fill
    // exactly the remaining screen space, so:
    //   1. <th position:sticky top:0> works (scrolling is inside this container)
    //   2. native horizontal scrollbar sits at the bottom of the viewport
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-subtle)", fontFamily: "var(--font-sans)", overflow: "hidden" }}>

      {/* top bar */}
      <div style={{ flexShrink: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>資料去識別化</div>
          <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 1 }}>
            {parsed.name} · {parsed.headers.length} 欄 · {parsed.rows.length} 列
            {activeCount > 0 && (
              <span style={{ color: "var(--accent)", marginLeft: 8, fontWeight: 500 }}>
                · 已勾選 {activeCount} 個欄位遮蔽
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={activeCount === 0}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 8, border: "none", background: activeCount > 0 ? "var(--accent)" : "var(--bg-inset)", color: activeCount > 0 ? "#fff" : "var(--fg-4)", fontSize: 13, fontWeight: 600, cursor: activeCount > 0 ? "pointer" : "not-allowed", fontFamily: "inherit" }}
        >
          <Download size={15} color={activeCount > 0 ? "#fff" : "var(--fg-4)"} />
          下載去識別化 CSV
        </button>

        <button
          onClick={() => { setParsed(null); setChecked({}); setAutoTypes({}); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--fg-3)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          title="重新上傳"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* hint */}
      <div style={{ flexShrink: 0, padding: "10px 24px 6px" }}>
        <div style={{ fontSize: 13, color: "var(--fg-3)" }}>
          勾選欄位標題下方的核取方塊即可套用遮蔽；未勾選的欄位維持原始資料。
        </div>
      </div>

      {/* table area — flex:1 fills remaining height; overflow:auto enables sticky header */}
      <div style={{ flex: 1, overflow: "auto", padding: "6px 24px 0" }}>
        <DataTable
          headers={parsed.headers}
          rows={parsed.rows}
          checked={checked}
          autoTypes={autoTypes}
          onToggle={toggleCol}
        />
      </div>
    </div>
  );
}
