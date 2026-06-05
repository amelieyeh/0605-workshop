"use client";

import { useRef, useState } from "react";
import {
  UploadCloud, Link, Clipboard, FileSpreadsheet,
  Info, Sparkles, AlertCircle, CheckCircle2,
} from "lucide-react";
import { parseCSV, parseTable, SAMPLE_CSV, type ParsedData } from "@/lib/import/data";

const SOURCES = [
  { k: "csv",   label: "CSV 檔",       Icon: FileSpreadsheet, sub: "拖拉或選擇 .csv" },
  { k: "sheet", label: "Google Sheet", Icon: Link,            sub: "貼上分享連結" },
  { k: "excel", label: "Excel",        Icon: FileSpreadsheet, sub: ".xlsx 工作表" },
  { k: "paste", label: "直接貼上",     Icon: Clipboard,       sub: "從表格複製貼上" },
];

const VARIANTS = [
  { k: "A", label: "經典拖放" },
  { k: "B", label: "來源卡片" },
  { k: "C", label: "分割貼上" },
];

function useUploadLogic(onLoaded: (d: ParsedData) => void) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");

  const finish = (
    parsed: { headers: string[]; rows: string[][] },
    meta: Omit<ParsedData, "headers" | "rows">,
  ) => {
    if (!parsed.headers.length) { setErr("看起來是空的檔案，換一個試試"); return; }
    if (!parsed.rows.length)    { setErr("只有標題列，沒有資料"); return; }
    setErr("");
    onLoaded({ ...parsed, ...meta });
  };

  const readFile = (file?: File) => {
    if (!file) return;
    const isExcel = /\.xlsx?$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (isExcel) {
        finish(parseCSV(SAMPLE_CSV), { srcLabel: file.name + " · 工作表 1", srcType: "excel" });
        return;
      }
      finish(parseCSV(String(e.target?.result ?? "")), { srcLabel: file.name, srcType: "csv" });
    };
    if (isExcel) reader.readAsArrayBuffer(file); else reader.readAsText(file, "utf-8");
  };

  const loadSheet = (url: string) => {
    if (!/docs\.google\.com|https?:\/\//.test(url)) {
      setErr("貼上一個有效的 Google Sheet 連結"); return;
    }
    finish(parseCSV(SAMPLE_CSV), { srcLabel: "員工名單 — Google Sheet", srcType: "sheet" });
  };

  const loadPaste = (text: string) => {
    if (!text.trim()) { setErr("先貼上一些資料"); return; }
    finish(parseTable(text), { srcLabel: "貼上的資料", srcType: "paste" });
  };

  const loadSample = () =>
    finish(parseCSV(SAMPLE_CSV), { srcLabel: "employees_2026Q2.csv", srcType: "csv" });

  return { fileRef, err, setErr, readFile, loadSheet, loadPaste, loadSample };
}

// ── sub-components ──────────────────────────────────────────────

function DropZone({ big, onFile, onPick }: {
  big: boolean; onFile: (f: File) => void; onPick: () => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault(); setOver(false);
        const f = e.dataTransfer.files[0]; if (f) onFile(f);
      }}
      onClick={onPick}
      style={{
        border: `1.5px dashed ${over ? "var(--accent)" : "var(--border-strong)"}`,
        background: over ? "var(--accent-subtle)" : "var(--bg-subtle)",
        borderRadius: 16, padding: big ? "56px 32px" : "32px 24px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 14, cursor: "pointer", textAlign: "center",
        transition: "border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)",
      }}
    >
      <div style={{
        width: big ? 56 : 44, height: big ? 56 : 44, borderRadius: 14,
        background: over ? "var(--accent)" : "var(--surface)",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "var(--shadow-xs)",
        transition: "all var(--dur-base) var(--ease-out)",
        transform: over ? "translateY(-2px)" : "none",
      }}>
        <UploadCloud size={big ? 26 : 22} color={over ? "#fff" : "var(--accent)"} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg)" }}>
          把檔案拖到這裡
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 4 }}>
          或 <span style={{ color: "var(--accent)", fontWeight: 500 }}>點擊選擇檔案</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>
        .csv · .xlsx · 最大 10MB
      </div>
    </div>
  );
}

