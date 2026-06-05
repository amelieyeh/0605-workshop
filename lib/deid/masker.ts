import {
  maskName, maskPhone, maskEmail,
  maskIdNumber, maskAddress, maskBirthday,
} from "@/lib/deidentify";

export type MaskType =
  | "name"
  | "phone"
  | "email"
  | "id"
  | "address"
  | "birthday"
  | "generic";

export const MASK_TYPE_LABELS: Record<MaskType, string> = {
  name:     "姓名",
  phone:    "手機",
  email:    "信箱",
  id:       "身分證",
  address:  "地址",
  birthday: "生日",
  generic:  "通用遮蔽",
};

const MASK_FN: Record<MaskType, (v: string) => string> = {
  name:     maskName,
  phone:    maskPhone,
  email:    maskEmail,
  id:       maskIdNumber,
  address:  maskAddress,
  birthday: maskBirthday,
  generic:  (v) => {
    if (!v) return v;
    if (v.length <= 1) return "＊";
    return v[0] + "＊".repeat(Math.max(v.length - 1, 1));
  },
};

/** Detect probable mask type from column header */
export function detectMaskType(header: string): MaskType | null {
  const h = header.toLowerCase();
  if (/姓名|name/i.test(h))                         return "name";
  if (/手機|電話|phone|mobile|tel/i.test(h))         return "phone";
  if (/信箱|email|e-mail|電子郵件/i.test(h))         return "email";
  if (/身分證|id.*號|證號|idnumber/i.test(h))        return "id";
  if (/地址|address/i.test(h))                       return "address";
  if (/生日|birthday|birth.*date|出生/i.test(h))     return "birthday";
  return null;
}

export function applyMask(value: string, type: MaskType): string {
  if (!value.trim()) return value;
  return MASK_FN[type](value);
}

/** Apply column masks to all rows, return new rows */
export function maskRows(
  rows: string[][],
  colMasks: Record<number, MaskType>,
): string[][] {
  return rows.map(row =>
    row.map((cell, c) => {
      const type = colMasks[c];
      return type ? applyMask(cell, type) : cell;
    }),
  );
}

/** Convert headers + rows to CSV string */
export function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map(r => r.map(escape).join(",")),
  ];
  return lines.join("\n");
}
