# CLAUDE.md — tonight-watch (サブスク迷子救済ガチャ)

このファイルはClaudeがこのリポジトリで作業する際のガイドです。

## プロジェクト概要

TMDb APIを叩いて、ユーザーが選んだサブスクサービス・体力・ジャンルに合った映画やTV作品をランダムに1つ提案するWebアプリ。  
ビルドツールに **Vite** を使用（`.env.local` によるAPIキー管理のため）。フレームワーク・UIライブラリは使用しない。

```
tonight-watch/
├── index.html              ← マークアップのみ
├── src/
│   ├── main.js             ← JavaScript（ガチャロジック・API連携）
│   ├── style.css           ← スタイルシート
│   └── assets/
│       └── logos/          ← サブスクサービスのロゴ画像（TMDbから取得・ローカル保存）
│           ├── amazon.jpg
│           ├── netflix.jpg
│           ├── unext.jpg
│           ├── hulu.jpg
│           ├── disney.jpg
│           └── danime.jpg
├── .env.local              ← APIキー（gitignore 対象・各自作成）
├── .env.example            ← .env.local のテンプレート（git 管理）
├── package.json            ← Vite 設定
└── dist/                   ← npm run build の出力（gitignore 対象）
```

> ロゴ画像は全て 4KB 未満のため Vite がビルド時に base64 インライン化する。  
> 追加・差し替え時は `src/assets/logos/` に上書き保存して再ビルドすること。

## 開発・動作確認

```powershell
# 初回セットアップ
cp .env.example .env.local   # .env.local を作成
# .env.local の VITE_TMDB_API_KEY に実際のキーを設定

npm install       # Vite をインストール
npm run dev       # 開発サーバー起動 → http://localhost:5173
```

変更後はブラウザが自動でホットリロードされる。

```powershell
npm run build     # dist/ へ本番ビルド（Cloudflare Pages デプロイ用）
npm run preview   # ビルド成果物をローカルでプレビュー
```

## 🚀 デプロイメント

### Cloudflare Pages での本番運用

このプロジェクトは **Cloudflare Pages** を使用してホストされています。

**メリット**：

- CDN経由の高速配信（世界規模）
- SSL/TLS暗号化が自動で有効
- 無料プランでも本番運用可能
- Git連携による自動デプロイ
- カスタムドメイン対応可能

### デプロイ手順

#### 方法A: Wrangler CLI（推奨・実績あり）

```powershell
# 1. Cloudflare にログイン（初回のみ）
npx wrangler login

# 2. ビルドしてから dist/ をデプロイ
cd "c:\Users\234005\tonight-watch"
npm run build
npx wrangler pages deploy dist --project-name tonight-watch
```

初回実行時に Cloudflare Pages プロジェクトが自動作成される。  
2回目以降は同コマンドを実行するだけで最新版が反映される。

> ⚠️ コミットしていない変更をデプロイする場合は `--commit-dirty=true` を追加する。

#### 方法B: GitHub 連携（自動デプロイ）

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) → **Pages** → プロジェクト選択
2. **設定** → **Git に接続** → リポジトリ `wipaseri/tonight-watch` を認可
3. ビルド設定:
   - フレームワークプリセット: `なし`（Static site）
   - ビルドコマンド: `npm run build`
   - ビルド出力ディレクトリ: `dist`
4. 以降は `main` ブランチへの push で自動デプロイ

### デプロイ環境URL

| 環境       | URL                                             | 説明                            |
| ---------- | ----------------------------------------------- | ------------------------------- |
| 本番       | `https://tonight-watch.pages.dev`               | Cloudflare 自動割り当てドメイン |
| プレビュー | `https://<commit-hash>.tonight-watch.pages.dev` | 各コミット用プレビューURL       |

**初回デプロイ日**: 2026-05-27  
**管理画面**: https://dash.cloudflare.com/ → Workers & Pages → `tonight-watch`

### APIキー管理

APIキーは `.env.local` で管理し、ソースコードにはコミットしない。