function SheetInput({ onLoad }: { onLoad: (url: string) => void }) {
  const [url, setUrl] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: 12, display: "flex" }}>
            <Link size={15} color="var(--fg-3)" />
          </span>
          <input
            value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onLoad(url)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            style={{
              width: "100%", padding: "11px 12px 11px 36px", fontSize: 13,
              border: "1px solid var(--border)", borderRadius: 8,
              fontFamily: "inherit", background: "var(--surface)", color: "var(--fg)", outline: "none",
            }}
          />
        </div>
        <button onClick={() => onLoad(url)} style={S.solidBtn}>載入</button>
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
        <Info size={13} color="var(--fg-4)" />
        記得把 Sheet 的存取權限設成「知道連結的人可檢視」
      </div>
    </div>
  );
}

function PasteInput({ onLoad, onSample, compact }: {
  onLoad: (t: string) => void; onSample: () => void; compact: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: compact ? "100%" : "auto" }}>
      <textarea
        value={text} onChange={e => setText(e.target.value)}
        placeholder={"姓名,公司信箱,員工編號,部門...\n從 Excel 或 Google Sheet 複製整個表格貼進來"}
        style={{
          width: "100%", flex: compact ? 1 : "none",
          minHeight: compact ? 0 : 160, resize: "vertical",
          padding: 14, fontSize: 12.5, lineHeight: 1.7,
          border: "1px solid var(--border)", borderRadius: 10,
          fontFamily: "var(--font-mono)", background: "var(--surface)",
          color: "var(--fg-2)", outline: "none",
        }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => onLoad(text)} style={S.solidBtn}>解析資料</button>
        <button onClick={onSample} style={S.ghostBtn}>
          <Sparkles size={14} color="var(--accent)" />使用範例資料
        </button>
      </div>
    </div>
  );
}

// ── styles ───────────────────────────────────────────────────────

const S = {
  solidBtn: {
    padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
    display: "inline-flex", alignItems: "center", gap: 7,
    background: "var(--ink-900)", color: "#fff", border: "1px solid var(--ink-900)",
    whiteSpace: "nowrap",
  } as React.CSSProperties,
  ghostBtn: {
    padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
    display: "inline-flex", alignItems: "center", gap: 7,
    background: "var(--surface)", color: "var(--fg-2)", border: "1px solid var(--border)",
    whiteSpace: "nowrap",
  } as React.CSSProperties,
  card: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24,
  } as React.CSSProperties,
};

// ── main component ───────────────────────────────────────────────

