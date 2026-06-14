# Epos Web — 工作記憶

> React + Vite + TypeScript。Phase 2 為 API 驗證工具（✅ 完成）；Phase 5 升級正式產品（待辦）。
> **跨專案規範、Skills、Phase 路線、SRD 授權見根目錄 [`../CLAUDE.md`](../CLAUDE.md)**。
> ⚠️ 語言規範（繁體中文）適用此專案所有回應/註解/文件——見根 CLAUDE.md。

---

## 技術棧

- React + Vite + TypeScript；React Router；Tailwind v4；**@tanstack/react-query**（6.2 正式產品伺服器快取）
- ESLint / Prettier；axios（API Client Layer）

## Phase 2 — Web API 驗證工具（✅ 完成）

> 目標：打通全部後端 endpoints，為 Phase 5 奠定**可複用 API Client**。部署：本地（後端 `localhost:8080`）。

12 項 WBS 全完成：
- **API Client Layer（可複用基礎）**：axios instance + Bearer 攔截 + 401 auto-refresh + retry + Auth context；`tokenStore.ts` 解循環依賴、sessionStorage 持久化
- 驗證頁：Auth / SRD（含 ruleset 5.1-5.2 + zh-TW/en 切換）/ 建角引導 / Character CRUD+Sync / 升級 / Inventory / Adventure Log / 錯誤情境 & Rate Limiting
- Request Log Panel（Dev 輔助，顯示最近 N 筆 req/res）
- NFR-1b（2026-04-30）：ASI 等級/上限驗證、N+1 修正（@EntityGraph）、JaCoCo 整合

⚠️ Phase 2 僅驗證 API 資料正確性；完整建角 **UX 流程邏輯（步驟跳轉/資料帶入/驗證）留 Phase 5**。

## Phase 6 — 6.2 Web 正式產品（🔶 進行中，ADR-025）

> 從 API 驗證工具升級正式產品，**分階段**。架構：react-query 直接 API（非 mobile SQLite local-first），複用 Phase 2 API Client；設計系統 CSS tokens（主題 A 沉浸奇幻 #130A07/#C9922A，對齊 PDF 品牌版）。Phase 2 驗證頁移 /dev/*。

**第一刀：唯讀角色卡切片（✅ 2026-06-13）**

| 模組 | 職責 |
|------|------|
| `index.css` :root tokens | 主題 A 沉浸奇幻設計變數 |
| `main.tsx` | QueryClientProvider（staleTime 30s） |
| `components/ProtectedRoute` + `AppShell` | 未登入導 /login；品牌頂欄殼 |
| `components/Avatar` + `lib/avatar` | 圓形頭像 + 首字母 fallback（與 mobile 同邏輯） |
| `lib/rules` | abilityMod/proficiencyBonus/proficiencyBonusFor/SKILL_ABILITY |
| `pages/LoginPage` | 品牌登入（複用 AuthContext.login） |
| `pages/CharactersListPage` | useQuery list + 卡片網格 + Avatar |
| `pages/CharacterSheetPage` | 唯讀：六圍/戰鬥/技能(被動感知)/攻擊/法術/裝備（inventoryApi） |

- 後端前提：**W0 detail GET 補六圍/技能/豁免**（見 `../epos-backend-api/CLAUDE.md`）。
- ⚠️ 性格區待後端 traits DTO 補完（下一階段）；完整端對端需後端 localhost:8080。
- 後續階段：角色卡編輯 / 建角 wizard / 戰役·DM / 即時同步 Web / 好友·頭像·PDF 對等。

## Phase 5 — 升級正式產品（併入 6.2，見上）

- 引導式建角完整 UX 流程邏輯（可複用 Phase 2 的 API Client Layer：axios wrapper / auth context）
- 付費機制：Stripe（Web 端）

---

## 相關 Skills（細節見根 CLAUDE.md）

`epos-context`（載入現況）、`epos-github`（push）。
