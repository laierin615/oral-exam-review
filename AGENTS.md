# 評量部落・口試特訓：協作說明（Claude 與 Codex 共用）

國小教育測驗與學習評量期中**口試**的複習網站。使用者是準備口試的學生，第一原則是**讓使用者把理論背熟**：任何新功能都要能說明它怎麼幫助主動回想或間隔複習，只是好看的裝飾不優先。

- 線上網址（主要）：https://laierin615.github.io/oral-exam-review/ ，push 到 `main` 約 1 分鐘後自動更新
- Claude Artifact 版：https://claude.ai/artifact/Ksdwd516MKdUZiXZvfdzRf ，只有 Claude 能同步，Codex 不用管

## 輪流修改的規則

1. 開工前 `git pull`；一次只有一個 AI 在改，避免衝突。
2. 改完一定跑 `node tests/check.mjs`，全部通過才 commit。
3. commit 訊息用繁體中文，說明改了什麼；然後 `git push`。
4. 每段工作完成寫 AI 交接卡（使用者的全域規則）：
   `python3 ~/.claude/scripts/handoff.py --tool <Claude 或 Codex> --task … --output … --decision … --next …`
5. 推送前先問使用者，除非使用者已經說可以直接推。

## 檔案結構

全部在單一 `index.html`，React 18 + htm 從 CDN 載入，不需建置。內嵌 `<script>` 依下列區塊標記排列（**標記文字不要改**，`tests/check.mjs` 靠它們切出程式碼）：

| 區塊標記 | 內容 |
|---|---|
| `:root {` 與兩個深色區塊 | 色彩 token；深色值要在 `@media (prefers-color-scheme: dark)` 與 `:root[data-theme="dark"]` 兩處同步 |
| `/* ---------- 部落風 / 村莊 / 攻擊 / 對戰` | 遊戲介面的 CSS |
| `const TOPICS` | 15 個理論主題：`open`（口試開場句）、`pts`（重點）、`traps`（易錯提醒）、`fig`（圖解 key） |
| `const QUESTIONS` | 46 題口試題：`keywords[].groups`（必須講到的概念，可用正規式）、`examples`、`model`（滿分範本） |
| `/* ---------- 比對引擎` | `grade()`：基本分＝關鍵字 50 分，闡述分＝定義句＋實例 50 分 |
| `/* ---------- 朗讀` | 裝置內建 speechSynthesis、`useTTS()`、底部播放列 |
| `/* ---------- 圖解` 與 `互動：…` | 每個主題的 SVG 圖解，`FIGS` 以 key 對應 |
| `const SHORT` | 建築名稱，每個 TOPICS id 都要有 |
| `useGame()` | 村莊狀態、間隔複習、資源、每日任務、連續天數 |
| `Building` / `Village` / `Attack` / `Notes` / `Practice` / `App` | 各頁元件 |

## 遊戲規則（改機制前先讀）

- 攻擊＝背誦：每關遮住答案，使用者自己講完再揭曉並自評。開場句、全部重點、易錯陷阱各 1 星，3 星才能建造或修復。
- 間隔複習：`INTERVALS = [0, 1, 3, 7, 14]`。建好 Lv.1 後隔 1 天受損；受損時打 3 星修復並升級，Lv.4 為最高，之後每 14 天受損一次。未到期提早攻擊只算練習、不升級。
- 對戰：口試估計分 50／80／90 分換 1／2／3 星；同一份回答重複批改不重複計分。
- 每日任務完成自動發金幣。

## 不能改壞的地方

- **繁體中文（台灣用語）**：計畫非計劃、螢幕非屏幕、程式碼非代碼。介面文字短、直接。
- **不使用 Supercell／部落衝突的官方素材、Logo、角色或遊戲名稱**；建築與圖示一律原創 SVG。
- **localStorage 相容**：前綴 `exam-review-v2:`，鍵包括 `village`、`res`、`daily`、`streak`、`qstars`、`scores`、`drafts`、`qid`、`tab`、`ptopic`、`voice`、`rate`。改資料格式時要寫轉換，不能讓使用者的進度歸零。所有讀寫都包在 try/catch。
- **手機優先**：375px 寬不能有橫向捲動；按鈕高度至少 40px；左右邊距用 `max(16px, env(safe-area-inset-*))`。
- **深淺色都要可讀**：新顏色先加成 token，再到兩個深色區塊補值；不要寫死在元件裡（建築 SVG 的材質色除外）。
- **CDN 版本固定**：react@18.3.1、react-dom@18.3.1（cdnjs）、htm@3.1.1（unpkg）。不要新增其他外部依賴。
- **內容正確性**：TOPICS 與 QUESTIONS 的理論內容依課堂知識庫，改內容前跟使用者確認來源。範本答案要同時有「○○是指……」定義句和「例如……」實例，`tests/check.mjs` 會擋下估計分不到 85 的範本。

## 驗證

- 必跑：`node tests/check.mjs`
- 介面改動：`python3 -m http.server 8765` 後用手機寬度（375×812）開 `http://127.0.0.1:8765/`，深淺色各看一次，確認主控台沒有錯誤。
- 測試時寫進 localStorage 的假資料，測完要清掉。
