"use client";

import { useMemo, useState } from "react";
import { Check, Upload, Table2, ArrowLeftRight, CheckCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { FIELDS, autoMap, validate, type ParsedData, type Mapping } from "@/lib/import/data";
import { UploadStep } from "./UploadStep";
import { PreviewStep, type DecoratedMapping } from "./PreviewStep";
import { MappingStep } from "./MappingStep";
import { DoneStep } from "./DoneStep";

const STEPS = [
  { label: "上傳",  Icon: Upload },
  { label: "預覽",  Icon: Table2 },
  { label: "對應",  Icon: ArrowLeftRight },
  { label: "完成",  Icon: CheckCheck },
];

function Stepper({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
      {STEPS.map((s, i) => {
        const state = i < step ? "done" : i === step ? "active" : "todo";
        return (
          <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? "auto" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: state === "done" ? "var(--accent)" : state === "active" ? "var(--accent-subtle)" : "var(--bg-inset)",
                border: state === "active" ? "1.5px solid var(--accent)" : "1.5px solid transparent",
                transition: "all var(--dur-base) var(--ease-out)",
              }}>
                {state === "done"
                  ? <Check size={15} color="#fff" />
                  : <span style={{ fontSize: 13, fontWeight: 600, color: state === "active" ? "var(--accent)" : "var(--fg-4)", fontFamily: "var(--font-mono)" }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: 13, fontWeight: state === "active" ? 600 : 500, color: state === "todo" ? "var(--fg-4)" : "var(--fg)", whiteSpace: "nowrap" }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1.5, margin: "0 12px", background: i < step ? "var(--accent)" : "var(--border)", transition: "background var(--dur-base)", minWidth: 24 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ImportFlow() {
  const [step, setStep]       = useState(0);
  const [variant, setVariant] = useState("A");
  const [data, setData]       = useState<ParsedData | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});

  const decorated: DecoratedMapping = useMemo(() => {
    const byCol: Record<number, (typeof FIELDS)[0]> = {};
    FIELDS.forEach(f => { if ((mapping[f.key] ?? -1) >= 0) byCol[mapping[f.key]] = f; });
    return { byCol, idCol: mapping["employee_id"] ?? -1 };
  }, [mapping]);

  const valid = useMemo(
    () => data ? validate(data.rows, mapping) : null,
    [data, mapping],
  );

  const requiredMissing = FIELDS.filter(f => f.required && !((mapping[f.key] ?? -1) >= 0));
  const canNext = step === 1 || (step === 2 && requiredMissing.length === 0);

  const handleLoaded = (parsed: ParsedData) => {
    setData(parsed);
    setMapping(autoMap(parsed.headers));
    setStep(1);
  };

  const onChangeMap = (key: string, col: number) => {
    setMapping(m => {
      const next = { ...m };
      if (col >= 0) Object.keys(next).forEach(k => { if (next[k] === col) next[k] = -1; });
      next[key] = col;
      return next;
    });
  };

  const restart = () => { setData(null); setMapping({}); setStep(0); };

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--fg)" }}>
      {step < 3 && <Stepper step={step} />}

      <div key={step} className="lw-step-in">
        {step === 0 && (
          <UploadStep variant={variant} onVariant={setVariant} onLoaded={handleLoaded} />
        )}
        {step === 1 && data && valid && (
          <PreviewStep data={data} decorated={decorated} valid={valid} dense={false} />
        )}
        {step === 2 && data && (
          <MappingStep data={data} mapping={mapping} onChange={onChangeMap} onAutoMap={() => setMapping(autoMap(data.headers))} aiAssist />
        )}
        {step === 3 && data && valid && (
          <DoneStep data={data} valid={valid} onRestart={restart} onLearners={restart} />
        )}
      </div>

      {/* footer nav */}
      {step >= 1 && step <= 2 && (
        <div style={{
          position: "sticky", bottom: 0, marginTop: 32, paddingTop: 16,
          borderTop: "1px solid var(--border)",
          background: "linear-gradient(to top, var(--bg-subtle) 70%, transparent)",
          display: "flex", justifyContent: "space-between",
          maxWidth: step === 1 ? 1040 : 880,
          marginLeft: "auto", marginRight: "auto",
        }}>
          <button
            onClick={() => setStep(s => s - 1)}
            style={{ padding: "11px 18px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--fg-2)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7 }}
          >
            <ArrowLeft size={15} color="var(--fg-2)" />上一步
          </button>
          <button
            onClick={() => canNext && setStep(s => s + 1)}
            disabled={!canNext}
            style={{
              padding: "11px 22px", borderRadius: 9, border: "none", fontSize: 13.5, fontWeight: 600,
              fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8,
              background: canNext ? "var(--accent)" : "var(--bg-inset)",
              color: canNext ? "#fff" : "var(--fg-4)",
              cursor: canNext ? "pointer" : "not-allowed",
              boxShadow: canNext ? "var(--ring-accent)" : "none",
            }}
          >
            {step === 2
              ? <>開始匯入<ArrowRight size={15} color="#fff" /></>
              : <>下一步<ArrowRight size={15} color="#fff" /></>
            }
          </button>
        </div>
      )}
    </div>
  );
}