```bash
# .env.local（gitignore 対象）
VITE_TMDB_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```javascript
// src/main.js（Vite がビルド時に値を注入）
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
```

**Cloudflare Pages 本番環境**：  
ダッシュボード → `tonight-watch` → **設定 → 環境変数** → `VITE_TMDB_API_KEY` を追加。  
（未設定だと本番ビルドでキーが `undefined` になる）

**より安全にしたい場合**（将来対応）：  
Cloudflare Workers で TMDb API をプロキシ化し、クライアント側にキーを露出させない構成。

---

## ✅ これまでの改善履歴

### 2026-05-27 — 初回リリース・主要機能実装

| # | 内容 |
|---|------|
| 1 | `index.html` 単一ファイル構成 → Vite + `src/main.js` + `src/style.css` にファイル分割 |
| 2 | APIキー管理を `.env.local` + `import.meta.env.VITE_TMDB_API_KEY` に変更 |
| 3 | ジャンル選択肢を **5種類 → 18種類**に大幅拡張 |
| 4 | **「気分タイプ」セレクト**追加（ロマンチック・興奮・思考的等）— 任意項目 |
| 5 | **「フィルタ」セレクト**追加（人気順・高評価・新作・ランダム） |
| 6 | 結果表示に**評価（⭐5.0形式）**追加 |
| 7 | **視聴リンク機能**追加 — ガチャ結果の作品を各サブスクの検索ページへ遷移 |
| 8 | サブスク選択UI を**テキストラベル → ロゴアイコン**に変更（ローカル画像・base64インライン化） |
| 9 | **予告映像機能**追加 — TMDb から YouTube キー取得、サムネイル表示 |
| 10 | YouTube **iframe 埋め込み** → **サムネイル + YouTube 検索リンク**に変更（埋め込み制限・地域制限回避） |
| 11 | U-NEXT 視聴リンクURLを修正: `/search/result?query=` → `/search?q=` |

### バグ修正一覧

| # | 修正内容 | 原因 |
|---|----------|------|
| B1 | APIキーチェックを `if (!TMDB_API_KEY)` に修正 | 旧コードがキーを自分自身と比較していた |
| B2 | `vibe` の必須バリデーションを削除（任意項目に変更） | vibe 未選択でガチャが回せなかった |
| B3 | `response.ok` チェックを追加 | 401/429 等のHTTPエラーが握りつぶされていた |
| B4 | 評価値 0 の判定を `!= null && !== 0` に変更 | `0` が falsy で「未評価」と誤判定されていた |
| B5 | `<img id="res-poster">` の `src=""` を削除 | ページロード時に空リクエストが飛んでいた |
| B6 | `transition: all` → 対象プロパティを明示 | 不要なプロパティまでアニメーションされていた |
| B7 | `renderTrailer(trailerKey)` → `renderTrailer(trailerKey, title)` | title 引数の渡し忘れで YouTube 検索が機能しなかった |
| B8 | U-NEXT 検索URL修正（`/search?q=`） | 旧URLが404を返すようになった |

---

## アーキテクチャ

| ファイル          | 内容                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| `index.html`      | マークアップのみ（`<link>` と `<script type="module">` で外部ファイルを参照）  |
| `src/style.css`   | 全スタイル定義                                                                 |
| `src/main.js`     | ガチャロジック・API連携・結果レンダリング                                      |

### `src/main.js` の関数一覧

| 関数 | 役割 |
|------|------|
| `rollGacha()` | メイン処理。バリデーション → TMDb fetch → 結果レンダリング → 付加情報並列取得 |
| `fetchWatchProviders(type, itemId)` | TMDb `/watch/providers` から JP flatrate プロバイダーを取得 |
| `fetchTrailerKey(type, itemId)` | TMDb `/videos` から YouTube 動画キーを取得（ja-JP → en-US フォールバック） |
| `pickBestVideo(videos)` | YouTube 動画リストから Trailer > Teaser > Clip の優先順で選択 |
| `renderWatchLinks(providers, selectedIds, title)` | 視聴リンクボタンを DOM に描画 |
| `renderTrailer(trailerKey, title)` | 予告サムネイル + YouTube 検索リンクを DOM に描画 |

### `rollGacha()` の処理フロー

```
1. チェックボックスからプロバイダーID取得（Set で管理）
2. セレクトボックスから以下を取得：
   - type: movie or tv
   - genreId: ジャンルID
   - vibe: 気分タイプ（任意・結果ラベル表示用のみ、APIには影響しない）
   - filter: ソート・フィルタ条件
