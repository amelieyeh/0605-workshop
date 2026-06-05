// Ported from prototype/data.jsx

export interface ParsedData {
  headers: string[];
  rows: string[][];
  srcLabel: string;
  srcType: "csv" | "excel" | "sheet" | "paste";
}

export interface Field {
  key: string;
  label: string;
  required: boolean;
  type: "text" | "email" | "id" | "date";
  hint: string;
}

export type Mapping = Record<string, number>;

export interface ValidationResult {
  cellIssues: Record<string, string>;
  rowIssues: Record<number, string[]>;
  errorRows: number;
  okRows: number;
  total: number;
}

export const SAMPLE_CSV = `姓名,公司信箱,員工編號,部門,職稱,到職日,主管信箱
林家愷,chiakai.lin@kaik.com,KK-1042,Engineering,資深工程師,2021-03-15,wei.chang@kaik.com
廖安柏,amber.liao@kaik.com,KK-1187,Product,產品經理,2020-11-02,nina.ho@kaik.com
黃建興,jason.huang@kaik,KK-1255,Marketing,行銷企劃,2022-07-18,nina.ho@kaik.com
蘇美玲,meiling.su@kaik.com,KK-1320,Operations,營運專員,2023/01/09,wei.chang@kaik.com
陳冠廷,ryan.chen@kaik.com,,Design,產品設計師,2022-02-28,amber.liao@kaik.com
譚思賢,sophia.tan@kaik.com,KK-1402,Sales,業務代表,2023-05-21,david.lin@kaik.com
吳大維,david.wu@kaik.com,KK-1042,Engineering,技術主管,2019-08-12,
金茱莉,julia.kim@kaik.com,KK-1511,Product,產品行銷,2024-01-15,amber.liao@kaik.com
劉明哲,mike.liu@kaik.com,KK-1533,Engineering,後端工程師,2023-09-30,david.wu@kaik.com
何瑞秋,rachel ho,KK-1560,Data,資料分析師,2022-12-05,david.wu@kaik.com
張偉,wei.chang@kaik.com,KK-1009,Engineering,工程總監,2018-04-01,
蔡艾蜜,emily.tsai@kaik.com,KK-1588,Marketing,內容經理,2024-03-11,nina.ho@kaik.com
李宗翰,alex.chen@kaik.com,KK-1604,Engineering,前端工程師,not a date,wei.chang@kaik.com
韓書宇,sophie.han@kaik.com,KK-1622,Operations,專案經理,2023-06-20,meiling.su@kaik.com`;

/**
 * 從前幾列中找出最可能的「表頭列」index。
 * 橫幅／標題列（如合併儲存格的「2026/01-02」）通常只有少數欄有值，
 * 真正的表頭是第一個「填滿」的列。回傳該列 index，找不到則回 0。
 */
export function detectHeaderRow(rows: string[][]): number {
  const N = Math.min(rows.length, 15);
  if (N === 0) return 0;
  const nonEmpty = (r: string[]) =>
    r.reduce((n, c) => n + ((c ?? "").trim() !== "" ? 1 : 0), 0);

  let max = 0;
  for (let i = 0; i < N; i++) max = Math.max(max, nonEmpty(rows[i]));
  if (max <= 1) return 0; // 單欄資料，無從判斷，視第一列為表頭

  // 第一個非空欄數達到最大值 60% 的列 = 表頭（橫幅列因欄數稀疏被跳過）
  const threshold = Math.max(2, Math.ceil(max * 0.6));
  for (let i = 0; i < N; i++) {
    if (nonEmpty(rows[i]) >= threshold) return i;
  }
  return 0;
}

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQ = false;
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const cleaned = rows.filter(r => r.some(c => c.trim() !== ""));
  if (!cleaned.length) return { headers: [], rows: [] };
  const h = detectHeaderRow(cleaned);
  return {
    headers: cleaned[h].map(c => c.trim()),
    rows: cleaned.slice(h + 1).map(r => r.map(c => c.trim())),
  };
}

