"use client";

import { useEffect, useState } from "react";
import type { Member, Role } from "@/lib/deidentify";
import styles from "./page.module.css";

const COLUMNS: { key: keyof Member; label: string }[] = [
  { key: "name", label: "姓名" },
  { key: "phone", label: "手機" },
  { key: "email", label: "Email" },
  { key: "idNumber", label: "身分證字號" },
  { key: "address", label: "地址" },
  { key: "birthday", label: "生日" },
];

export default function Home() {
  const [role, setRole] = useState<Role>("viewer");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/members?role=${role}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setMembers(data.members ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <h1 className={styles.title}>成員資料</h1>
            <p className={styles.subtitle}>
              原始資料完整存於資料庫，去識別化在後端讀取時依角色套用。
              切換角色看差異 —— viewer 模式下，原始個資永遠不會傳到瀏覽器。
            </p>
          </div>
          <a href="/import" style={{ flexShrink: 0, marginTop: 4, padding: "10px 18px", borderRadius: 9, background: "#6C47FF", color: "#fff", fontSize: 13.5, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
            ＋ 批次匯入
          </a>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.roleLabel}>
          檢視角色
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={styles.roleSelect}
          >
            <option value="viewer">viewer（看遮蔽後資料）</option>
            <option value="admin">admin（看原始資料）</option>
          </select>
        </label>
        <span
          className={styles.badge}
          style={{
            background: role === "admin" ? "#fde2e1" : "#e1f0fd",
            color: role === "admin" ? "#a3261f" : "#1a5ea8",
          }}
        >
          {role === "admin" ? "原始資料" : "已去識別化"}
        </span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} className={styles.th}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COLUMNS.length} className={styles.empty}>
                  載入中…
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className={styles.empty}>
                  沒有資料
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id}>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className={styles.td}>
                      {String(m[c.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