3. filter に基づいてAPIパラメータを構成：
   - 'vote_average' → sort_by=vote_average.desc & vote_average.gte=7
   - 'release_date' → sort_by=release_date.desc
   - 'random' → ランダムページ（1〜5）をリクエストして最大20件から選出
   - 'popularity' → sort_by=popularity.desc（デフォルト）
4. TMDb Discover API にfetch（with_watch_provider_types=flatrate でサブスク限定）
5. HTTPエラーチェック（401/429 等は throw）
6. 結果からランダム1件を選出してレンダリング
7. 選出作品の ID で /watch/providers と /videos を Promise.all で並列取得
8. 日本で配信中かつユーザー選択済みのサービスのみリンクボタン描画
9. YouTube サムネイル + 検索リンクを描画
```

### 視聴リンク機能（`fetchWatchProviders` / `renderWatchLinks`）

```
- エンドポイント: /movie/{id}/watch/providers または /tv/{id}/watch/providers
- results.JP.flatrate から日本のサブスク配信サービスを取得
- ユーザー選択プロバイダーと AND 判定し、一致したサービスのみボタン表示
- 失敗時は空配列を返し、ガチャ結果表示はそのまま続行（非破壊的）
- ボタンクリックで各サービスのタイトル検索ページに遷移（別タブ）
```

### 予告映像機能（`fetchTrailerKey` / `renderTrailer`）

```
- エンドポイント: /movie/{id}/videos または /tv/{id}/videos
- 取得優先順: ja-JP → en-US（フォールバック）
- 動画タイプ優先: Trailer > Teaser > Clip
- サムネイル: https://img.youtube.com/vi/{key}/maxresdefault.jpg
  → 取得失敗時は hqdefault.jpg にフォールバック（onerror）
- リンク先: YouTube 検索URL（https://www.youtube.com/results?search_query=タイトル+予告+trailer）
  → 直接再生URL（watch?v=KEY）は地域制限・年齢制限・削除で「再生できません」になるため採用しない
```

### 各サブスクの視聴リンクURL（`PROVIDER_WATCH_URLS`）

| サービス | TMDb ID | 検索URL形式 |
|---------|---------|------------|
| Netflix | 8 | `https://www.netflix.com/search?q={title}` |
| U-NEXT  | 84 | `https://video.unext.jp/search?q={title}` |
| dアニメストア | 85 | `https://animestore.docomo.ne.jp/animestore/sch_pc?searchKey={title}` |
| Amazon Prime | 119 | `https://www.amazon.co.jp/s?k={title}&i=prime-video` |
| Disney+ | 337 | `https://www.disneyplus.com/ja-jp/search?q={title}` |
| Hulu | 356 | `https://www.hulu.jp/search?query={title}` |

> ⚠️ 各サービスのURL仕様は変更される場合がある。404が出た場合は `PROVIDER_WATCH_URLS` の該当エントリを修正すること。

---

## TMDb API

- **エンドポイント**: `https://api.themoviedb.org/3/discover/{movie|tv}`
- **言語**: `ja-JP`（日本語、あらすじが未翻訳の場合は英語にフォールバック）
- **地域フィルタ**: `watch_region=JP`（日本向け配信のみ）
- **配信種別**: `with_watch_provider_types=flatrate`（サブスク限定）
- **ソート**: `sort_by=popularity.desc|vote_average.desc|release_date.desc`
- **評価フィルタ**: `vote_average.gte=7`（高評価のみに絞る）
- **ポスター画像**: `https://image.tmdb.org/t/p/w500{poster_path}`
- **APIキーの場所**: `src/main.js` の `import.meta.env.VITE_TMDB_API_KEY`

## コーディング規約

- フレームワーク・ライブラリを導入しない（バニラJS・CSS のみ）
- JS は `src/main.js`、CSS は `src/style.css` に分離する（Vite でビルド）
- 日本語コメント・日本語UI で統一する
- エラーハンドリングは `try/catch` + `alert()` でユーザーに通知する
- 付加情報の取得（視聴リンク・予告映像）は `Promise.all` で並列化し、片方が失敗しても結果表示は続行する

## 対応サブスク一覧と TMDb プロバイダーID

