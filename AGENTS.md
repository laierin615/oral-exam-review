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
| `/* ---------- 部落風` 與 `/* ---------- 閱讀版` | 保留的歷史標記與閱讀介面的版面 CSS |
| `/* ---------- 語音複習` | 語音複習清單、跟讀標示、聽考、口說作答與播放列字幕的 CSS |
| `/* ---------- 社群卡片版` | 現行視覺（粗黑框、實心陰影、方格紙、螢光色塊），放在 `</style>` 前，蓋過上面的雜誌版；改外觀先改這裡 |
| `const TOPICS` | 15 個理論主題：`open`（口試開場句）、`pts`（重點）、`traps`（易錯提醒）、`fig`（圖解 key） |
| `const QUESTIONS` | 49 題口試題：`keywords[].groups`（必須講到的概念，可用正規式）、`examples`、`model`（滿分範本） |
| `/* ---------- 比對引擎` | `grade()`：基本分＝關鍵字 50 分，闡述分＝定義句＋實例 50 分 |
| `/* ---------- 朗讀` | 裝置內建 speechSynthesis：`chunks()` 切成 `CHUNK_MAX` 字內的短句、`topicParts()` 跟讀段落、`useTTS()`（防卡住、停頓倒數、繼續上次） |
| `/* ---------- 語音聽考` | `GAPS`、`gapFor()`、`recallSteps()`（回想練習共用）、`topicQuiz()`、`questionQuiz()`、`unitsOf()`、`estMinutes()`、`mandarinVoices()`／`pickVoice()`（自動選最自然的中文聲音）；夾在 `const synth` 與 `const Speaker` 之間，測試會切出來檢查 |
| `/* ---------- 考古題` | `MCQ`（198 題：n 題號、q 題幹、o 選項、a 正解字母，空字串＝不計分、al、c、e、p、x，以及初學者解析 u 原理單元 id、k 這題在考什麼、s 解題步驟、w 各選項說明（正解以 ✓ 開頭）、m 一句話記住）、`UNITS`（21 個原理單元，fig 指向 `UNIT_FIGS` 或 `FIGS`）與 `MCQPage`，作答紀錄存在 `mcq`、篩選 `mcqf`、目前題號 `mcqn`、口試主題篩選 `mcqt`；`UNIT_TOPIC`／`topicOfUnit` 把原理單元對到口試主題，`mcqN` 是各主題的考古題數；`tests/check.mjs` 切 `const MCQ =` 到 `const MCQ_FILTERS`、`const UNITS = [` 到 `function MCQPage` 檢查 |
| `/* ---------- 口說作答` | `useSTT()`：裝置的 SpeechRecognition，中斷會自動接續 |
| `/* ---------- 播放或收音時` | `useWakeLock()`：播放或收音時讓螢幕保持亮著 |
| `/* ---------- 底部播放列` | `Player`：目前句子字幕、聽考倒數與「揭曉」，高度寫進 `--player-h` |
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

## 語音複習規則（2026-10-27 使用者確認）

- 主題閱讀的「語音複習」有四個連續播放清單：全部主題、待複習主題、只聽開場句、只聽易錯提醒。清單播放位置存在 `listen`，可「繼續上次」；播完清除。
- 朗讀時主題卡用 `.reading` 標出正在念的開場句、第幾點重點或易錯提醒，播放列顯示目前句子；連續播放會跟著捲動。
- 語音聽考：念題目 → 停頓（提示音＋倒數，可按「揭曉」）→ 念答案。主題聽考沿用 `recallSteps()` 的題目，口試題念題目後念滿分範本。作答時間存在 `gap`（`auto`、秒數或 `manual`）。
- **聽考不寫入進度**：熟悉程度與複習日期只由回想練習的自評決定。
- 口說作答：「開始口說／重新口說」先清空並保留一次復原，「接著說」接在原文字後；停止後自動檢查回答。不支援時保留鍵盤聽寫說明。收音前先停止朗讀，避免把朗讀聲音收進去。
- 朗讀每句不超過 `CHUNK_MAX`（44）字，避免 Chrome 線上語音約 15 秒中斷；有看門狗計時，念到一半卡住會接下一句，連續 3 句失敗就暫停並提示換聲音。
- 自動選聲音（2026-10-27 使用者要求換自然語音）：`mandarinVoices()` 依自然程度排序：Natural／Neural ＞ 高品質 ＞ 加強版 ＞ Google ＞ 系統基本 ＞ 微軟桌面版，同一級台灣華語優先。名稱與 voiceURI 都會比對（Safari 的加強版只寫在 voiceURI）。Eddy、Flo 等機械音、粵語與 Siri 聲音不列入清單（Siri 聲音在 iPhone 網頁朗讀會沒聲音）。某句 4 秒內沒開始念或出錯，就把該聲音標為這次開啟不可用，換下一個聲音重念同一句。`voice` 存空字串代表自動，之前選過的聲音不在清單裡時也改回自動。只剩基本語音時，朗讀設定會提示下載「美佳（加強版）」或改用 Edge。`tests/check.mjs` 用假的聲音清單檢查各平台選到的聲音。