export function UploadStep({ variant, onVariant, onLoaded }: {
  variant: string;
  onVariant: (v: string) => void;
  onLoaded: (d: ParsedData) => void;
}) {
  const [source, setSource] = useState("csv");
  const L = useUploadLogic(onLoaded);

  const renderInput = (compact: boolean) => {
    if (source === "sheet") return <SheetInput onLoad={L.loadSheet} />;
    if (source === "paste") return <PasteInput onLoad={L.loadPaste} onSample={L.loadSample} compact={compact} />;
    return <DropZone big={!compact} onFile={f => L.readFile(f)} onPick={() => L.fileRef.current?.click()} />;
  };

  const switchSource = (k: string) => { setSource(k); L.setErr(""); };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <input
        ref={L.fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv"
        style={{ display: "none" }}
        onChange={e => { L.readFile(e.target.files?.[0]); e.target.value = ""; }}
      />

      {/* heading + variant switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>匯入員工名單</div>
          <div style={{ fontSize: 13.5, color: "var(--fg-3)", marginTop: 4 }}>
            上傳 CSV、連結 Google Sheet，或直接貼上表格
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>上傳區設計</span>
          <div style={{ display: "flex", background: "var(--bg-inset)", borderRadius: 8, padding: 2, gap: 2 }}>
            {VARIANTS.map(v => (
              <button key={v.k} onClick={() => onVariant(v.k)} style={{
                padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, fontWeight: variant === v.k ? 600 : 400,
                whiteSpace: "nowrap",
                background: variant === v.k ? "var(--surface)" : "transparent",
                color: variant === v.k ? "var(--fg)" : "var(--fg-3)",
                boxShadow: variant === v.k ? "var(--shadow-xs)" : "none",
              }}>{v.k} · {v.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── A: classic drag-drop ── */}
      {variant === "A" && (
        <div style={S.card}>
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {SOURCES.map(s => (
              <button key={s.k} onClick={() => switchSource(s.k)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 999,
                border: `1px solid ${source === s.k ? "var(--accent)" : "var(--border)"}`,
                background: source === s.k ? "var(--accent-subtle)" : "var(--surface)",
                color: source === s.k ? "var(--accent)" : "var(--fg-2)",
                fontSize: 13, fontWeight: source === s.k ? 600 : 400,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all var(--dur-fast) var(--ease-out)",
              }}>
                <s.Icon size={15} color={source === s.k ? "var(--accent)" : "var(--fg-3)"} />
                {s.label}
              </button>
            ))}
          </div>
          {renderInput(false)}
        </div>
      )}

      {/* ── B: source cards ── */}
      {variant === "B" && (
        <div style={S.card}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 18 }}>
            {SOURCES.map(s => {
              const active = source === s.k;
              return (
                <button key={s.k} onClick={() => switchSource(s.k)} style={{
                  display: "flex", alignItems: "center", gap: 13, padding: 16, textAlign: "left",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  background: active ? "var(--accent-subtle)" : "var(--surface)",
                  borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                  boxShadow: active ? "var(--ring-accent)" : "none",
                  transition: "all var(--dur-fast) var(--ease-out)",
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: active ? "var(--accent)" : "var(--bg-inset)",
                  }}>
                    <s.Icon size={18} color={active ? "#fff" : "var(--fg-2)"} />
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{s.sub}</div>
                  </div>
                  <div style={{ opacity: active ? 1 : 0, transition: "opacity var(--dur-fast)" }}>
                    <CheckCircle2 size={18} color="var(--accent)" />
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 18 }}>
            {renderInput(false)}
          </div>
        </div>
      )}

      {/* ── C: split panel ── */}
      {variant === "C" && (
        <div style={{ ...S.card, padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "1.4fr 1fr", minHeight: 360 }}>
          <div style={{ padding: 22, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "var(--bg-inset)", padding: 3, borderRadius: 8, width: "fit-content" }}>
              {SOURCES.map(s => (
                <button key={s.k} onClick={() => switchSource(s.k)} style={{
                  padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12,
                  fontWeight: source === s.k ? 600 : 400,
                  background: source === s.k ? "var(--surface)" : "transparent",
                  color: source === s.k ? "var(--fg)" : "var(--fg-3)",
                  boxShadow: source === s.k ? "var(--shadow-xs)" : "none",
                }}>{s.label}</button>
              ))}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {renderInput(true)}
            </div>
          </div>
          <div style={{ padding: 22, background: "var(--bg-subtle)", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--fg-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              準備就緒
            </div>
            {[
              { label: "第 1 列視為標題", accent: false },
              { label: "自動偵測分隔符", accent: false },
              { label: "UTF-8 編碼",     accent: false },
              { label: "AI 自動對應欄位", accent: true  },
            ].map(({ label, accent }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--fg-2)" }}>
                {accent
                  ? <Sparkles size={16} color="var(--accent)" />
                  : <FileSpreadsheet size={16} color="var(--fg-3)" />
                }
                {label}
              </div>
            ))}
            <div style={{ marginTop: "auto", fontSize: 12, color: "var(--fg-3)", lineHeight: 1.6, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              載入後會先讓你<b style={{ color: "var(--fg-2)", fontWeight: 600 }}>預覽並驗證</b>，確認無誤再對應到 Loopwise 欄位。
            </div>
          </div>
        </div>
      )}

      {L.err && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--danger)", background: "var(--danger-bg)", padding: "10px 14px", borderRadius: 8 }}>
          <AlertCircle size={15} color="var(--danger)" />{L.err}
        </div>
      )}
    </div>
  );
}
