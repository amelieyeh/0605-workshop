# 去識別化資料檢視 Demo

一個示範「**讀取時去識別化**（dynamic de-identification at read time）」的小應用。

原始資料完整存在資料庫，**去識別化只在後端、讀取的當下、依使用者角色套用**。
前端永遠只拿到該角色能看的版本 —— viewer 角色下，原始個資完全不會傳到瀏覽器。

## 架構

| 層 | 技術 |
|---|---|
| 全端框架 | Next.js 16 (App Router) + TypeScript |
| ORM | Prisma 6 |
| 資料庫 | PostgreSQL 16（Docker，對外 port `5433`） |
| 去識別化 | server 端 service（`lib/deidentify.ts`） |
| 權限 | 角色切換 admin / viewer（v1 用前端下拉 mock，未做真登入） |

```
瀏覽器 ──GET /api/members?role=viewer──▶ API route
                                          │ 1. 從 Postgres 讀「原始」資料
                                          │ 2. deidentifyMember(member, role) 遮蔽
                                          ▼
瀏覽器 ◀──── 只回「已遮蔽」的 JSON ───────┘
```

### 遮蔽策略（viewer 角色）

| 欄位 | 範例（原始 → 遮蔽） |
|---|---|
| 姓名 | `王小明` → `王＊＊`（保留姓氏，含複姓） |
| 手機 | `0912345678` → `0912＊＊＊678` |
| Email | `ming.wang@example.com` → `m＊＊＊＊＊＊＊@example.com` |
| 身分證 | `A123456789` → `A12＊＊＊＊＊89` |
| 地址 | `台北市大安區信義路四段1號` → `台北市大安區＊＊＊＊＊＊＊` |
| 生日 | `1990-03-15` → `1990-＊＊-＊＊` |

admin 角色則回傳完整原始資料。

## 啟動步驟

```bash
# 0. 安裝依賴
npm install

# 1. 啟動 Postgres（Docker）
npm run db:up           # 等同 docker run ... postgres:16，對外 5433

# 2. 設定環境變數
cp .env.example .env

# 3. 建立資料表 + 灌假資料
npm run db:migrate      # prisma migrate dev
npm run db:seed         # 灌 5 筆假資料（格式正確、純屬虛構）

# 4. 啟動開發伺服器
npm run dev             # http://localhost:3939
```

> dev server 用 `3939` 而非預設 3000，避免與本機其他服務衝突。

開啟 http://localhost:3939 ，用右上角下拉切換 **viewer / admin**，即可看到同一份資料在不同角色下的差異。

## 專案結構

```
app/
  page.tsx              前端頁面（角色切換 + 資料表格）
  page.module.css       頁面樣式
  api/members/route.ts  API route：讀 DB → 依角色去識別化 → 回傳
lib/
  prisma.ts             Prisma client singleton
  deidentify.ts         去識別化核心邏輯（各欄位遮蔽策略）
prisma/
  schema.prisma         Member model
  seed.ts               假資料
docker-compose.yml      Postgres 設定（若有裝 compose plugin 可用）
```

## 其他指令

```bash
npm run db:studio       # Prisma Studio，瀏覽資料庫內容
```