## 社群卡片版視覺（2026-10-27 使用者確認：版面取代 10-24 的插畫雜誌版，配色沿用雜誌版暖色）

- 參考使用者提供的三張社群卡片圖，只取版面：粗框、實心偏移陰影、方格紙底、膠囊標籤與分頁。不放參考圖的品牌名稱、標誌、照片或文案。
- 配色：使用者看過紫色＋螢光綠版後，覺得雜誌版暖色比較舒服，改回暖色。白天是米白紙、暖黃封面、深綠重點色；晚上是深墨綠底、芥末黃封面、米白插畫。不要再換成高彩度的紫色或螢光色。
- `EDITIONS` 對應五章與主題 id；`ChapterArt` 是各章插畫（手機版主題卡隱藏），`CoverArt` 是封面插畫（手機版縮到 230px，讓進度圓點留在第一屏）。
- 五章色 `data-module`（與雜誌版相同）：0 `--mint` 綠、1 `--lilac` 紫、2 `--sky` 藍、3 `--peach` 橘、4 `--yellow` 黃。易錯提醒卡用 `--yellow`。
- 社群卡片版 token：`--lime`（灰綠重點色，名稱沿用）、`--on-lime`、`--pink`（陶土粉，待複習）、`--pill`、`--pill-edge`、`--on-pill`、`--on-pill-soft`、`--warn-on-pill`、`--primary-bg`、`--primary-ink`、`--primary-shadow`。主要按鈕白天炭灰底米白字配芥末黃陰影，晚上灰綠底深色字；封面按鈕固定炭灰底米白字（`--cover-ink`／`--art-paper`）。新增 token 要在兩個深色區塊同步。
- 外觀切換：刊頭右側「自動｜白天｜晚上」，存在 `theme`（`system`／`light`／`dark`），套在 `<html data-theme>`；自動時跟隨裝置深淺色。
- 進度圓點：首頁 15 顆，灰綠＝已熟悉、陶土粉＝待複習、米白＝尚未完成回想，點圓點開該主題。顏色取自 `game.status(id).kind`，不新增儲存鍵；回想練習頁「已熟悉」的數字同樣只算 `kind === 'ok'`。
- 分頁列：`.tabbar` 是 sticky 外層（負邊距蓋住卡片陰影），`.tabs` 是炭灰膠囊；sticky 會建立堆疊脈絡，不要把 sticky 移回 `.tabs`。
- `ConceptMap` 點關鍵詞展開對應的原始 `t.pts`（點開的節點深底灰綠框），不新增理論、不寫入進度。
- 使用者要求刪除口號與裝飾性導讀文案；介面使用直接的功能名稱，保留理論與必要操作提示，不再加入「讀懂再說出來」等宣傳句。

## 不能改壞的地方

- **繁體中文（台灣用語）**：計畫非計劃、螢幕非屏幕、程式碼非代碼。介面文字短、直接。
- **不使用 Supercell／部落衝突的官方素材、Logo、角色或遊戲名稱**；建築與圖示一律原創 SVG。
- **localStorage 相容**：前綴 `exam-review-v2:`，鍵包括 `village`、`res`、`daily`、`streak`、`qstars`、`scores`、`drafts`、`qid`、`tab`、`ptopic`、`theme`、`voice`、`rate`、`gap`、`listen`、`mcq`、`mcqf`、`mcqn`。改資料格式時要寫轉換，不能讓使用者的進度歸零。所有讀寫都包在 try/catch。
- **手機優先**：正文 18～20px，介面提示至少 16px；375px 寬頁面不能有橫向捲動（圖表與表格可在自己的區域滑動）；按鈕高度至少 40px；左右邊距用 `max(16px, env(safe-area-inset-*))`。
- **深淺色都要可讀**：新顏色先加成 token，再到兩個深色區塊補值；不要寫死在元件裡（建築 SVG 的材質色除外）。
- **CDN 版本固定**：react@18.3.1、react-dom@18.3.1（cdnjs）、htm@3.1.1（unpkg）。不要新增其他外部依賴。
- **內容正確性**：TOPICS 與 QUESTIONS 的理論內容依課堂知識庫，改內容前跟使用者確認來源。範本答案要同時有「○○是指……」定義句和「例如……」實例，`tests/check.mjs` 會擋下估計分不到 85 的範本。

## 驗證

- 必跑：`node tests/check.mjs` 與 `node tests/progress.mjs`（check 另檢查朗讀句長、跟讀段落與每一步聽考都有題目、停頓、答案）
- 語音改動：實際按按鈕測（程式呼叫沒有使用者手勢，iPhone 與 Chrome 可能不念）。麥克風在 Claude 的瀏覽器窗格會被擋，收音要在手機實測。
- 介面改動：`python3 -m http.server 8765` 後用手機寬度（375×812）開 `http://127.0.0.1:8765/`，用刊頭的「白天／晚上」各看一次，確認主控台沒有錯誤。
- 測試時寫進 localStorage 的假資料，測完要清掉。