| サービス名    | TMDb ID | 地域 |
| ------------- | ------- | ---- |
| Amazon Prime  | 119     | 日本 |
| Netflix       | 8       | 日本 |
| U-NEXT        | 84      | 日本 |
| Hulu          | 356     | 日本 |
| Disney+       | 337     | 日本 |
| dアニメストア | 85      | 日本 |

## ジャンル対応表（18種類）

| ジャンル名       | TMDb ID | 説明                     |
| ---------------- | ------- | ------------------------ |
| コメディ         | 35      | 笑える作品               |
| ドラマ           | 18      | 泣ける・感動作品         |
| アクション       | 28      | ハラハラドキドキ         |
| アニメ           | 16      | 何も考えずに楽しむ       |
| ホラー           | 27      | 背筋が凍る恐怖           |
| SF               | 878     | 頭を使いながら楽しむ     |
| ファンタジー     | 14      | ファンタジーの世界に浸る |
| 犯罪             | 80      | 犯罪・陰謀のストーリー   |
| スリラー         | 53      | サスペンス・ドキドキ     |
| ロマンス         | 10749   | 恋愛ものが見たい         |
| ミステリー       | 9648    | 謎解きが好き             |
| アドベンチャー   | 12      | 冒険ものが好き           |
| 歴史             | 36      | 歴史ものが見たい         |
| ファミリー       | 10751   | 家族で見られるもの       |
| ミュージカル     | 10402   | 音楽・歌が好き           |
| ドキュメンタリー | 99      | 学べるコンテンツ         |
| 戦争             | 10752   | 戦争・冒険のダイナミック |

## 気分タイプ（UI用カテゴリ）

| 気分タイプ               | 値          | 絵文字 | 想定される視聴者           |
| ------------------------ | ----------- | ------ | -------------------------- |
| ロマンチック             | romantic    | 💕     | 恋愛ものやドラマが好き     |
| 興奮・サスペンス         | intense     | ⚡     | アクション・スリラーが好き |
| 深く考えさせられたい     | thoughtful  | 🤔     | SF・ミステリーが好き       |
| ゆったり・のんびり       | relaxing    | 😌     | ほっこり・癒し系が好き     |
| 冒険心をくすぐられたい   | adventurous | 🗺️     | ファンタジー・冒険が好き   |
| ダークな世界観に浸りたい | dark        | 🌙     | ホラー・サスペンスが好き   |

> 気分タイプはUIの結果ラベル表示のみに使用する。APIリクエストのパラメータには影響しない。

## フィルタオプション

| フィルタ   | 値           | 説明               | APIパラメータ                                  |
| ---------- | ------------ | ------------------ | ---------------------------------------------- |
| 人気作品   | popularity   | 人気作品を見たい   | sort_by=popularity.desc                        |
| 高評価のみ | vote_average | 評価が高い作品のみ | sort_by=vote_average.desc & vote_average.gte=7 |
| 最新作     | release_date | 最新作を見たい     | sort_by=release_date.desc                      |
| ランダム   | random       | とにかくおまかせ   | ランダムページ（1〜5）から選出                  |

## よくある改修タスク

### サブスクサービスを追加する

1. `index.html` の `<div id="providers">` 内にチェックボックスを追加
   ```html
   <input type="checkbox" id="p999" value="999">
   <label for="p999" class="has-logo">
     <img src="/src/assets/logos/newservice.jpg" alt="新サービス" title="新サービス" class="provider-logo-icon">
   </label>
   ```
2. `src/main.js` の `PROVIDER_WATCH_URLS` にURLを追加
   ```javascript
   999: (title) => `https://example.com/search?q=${encodeURIComponent(title)}`,
   ```
3. TMDbのプロバイダーIDは [TMDb Watch Providers API](https://developers.themoviedb.org/3/watch-providers/get-available-regions) で確認

### ジャンルを追加する

1. `<select id="mood-genre">` に `<option>` を追加
   ```html
   <option value="99">新ジャンル（説明）</option>
   ```
2. TMDbのジャンルIDは以下のAPIで確認可能:
   - 映画: `https://api.themoviedb.org/3/genre/movie/list?api_key=KEY&language=ja`
   - TV: `https://api.themoviedb.org/3/genre/tv/list?api_key=KEY&language=ja`

### 気分タイプを追加する

1. `<select id="mood-vibe">` に `<option>` を追加
   ```html
   <option value="new_vibe">新しい気分 🆕</option>
   ```
