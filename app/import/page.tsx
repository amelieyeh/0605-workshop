import { ImportFlow } from "./components/ImportFlow";

export const metadata = { title: "批次匯入員工名單" };

export default function ImportPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-subtle)",
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "40px 24px 80px",
      }}>
        <ImportFlow />
      </div>
    </div>
  );
}
