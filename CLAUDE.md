# CLAUDE.md — tonight-watch (サブスク迷子救済ガチャ)

このファイルはClaudeがこのリポジトリで作業する際のガイドです。

## プロジェクト概要

単一HTMLファイル (`index.html`) で完結するWebアプリ。  
TMDb APIを叩いて、ユーザーが選んだサブスクサービス・体力・ジャンルに合った映画やTV作品をランダムに1つ提案する。

```
tonight-watch/
└── index.html   ← アプリ全体（HTML + CSS + JS が1ファイルに同居）
```

ビルドツール・パッケージマネージャー・フレームワーク一切なし。

## 開発・動作確認

```powershell
# ブラウザで直接開くだけ（サーバー不要）
start index.html
```

変更後は `index.html` をブラウザでリロードするだけで反映される。

## ⚠️ 既知のバグ・改善予定

### ✅ 最近の改善（気分選択肢拡張）

- ジャンル選択肢を **5種類 → 18種類**に大幅拡張
- 新しく**「気分タイプ」セレクト**を追加（ロマンチック・興奮・思考的等）
- 新しく**「フィルタ」セレクト**を追加（人気順・高評価・新作・ランダム）
- 結果表示に**評価（⭐5.0形式）**を追加

## アーキテクチャ

`index.html` 内の構成：

| セクション | 内容 |
|-----------|------|
| `<head>` / `<style>` | CSS（全スタイルをインライン定義） |
| `<body>` | UI（サブスク・ジャンル・気分タイプ・フィルタセレクト・ガチャボタン・結果表示） |
| `<script>` | `rollGacha()` 関数 — 多段階バリデーション → TMDb API fetch → 結果レンダリング |

### `rollGacha()` の処理フロー（更新版）

```
1. チェックボックスからプロバイダーID取得（|区切りで結合）
2. セレクトボックスから以下を取得：
   - type: movie or tv
   - genreId: ジャンルID
   - vibe: 気分タイプ（UI表示用）
   - filter: ソート・フィルタ条件
3. filter に基づいてAPIパラメータを構成：
   - 'vote_average' → sort_by=vote_average.desc & vote_average.gte=7
   - 'release_date' → sort_by=release_date.desc
   - 'random' → sort_by=popularity.desc（ランダム幅を広げる）
   - 'popularity' → sort_by=popularity.desc（デフォルト）
4. TMDb Discover APIにfetch
5. filter='random' なら上位50件、それ以外は上位20件からランダム選択
6. 評価 ⭐ を含めて結果をレンダリング
```

## TMDb API

- **エンドポイント**: `https://api.themoviedb.org/3/discover/{movie|tv}`
- **言語**: `ja-JP`（日本語、あらすじが未翻訳の場合は英語にフォールバック）
- **地域フィルタ**: `watch_region=JP`（日本向け配信のみ）
- **ソート**: `sort_by=popularity.desc|vote_average.desc|release_date.desc`
- **評価フィルタ**: `vote_average.gte=7`（高評価のみに絞る）
- **ポスター画像**: `https://image.tmdb.org/t/p/w500{poster_path}`
- **APIキーの場所**: `index.html` の `const TMDB_API_KEY`

## コーディング規約

- フレームワーク・ライブラリを導入しない（バニラJS・CSS のみ）
- 全コードを `index.html` 1ファイルに収める
- 日本語コメント・日本語UI で統一する
- エラーハンドリングは `try/catch` + `alert()` でユーザーに通知する

## 対応サブスク一覧と TMDb プロバイダーID

| サービス名 | TMDb ID | 地域 |
|----------|---------|------|
| Amazon Prime | 119 | 日本 |
| Netflix | 8 | 日本 |
| U-NEXT | 84 | 日本 |
| Hulu | 356 | 日本 |
| Disney+ | 337 | 日本 |
| dアニメストア | 85 | 日本 |

## ジャンル対応表（18種類）

| ジャンル名 | TMDb ID | 説明 |
|----------|---------|------|
| コメディ | 35 | 笑える作品 |
| ドラマ | 18 | 泣ける・感動作品 |
| アクション | 28 | ハラハラドキドキ |
| アニメ | 16 | 何も考えずに楽しむ |
| ホラー | 27 | 背筋が凍る恐怖 |
| SF | 878 | 頭を使いながら楽しむ |
| ファンタジー | 14 | ファンタジーの世界に浸る |
| 犯罪 | 80 | 犯罪・陰謀のストーリー |
| スリラー | 53 | サスペンス・ドキドキ |
| ロマンス | 10749 | 恋愛ものが見たい |
| ミステリー | 9648 | 謎解きが好き |
| アドベンチャー | 12 | 冒険ものが好き |
| 歴史 | 36 | 歴史ものが見たい |
| ファミリー | 10751 | 家族で見られるもの |
| ミュージカル | 10402 | 音楽・歌が好き |
| ドキュメンタリー | 99 | 学べるコンテンツ |
| 戦争 | 10752 | 戦争・冒険のダイナミック |