export function parseTable(text: string): { headers: string[]; rows: string[][] } {
  const firstLine = text.split("\n")[0] ?? "";
  if (firstLine.split("\t").length > firstLine.split(",").length) {
    return parseCSV(text.replace(/\t/g, ","));
  }
  return parseCSV(text);
}

export const FIELDS: Field[] = [
  { key: "name",          label: "姓名",     required: true,  type: "text",  hint: "學員顯示名稱" },
  { key: "email",         label: "公司信箱", required: true,  type: "email", hint: "登入與通知用，須唯一" },
  { key: "employee_id",   label: "員工編號", required: true,  type: "id",    hint: "須唯一，對應 HR 系統" },
  { key: "team",          label: "部門",     required: false, type: "text",  hint: "用於分組與報表" },
  { key: "title",         label: "職稱",     required: false, type: "text",  hint: "" },
  { key: "hire_date",     label: "到職日",   required: false, type: "date",  hint: "YYYY-MM-DD" },
  { key: "manager_email", label: "主管信箱", required: false, type: "email", hint: "建立彙報關係" },
];

const MATCHERS: Record<string, RegExp[]> = {
  name:          [/姓名/, /name/i, /員工姓名/, /full ?name/i],
  email:         [/信箱/, /email/i, /e-mail/i, /電子郵件/, /公司信箱/],
  employee_id:   [/員工編號/, /工號/, /編號/, /emp.*id/i, /staff.*id/i, /\bid\b/i],
  team:          [/部門/, /team/i, /dept/i, /department/i, /組別/],
  title:         [/職稱/, /title/i, /role/i, /position/i, /職位/],
  hire_date:     [/到職/, /hire/i, /join/i, /入職/, /日期/, /date/i],
  manager_email: [/主管/, /manager/i, /supervisor/i, /上司/],
};

export function autoMap(headers: string[]): Mapping {
  const used = new Set<number>();
  const map: Mapping = {};
  FIELDS.forEach(f => {
    let best = -1;
    headers.forEach((h, i) => {
      if (used.has(i) || best !== -1) return;
      if (MATCHERS[f.key].some(re => re.test(h))) best = i;
    });
    if (best !== -1) used.add(best);
    map[f.key] = best;
  });
  return map;
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_DATE  = /^\d{4}-\d{2}-\d{2}$/;

export function validate(rows: string[][], map: Mapping): ValidationResult {
  const cellIssues: Record<string, string> = {};
  const rowIssues: Record<number, string[]> = {};
  const seenId: Record<string, number> = {};
  const seenEmail: Record<string, number> = {};

  const addCell = (r: number, c: number, msg: string) => {
    if (c >= 0) cellIssues[`${r}-${c}`] = msg;
    (rowIssues[r] = rowIssues[r] ?? []).push(msg);
  };

  rows.forEach((row, r) => {
    FIELDS.forEach(f => {
      const c = map[f.key] ?? -1;
      const val = c >= 0 ? (row[c] ?? "").trim() : "";
      if (f.required && !val) { addCell(r, c, `缺少${f.label}`); return; }
      if (!val) return;
      if (f.type === "email" && !RE_EMAIL.test(val)) addCell(r, c, "信箱格式不正確");
      if (f.type === "date"  && !RE_DATE.test(val))  addCell(r, c, "日期須為 YYYY-MM-DD");
      if (f.key === "employee_id") {
        if (seenId[val] !== undefined) addCell(r, c, "員工編號重複");
        seenId[val] = r;
      }
      if (f.key === "email") {
        if (seenEmail[val] !== undefined) addCell(r, c, "信箱重複");
        seenEmail[val] = r;
      }
    });
  });

  const errorRows = Object.keys(rowIssues).length;
  return { cellIssues, rowIssues, errorRows, okRows: rows.length - errorRows, total: rows.length };
}
