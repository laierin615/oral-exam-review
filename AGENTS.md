# 評量筆記・口試特訓：協作說明（Claude 與 Codex 共用）

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
| `/* ---------- 部落風` 與 `/* ---------- 閱讀版` | 保留的歷史標記與現行閱讀介面 CSS |
| `const TOPICS` | 15 個理論主題：`open`（口試開場句）、`pts`（重點）、`traps`（易錯提醒）、`fig`（圖解 key） |
| `const QUESTIONS` | 46 題口試題：`keywords[].groups`（必須講到的概念，可用正規式）、`examples`、`model`（滿分範本） |
| `/* ---------- 比對引擎` | `grade()`：基本分＝關鍵字 50 分，闡述分＝定義句＋實例 50 分 |
| `/* ---------- 朗讀` | 裝置內建 speechSynthesis、`useTTS()`、底部播放列 |
| `/* ---------- 圖解` 與 `互動：…` | 每個主題的 SVG 圖解，`FIGS` 以 key 對應 |
| `const SHORT` | 主題簡稱，每個 TOPICS id 都要有 |
| `useStudy()` | 沿用舊 village 進度、間隔複習與待複習狀態 |
| `ConceptMap` / `ConceptMatch` / `Review` / `RecallSession` / `Notes` / `Practice` / `App` | 各頁元件 |

## 閱讀與複習規則（2026-10-24 使用者確認改版）

- 已移除遊戲呈現：建築、資源、星星、對戰與任務不再顯示，也不再發放獎勵。
- 主題閱讀 → 概念配對 → 遮答回想 → 口試練習。圖解與心智圖沿用課堂資料，不自行改寫理論。
- 回想練習：開場句、每項重點、易錯提醒依序遮住，全部自評講對才排下次複習；有沒講對的項目就標為待複習。
- `INTERVALS = [0, 1, 3, 7, 14]`，沿用舊 stage 與 due，最高 stage 4。提早全對不提升階段，也不延後原日期。
- 舊 `village`／`known` 進度接續；保留未使用的 `res`、`daily`、`streak`、`qstars` 等資料，不刪除。新增 needsReview、lastReview 欄位時保留既有欄位。
- 舊 village 分頁自動開啟主題閱讀。口試練習仍保存 scores、drafts、qid，估分引擎與原題庫不變。

## 插畫雜誌版視覺（2026-10-24 使用者確認）

- 視覺參考為使用者提供的六張圖；實作採原創 SVG、紙感封面、彩色筆記卡與概念連線，不嵌入參考圖片或品牌。
- `EDITIONS` 對應五章與主題 id；`ChapterArt` 是各章插畫，`CoverArt` 是封面插畫。
- `--mint`／`--lilac`／`--sky`／`--peach`／`--yellow` 為五章色，`data-module` 選章色；新增 token 要在兩個深色區塊同步。
- `ConceptMap` 點關鍵詞展開對應的原始 `t.pts`，不新增理論、不寫入進度。
- 首頁導讀、章節目錄、主題卡與回想／口試介面共用一套字級及框線規則；手機維持單欄與大字。
- 使用者要求刪除口號與裝飾性導讀文案；介面使用直接的功能名稱，保留理論與必要操作提示，不再加入「讀懂再說出來」等宣傳句。

## 不能改壞的地方

- **繁體中文（台灣用語）**：計畫非計劃、螢幕非屏幕、程式碼非代碼。介面文字短、直接。
- **不使用 Supercell／部落衝突的官方素材、Logo、角色或遊戲名稱**；建築與圖示一律原創 SVG。
- **localStorage 相容**：前綴 `exam-review-v2:`，鍵包括 `village`、`res`、`daily`、`streak`、`qstars`、`scores`、`drafts`、`qid`、`tab`、`ptopic`、`voice`、`rate`。改資料格式時要寫轉換，不能讓使用者的進度歸零。所有讀寫都包在 try/catch。
- **手機優先**：正文 18～20px，介面提示至少 16px；375px 寬頁面不能有橫向捲動（圖表與表格可在自己的區域滑動）；按鈕高度至少 40px；左右邊距用 `max(16px, env(safe-area-inset-*))`。
- **深淺色都要可讀**：新顏色先加成 token，再到兩個深色區塊補值；不要寫死在元件裡（建築 SVG 的材質色除外）。
- **CDN 版本固定**：react@18.3.1、react-dom@18.3.1（cdnjs）、htm@3.1.1（unpkg）。不要新增其他外部依賴。
- **內容正確性**：TOPICS 與 QUESTIONS 的理論內容依課堂知識庫，改內容前跟使用者確認來源。範本答案要同時有「○○是指……」定義句和「例如……」實例，`tests/check.mjs` 會擋下估計分不到 85 的範本。

## 驗證

- 必跑：`node tests/check.mjs` 與 `node tests/progress.mjs`
- 介面改動：`python3 -m http.server 8765` 後用手機寬度（375×812）開 `http://127.0.0.1:8765/`，深淺色各看一次，確認主控台沒有錯誤。
- 測試時寫進 localStorage 的假資料，測完要清掉。