## 気分タイプ（UI用カテゴリ）

| 気分タイプ | 値 | 絵文字 | 想定される視聴者 |
|----------|------|------|------------|
| ロマンチック | romantic | 💕 | 恋愛ものやドラマが好き |
| 興奮・サスペンス | intense | ⚡ | アクション・スリラーが好き |
| 深く考えさせられたい | thoughtful | 🤔 | SF・ミステリーが好き |
| ゆったり・のんびり | relaxing | 😌 | ほっこり・癒し系が好き |
| 冒険心をくすぐられたい | adventurous | 🗺️ | ファンタジー・冒険が好き |
| ダークな世界観に浸りたい | dark | 🌙 | ホラー・サスペンスが好き |

## フィルタオプション

| フィルタ | 値 | 説明 | APIパラメータ |
|--------|-----|-----|-------------|
| 人気作品 | popularity | 人気作品を見たい | sort_by=popularity.desc |
| 高評価のみ | vote_average | 評価が高い作品のみ | sort_by=vote_average.desc & vote_average.gte=7 |
| 最新作 | release_date | 最新作を見たい | sort_by=release_date.desc |
| ランダム | random | とにかくおまかせ | 上位50件から選出 |

## よくある改修タスク

### サブスクサービスを追加する

1. チェックボックスのHTMLを `<div id="providers">` 内に追加
   ```html
   <input type="checkbox" id="p999" value="999"><label for="p999">新サービス名</label>
   ```
2. TMDbのプロバイダーIDは [TMDb Watch Providers API](https://developers.themoviedb.org/3/watch-providers/get-available-regions) で確認

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
   - UIには表示されるが、APIリクエストには影響しない（参考情報）

### フィルタオプションを追加する

1. `<select id="mood-filter">` に `<option>` を追加
2. `rollGacha()` 関数の条件分岐を拡張
   ```javascript
   if (filter === 'new_filter') {
       sortBy = 'new_parameter.desc';
   }
   ```

## 今後の改善案

### 短期（Easy）
- [ ] ダークモード対応
- [ ] 結果を共有する機能（Twitter/LINEシェア）
- [ ] 「また別の作品」ボタンの追加（ガチャ再回転）

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

1. **提案の多様性**：人気上位20件からの選出のため、マイナー作品が選ばれにくい
   - **対応案**：ランダムなページをリクエストする、またはスコア下限を設定

2. **あらすじの欠落**：一部作品でTMDb上にあらすじがない
   - **対応案**：フォールバックテキストを表示済み

3. **APIレート制限**：TMDb APIには呼び出し回数制限あり（無料: 40 calls/10秒）
   - 影響：複数ユーザーの同時アクセス時に制限に達する可能性

4. **地域制限**：日本に配信されていない作品も一部含まれる可能性
   - 理由：TMDbの地域情報更新の遅延

## デバッグ・開発時のTips

### ブラウザコンソールでのテスト
```javascript
// APIレスポンスの確認
const url = 'https://api.themoviedb.org/3/discover/movie?api_key=YOUR_KEY&with_genres=35&language=ja-JP';
fetch(url).then(r => r.json()).then(d => console.log(d));

// 特定のプロバイダIDで検索
// with_watch_providers=8|119  → NetflixとAmazon Prime
```

### スタイル調整
- メインカラー（赤）: `#e74c3c` → 変更時は CSS の 3箇所を同時変更
- ボタンホバー色: `#c0392b` → 上記と合わせて統一感を保つ

## ファイル構成

```
tonight-watch/
├── index.html          （メイン - HTML/CSS/JS一体型）
├── README.md           （ユーザー向けドキュメント）
└── CLAUDE.md           （開発者・Claudeとの対話用情報）
```

## 作者ノート

このプロジェクトは、「サブスクに登録してるのに何も見てない」という現代的な悩みから生まれました。

**座右の銘**：
> 「決定疲れを減らし、気軽に視聴体験を始めるツール」

複雑さを避け、気分に合わせた直感的な提案を実現することで、ユーザーが「とりあえず見てみる」という行動を促進することが目的です。
