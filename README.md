# epos-frontend-web

Epos DND Character Manager 的 Web 前端 API 驗證工具（Phase 2）。

Epos（古希臘語 ἔπος，史詩之詞）是一個 DND 角色卡管理全端開源作品集專案，支援 Player 與 DM 兩種角色視角。

> **Phase 2 目標**：對接後端所有 REST endpoints，驗證資料正確性，並建立 Phase 5 正式 Web App 可直接複用的 API Client 基礎架構。

## 技術棧

- **React 19** + **TypeScript** + **Vite 8**
- **React Router v7**（Client-side routing）
- **Axios**（HTTP Client，含 Bearer token 攔截器 + 401 自動 refresh）
- **Tailwind CSS v4**（UI 樣式）
- **ESLint + Prettier**（程式碼規範）

## 專案結構

```
src/
├── api/
│   ├── client.ts           # Axios instance（Bearer token 攔截器、401 auto-refresh + retry）
│   ├── tokenStore.ts       # Access / Refresh token 記憶體管理
│   ├── authApi.ts          # register / login / guest / refresh / logout
│   ├── characterApi.ts     # CRUD + sync + level-up
│   ├── inventoryApi.ts     # 物品欄 CRUD
│   ├── adventureLogApi.ts  # 冒險記錄 CRUD
│   └── srdApi.ts           # SRD 靜態資料查詢（races / classes / backgrounds / skills / equipment）
├── context/
│   ├── AuthContext.tsx      # 全域認證狀態（login / logout / currentUser）
│   └── RequestLogContext.tsx# 最近 N 筆 API req/res 日誌狀態
├── components/
│   ├── Layout.tsx           # 側邊欄導覽 + RequestLogPanel 掛載點
│   └── RequestLogPanel.tsx  # 可展開 JSON 的 API 請求記錄面板
├── pages/
│   ├── AuthPage.tsx         # Register / Login / Guest / Token refresh / Logout
│   ├── SrdPage.tsx          # SRD 靜態資料查詢（含 i18n Accept-Language 切換）
│   ├── CharactersPage.tsx   # 角色列表 / 新增 / 查詢 / 封存
│   ├── CharacterWizardPage.tsx  # 引導式建角 API 資料驗證
│   ├── LevelUpPage.tsx      # 升級 API（三種 HP 模式 / ASI / FEAT / 邊界值）
│   ├── InventoryPage.tsx    # 物品欄 CRUD + equipped toggle
│   ├── AdventureLogPage.tsx # 冒險記錄 CRUD
│   ├── ErrorScenariosPage.tsx # 錯誤情境驗證（429 / 401 auto-refresh / 400 / 403）
│   └── PlaceholderPage.tsx  # 佔位頁面
└── types/                   # TypeScript 型別定義（對應後端 DTO）
    ├── auth.ts
    ├── character.ts
    ├── inventory.ts
    ├── adventurelog.ts
    ├── levelup.ts
    ├── srd.ts
    └── api.ts
```

## 快速開始

```bash
# 1. 安裝依賴
npm install

# 2. 設定後端位址（預設 http://localhost:8080）
# 編輯 src/api/client.ts 中的 baseURL，或建立 .env.local：
echo "VITE_API_BASE_URL=http://localhost:8080" > .env.local

# 3. 確保後端正在執行
# 參見 epos-backend-api README

# 4. 啟動開發伺服器
npm run dev
```

開啟 [http://localhost:5173](http://localhost:5173)

## 開發指令

```bash
npm run dev      # 開發模式（HMR）
npm run build    # 生產建置
npm run lint     # ESLint 檢查
npm run preview  # 預覽生產建置
```

## Phase 2 驗證項目進度

| 項目 | 說明 | 狀態 |
|------|------|------|
| 2.1 | 專案骨架（Vite + React + TS + ESLint/Prettier + Router + Tailwind） | ✅ 完成 |
| 2.2 | API Client Layer（axios instance / Bearer token 攔截器 / 401 auto-refresh） | ✅ 完成 |
| 2.3 | Auth 流程驗證（Register / Login / Guest / Refresh / Logout） | ✅ 完成 |
| 2.4 | SRD 靜態資料查詢（Races / Classes / Backgrounds / Skills / Equipment + i18n） | ✅ 完成 |
| 2.5 | 引導式建角流程 API 資料驗證 | ✅ 完成 |
| 2.6 | Character CRUD + Sync 驗證 | ✅ 完成 |
| 2.7 | 升級 API 驗證（HP 三模式 / ASI / FEAT / 邊界值） | ✅ 完成 |
| 2.8 | Inventory API 驗證 | ✅ 完成 |
| 2.9 | Adventure Log API 驗證 | ✅ 完成 |
| 2.10 | 錯誤情境 & Rate Limiting 驗證（429 / 401 / 400 / 403） | ✅ 完成 |
| 2.11 | Request Log Panel（Dev 輔助，顯示最近 N 筆 req/res，可展開 JSON） | ✅ 完成 |

## 授權

本專案使用 D&D SRD 5.1 / 5.2 內容，授權為 CC BY 4.0（© Wizards of the Coast LLC）。