2. `src/main.js` の `VIBE_LABELS` に対応するラベルを追加
   ```javascript
   new_vibe: '🆕 新しい気分',
   ```

### フィルタオプションを追加する

1. `<select id="mood-filter">` に `<option>` を追加
2. `rollGacha()` 関数の条件分岐を拡張
   ```javascript
   if (filter === "new_filter") {
     sortBy = "new_parameter.desc";
   }
   ```

### サブスクの視聴リンクURLが壊れた場合

`src/main.js` の `PROVIDER_WATCH_URLS` の該当プロバイダーIDのURLを修正してビルド・デプロイする。

## 今後の改善案

### 短期（Easy）

- [ ] ダークモード対応
- [ ] 結果を共有する機能（Twitter/LINEシェア）
- [ ] 「もう一度回す」ボタンの追加（ガチャ再回転 — 現状は「もう一度回す」で同じボタンを再利用）

### 中期（Medium）

- [ ] 複数言語対応（英語、中国語など）
- [ ] モバイルアプリ化（React Native等）
- [ ] 履歴機能（過去に提案された作品の記録）
- [ ] 気分の更に細かい分類（時間帯別、季節別など）

### 長期（Hard）

- [ ] バックエンド実装（APIキー管理、ユーザー認証）
- [ ] ユーザー登録・マイページ機能
- [ ] 推奨履歴に基づくAIによる学習型提案
- [ ] 他国のサブスク対応（米国、欧州など）
- [ ] 映画館上映作品の情報追加

## 既知の制限事項

1. **提案の多様性**：人気上位20件からの選出のため、マイナー作品が選ばれにくい（ランダムモードは1〜5ページからランダム選出で緩和済み）

2. **あらすじの欠落**：一部作品でTMDb上にあらすじがない  
   → フォールバックテキスト「あらすじ情報がありません。とりあえず見てみましょう！」を表示済み

3. **APIレート制限**：TMDb APIには呼び出し回数制限あり（無料: 40 calls/10秒）  
   → 複数ユーザーの同時アクセス時に制限に達する可能性

4. **地域制限**：日本に配信されていない作品も一部含まれる可能性  
   → TMDbの地域情報更新の遅延が原因

5. **YouTube 予告映像の地域制限**：TMDbが返す動画キーが地域制限・削除されている場合がある  
   → 直接再生ではなく YouTube 検索URLに誘導することで回避済み

6. **サブスク視聴リンクのURL変更**：各サービスが検索URLを変更した場合404になる  
   → `PROVIDER_WATCH_URLS` を修正してデプロイで対応（U-NEXT: 2026-05-27 修正済み）

## デバッグ・開発時のTips

### ブラウザコンソールでのテスト

```javascript
// APIレスポンスの確認
const url = "https://api.themoviedb.org/3/discover/movie?api_key=YOUR_KEY&with_genres=35&language=ja-JP&watch_region=JP&with_watch_providers=8|119&with_watch_provider_types=flatrate";
fetch(url).then(r => r.json()).then(d => console.log(d));

// 特定作品のwatch providers確認
fetch("https://api.themoviedb.org/3/movie/{id}/watch/providers?api_key=YOUR_KEY")
  .then(r => r.json()).then(d => console.log(d.results?.JP));

// 特定作品の動画（予告）確認
fetch("https://api.themoviedb.org/3/movie/{id}/videos?api_key=YOUR_KEY&language=ja-JP")
  .then(r => r.json()).then(d => console.log(d.results));
```

### スタイル調整

- メインカラー（赤）: `#e74c3c` → 変更時は CSS の複数箇所を同時変更
- ボタンホバー色: `#c0392b` → 上記と合わせて統一感を保つ
- 選択済みプロバイダーの強調: `border-color: #3498db` + `box-shadow: 0 0 0 3px rgba(52,152,219,0.35)`

## 作者ノート

このプロジェクトは、「サブスクに登録してるのに何も見てない」という現代的な悩みから生まれました。

**座右の銘**：

> 「決定疲れを減らし、気軽に視聴体験を始めるツール」

複雑さを避け、気分に合わせた直感的な提案を実現することで、ユーザーが「とりあえず見てみる」という行動を促進することが目的です。
