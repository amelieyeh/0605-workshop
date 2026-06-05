// 去識別化（遮蔽）邏輯 — 只在 server 端執行。
// 原始資料完整存於資料庫，這裡定義「讀取時」依角色決定每個欄位露出多少。

export type Role = "admin" | "viewer";

export interface Member {
  id: number;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  address: string;
  birthday: string;
  createdAt: Date | string;
}

const MASK = "＊"; // 全形星號，中英文混排對齊較好看

/** 保留頭尾、遮蔽中間。head/tail 為要保留的字元數。 */
function maskMiddle(value: string, head: number, tail: number): string {
  if (value.length <= head + tail) {
    // 太短就全遮，至少露出第一個字
    return value.slice(0, 1) + MASK.repeat(Math.max(value.length - 1, 1));
  }
  const middleLen = value.length - head - tail;
  return value.slice(0, head) + MASK.repeat(middleLen) + value.slice(value.length - tail);
}

/** 姓名：保留姓氏（含複姓），名字以星號遮蔽。 */
export function maskName(name: string): string {
  const compoundSurnames = ["歐陽", "司馬", "上官", "諸葛", "夏侯", "皇甫", "東方"];
  const surnameLen = compoundSurnames.some((s) => name.startsWith(s)) ? 2 : 1;
  if (name.length <= surnameLen) return name;
  return name.slice(0, surnameLen) + MASK.repeat(name.length - surnameLen);
}

/** 手機：保留前 4 碼與末 3 碼，例如 0912***678。 */
export function maskPhone(phone: string): string {
  return maskMiddle(phone, 4, 3);
}

/** Email：保留本地名首字與完整網域，例如 m＊＊＊@example.com。 */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return maskMiddle(email, 1, 0);
  const local = email.slice(0, at);
  const domain = email.slice(at); // 含 @
  const visible = local.slice(0, 1);
  return visible + MASK.repeat(Math.max(local.length - 1, 1)) + domain;
}

/** 身分證字號：保留首碼與末 2 碼，例如 A12＊＊＊＊＊89。 */
export function maskIdNumber(id: string): string {
  return maskMiddle(id, 3, 2);
}

/** 地址：保留到「縣市 + 區/鄉/鎮/市」層級，後續門牌遮蔽。 */
export function maskAddress(address: string): string {
  const match = address.match(/^(.+?(?:市|縣))(.+?(?:區|鄉|鎮|市))/);
  if (match) {
    const kept = match[1] + match[2];
    const rest = address.slice(kept.length);
    return kept + (rest ? MASK.repeat(rest.length) : "");
  }
  // 抓不到行政區就保留前 3 字
  return maskMiddle(address, 3, 0);
}

/** 生日：只保留年份，例如 1990-＊＊-＊＊。 */
export function maskBirthday(birthday: string): string {
  const m = birthday.match(/^(\d{4})/);
  return m ? `${m[1]}-${MASK}${MASK}-${MASK}${MASK}` : maskMiddle(birthday, 0, 0);
}

/** 依角色回傳成員資料：admin 看原始，viewer 看遮蔽後版本。 */
export function deidentifyMember(member: Member, role: Role): Member {
  if (role === "admin") return member;
  return {
    ...member,
    name: maskName(member.name),
    phone: maskPhone(member.phone),
    email: maskEmail(member.email),
    idNumber: maskIdNumber(member.idNumber),
    address: maskAddress(member.address),
    birthday: maskBirthday(member.birthday),
  };
}
