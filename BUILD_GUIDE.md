# BUILD_GUIDE.md

このリポジトリの講義ノート HTML を増補・再生成するためのリファレンス。
将来の自分（Claude）が「同じ流儀でページを追加・改稿する」ためのチェックリスト。

ユーザー向けの説明文ではない。**HTMLにこのファイルの内容を出力しないこと**。

---

## 1. プロジェクトの概要

- 講義ノートを科目ごとに HTML 化し、6 教科をフォルダ分けして配置する。
- Notion 上の元ノートを **HTML として読みやすく再構成** したもの。Notion を補完するのではなく **置き換える** 立ち位置。
- 今後も**継続的に更新**される（教科 6 つは固定、各教科の中で回数が増えていく）。
- 6 教科で確定（追加しない）：
  - 物理学基礎論A（古典力学 / 水4）
  - 線形代数（数学 / 水3）
  - 微積（数学 / 火4）
  - 自然現象と数学（数学・統計 / 水2）
  - 情報学概論（情報学 / 火2）
  - 情報AI基礎（計算機科学 / 月4。情報AI基礎 *演習* は別科目で扱わない）

---

## 2. ディレクトリ構成

```
HTML移行計画/
├─ index.html              ルート（科目一覧）
├─ assets/
│   ├─ style.css           共通スタイル
│   └─ head.html           参考用テンプレート（実ページには直書きしている）
├─ BUILD_GUIDE.md          本書
├─ 物理学基礎論A/
│   ├─ index.html
│   ├─ 01.html, 02.html, ...
│   └─ extra-*.html（番外編）
├─ 線形代数/
├─ 微積/
├─ 自然現象と数学/
├─ 情報学概論/
└─ 情報AI基礎/
```

科目フォルダ名は **日本語そのまま**。ユーザーが Notion DB 上の名称と揃えたい意向。

---

## 3. ファイルテンプレ（個別講義 HTML）

毎回このスケルトンから始める。MathJax は全ページに、Mermaid は使う回だけ追加。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>第N回 サブタイトル ｜ 科目名</title>
<link rel="stylesheet" href="../assets/style.css">
<script>
  window.MathJax = {
    tex: { inlineMath: [['$', '$'], ['\\(', '\\)']], displayMath: [['$$', '$$'], ['\\[', '\\]']] },
    svg: { fontCache: 'global' }
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js" defer></script>
<!-- Mermaid を使う回だけ追加：
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
</script>
-->
</head>
<body>
<header class="site">
  <div class="crumbs"><a href="../index.html">共有ノート</a> ／ <a href="index.html">科目名</a> ／ 第N回</div>
</header>

<main>
  <h1>第N回 サブタイトル</h1>
  <div class="meta">
    <span class="tag">講義</span>
    <span>YYYY/MM/DD</span>
    <span>教室名</span>
  </div>

  <!-- 本文 -->

  <nav class="pager">
    <a href="01.html" class="prev">前回タイトル</a>
    <a href="03.html" class="next">次回タイトル</a>
  </nav>
</main>

<footer class="site">情報学科・共有ノート</footer>
</body>
</html>
```

科目 index は `lectures` グリッドに `lecture-card` を並べる。中身は `01.html` の冒頭メタを参照。

---

## 4. 確定しているユーザールール（重要）

メモリ（`~/.claude/projects/.../memory/`）に保存済みだが要約：

| ルール | 内容 |
|---|---|
| 絵文字を使わない | 装飾目的の 📚 📅 🏫 ⚠️ 💡 等を見出し・パンくず・コールアウトに入れない。本文中に元ノートで使われていても外す |
| 証明は `<details>` トグル | 定理・命題のステートメントと「気持ち／方針」は本文で見せ、証明・導出・厳密計算はトグル内へ |
| SVG 内では MathJax 記法を使わない | `<text>` の中身に `$\sum$` を書くと空白になる。Σ aₙ → 0 のように Unicode で |
| メタな文言を入れない | 「Notion より読みやすく」「サンプル公開」「Xサーバーアップ手順」「全N回」等は禁止。**継続更新するので回数を書くと面倒**になる |
| 個人/施設情報を出さない | **日付（YYYY/MM/DD）・講師名（担当：…）・教室名（共西31, 教育院棟…）** を本文・meta・lecture-card のいずれにも書かない。曜日・時限（例「水曜 4 限」）は OK |
| ホームリンク強調 | CSS で先頭の crumbs を家アイコン付きピル型ボタンにしている。HTML 側は `<a href="../index.html">共有ノート</a>` のままで OK |

---

## 5. 教科ごとの編集方針（重要）

過去ユーザーが教科ごとに異なる注文を出した。教科を改稿するときはこの方針を引き継ぐ。

### 物理学基礎論A
- 古典力学。**図を積極的に**（力のベクトル図、振動の波形、回路図など）。
- 数式は MathJax。`<details>` トグルで導出を格納。

### 線形代数
- 行列演算と幾何イメージの両立。
- 行列積の概念図、回転行列、ブロック分割、全射・単射・全単射の 3 パネル等を SVG で。

### 微積
- **証明は厳密に**。Notion で省略されているステップを完全に補完する。
- 主張・気持ち・図はトグル外、**証明・展開はトグル内**。
- 例：定理 1.1 の Step 1〜3、$\bigl(1+1/n\bigr)^n \to e$ の Step 1〜4、コーシー積の $P_N - Q_N \to 0$ など、全段の式変形を埋める。

### 自然現象と数学
- **計算が重い科目。途中計算を省略しない**。すべてトグル内で完全展開する。
- 補完済みの代表例：不偏分散の $E[\hat s^2] = \sigma^2$、Welford アルゴリズム、Cauchy–Schwarz、最小二乗解 5 ステップ＋ヘッセ行列、ポアソン分布の極限導出、ラグランジュ未定乗数法の 4 ステップ、正規分布の最尤推定。
- 新しい回も同じ流儀で。

### 情報学概論
- **事柄が広く並ぶ**ので、各回の冒頭に「**この回の流れ**」セクション＋ボックス並びの SVG 図を置き、章番号と内容が一望できるようにする。
- 図には「① 〜 ⑤」のステップ番号、矢印、3 パート構成などを使う。

### 情報AI基礎
- 古典コンピュータの具体的仕組みを扱う。**仕組み全体の概要が掴めるように**。
- 各回の冒頭に **全体像 SVG**（科目構成、CPU+メモリ、フェッチ→デコード→実行サイクル、ソフトウェア階層など）を必ず入れる。

---

## 6. CSS で使える既存クラス

`assets/style.css` 参照。主なもの：

| クラス | 用途 |
|---|---|
| `header.site` ／ `.crumbs` | 上部スティッキーヘッダーとパンくず（先頭の `<a>` が自動でホームボタン化） |
| `main` | 中央寄せの本文コンテナ（max-width 880px） |
| `.meta` | 講義のメタ情報（日付・教室など）。`.tag` を含むと色付きピル |
| `.callout` | 黄色背景のコールアウト。「気持ち」「注意」「要点」用 |
| `details / summary` | ユーザールールにより**証明・導出はここに格納**。summary は「証明」「導出」「方針」など短く |
| `table` | thead に背景色、 td にボーダー |
| `figure / figcaption` | SVG 図とキャプション |
| `.mermaid` | Mermaid を中央寄せ |
| `nav.pager` | 前後の講義への移動。`.prev` / `.next` で矢印自動付与 |
| `.lectures` グリッド ＋ `.lecture-card` | 科目 index で講義一覧を並べる |
| `footer.site` | ページ末尾 |

---

## 7. SVG ガイド

### 基本

- viewBox を指定。`role="img" aria-label="..."` を付ける。
- 色はサイトの変数に合わせる：accent `#4f46e5`、orange `#d97706`、red `#dc2626`、green `#059669`、gray `#9ca3af`、background `#fff`。
- 矢印は `<defs><marker>` で定義して `marker-end="url(#name)"` を使う。
- 1ファイルに複数 SVG がある場合、`marker` の id を重複させない（`ar1`, `ar2`, `arS` のように一意化）。

### viewBox からのはみ出しに注意（過去ミス）

過去に線形代数 第3回の「全射・単射・全単射」3 パネル図で **右端が見切れた**。原因は viewBox 幅 540 に対し、3 つ目のパネルを `transform="translate(370, 0)"` で配置し、その中の楕円が `cx=155, rx=28` で **右端 = 370+155+28 = 553** と viewBox を超えていた。

予防策：

- SVG を書き終えたら、**最も右／下にある要素の絶対座標**（`transform="translate(x,y)"` を加算した後）を mentally に計算し、viewBox 内に収まることを確認する。
- 楕円・円は `cx + rx`、矩形は `x + width`、テキストは `x + 文字列幅見積もり` で右端を出す。
- マーカー（矢印頭）も座標を伸ばすので、ライン終点に約 8px 余裕を見る。
- パネルを並べる多段レイアウトでは、各パネル幅を `viewBox_width / パネル数` にきっかり収めるのではなく、**両端と区切りに余白（20px 以上）を残す**。
- 不安なときは viewBox を少し広めに取る（width に +20〜40 のマージン）。

### SVG 内テキストでの数式

MathJax は SVG `<text>` の中身を処理しない。**Unicode で書く**。

| LaTeX | Unicode |
|---|---|
| `\sum` | Σ |
| `\prod` | Π |
| `\int` | ∫ |
| `a_n`, `x_0` | aₙ, x₀ |
| `x^2`, `x^n` | x², xⁿ |
| `\to`, `\leq`, `\geq`, `\ne`, `\pm` | →, ≤, ≥, ≠, ± |
| ギリシャ文字 | α β γ δ ε θ λ μ π σ φ ω そのまま |
| 上付き添字 | ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ |
| 下付き添字 | ₀₁₂₃₄₅₆₇₈₉₊₋ₙₘₖᵢⱼ |

どうしても複雑な数式が必要なら `<foreignObject>` で HTML を埋めて MathJax を効かせる手もあるが、基本は Unicode で十分。

---

## 8. トグル運用パターン

定理・命題のひな型：

```html
<div class="callout">
  <strong>定理 X.</strong> 主張のステートメント。
</div>

<p><strong>気持ち</strong>。なぜこれが成り立つか、直観的な絵。</p>

<details>
  <summary>証明</summary>
  <p>Step 1: …</p>
  $$ \ldots $$
  <p>Step 2: …</p>
  ...
  <p>$\quad\square$</p>
</details>
```

長い証明は複数の `<details>` に分けて Step ごとに区切る（微積の単調収束定理、自然現象と数学の最小二乗法 5 ステップが典型例）。

---

## 9. 講義ノートを追加するときの手順

1. Notion から該当回ページを `mcp__notion-fetch` で取得。
2. 「大きな絵 / この回の流れ」を 2〜3 行で要約。情報学概論なら俯瞰 SVG も。
3. 本文を上記教科ごとの方針に従って書く。
   - 元ノートが省略している箇所があれば（特に微積・自然現象と数学）**自分で計算を補完する**。
   - 元ノートにある絵文字・余計な装飾を外す。
4. 主張・直観は本文、証明・導出はトグルへ。
5. 図が活きるなら SVG を入れる（数式記法に注意）。
6. 末尾の `nav.pager` で前後の回にリンクする。回数が増えるたびに既存ファイルの「次回」リンクも更新する。
7. 科目 index の `.lectures` に `<a class="lecture-card">` を追加。
8. ルート index は **触らなくてよい**（科目カードはすでに 6 つ並んでいる）。
9. **応答の最後に「アップロードすべきファイル／フォルダ」を必ず提示する**（次節）。

## 9.1. 更新後のアップロード対象を必ず告知する

ユーザーは手で X サーバーに上げ直す。応答の末尾で **どこを再アップすればよいか** を明示する。原則：

- **1〜2 ファイルだけ触った**：そのファイルパスをそのまま列挙
  - 例：「`微積/04.html` を再アップ」
- **同一科目内で 3 ファイル以上、または assets/index 改変**：そのフォルダ全体
  - 例：「`微積/` フォルダ全体を再アップ」
- **ルート index、共通 CSS、新規科目フォルダ追加**：影響範囲を全部書く
  - 例：「`index.html` と `assets/style.css` を再アップ（CSS 変更は全ページに影響）」
- 何も触っていない（質問だけ）なら言及しない

---

## 10. やらないこと

- ルート index に「公開予定」「準備中」「順次追加」等のステータスを書かない。
- 科目 index に「全N回」と回数を書かない（更新で陳腐化する）。
- 「Notion より良いものを目指す」「サンプル」「Xサーバーアップ手順」などのメタ説明を残さない。
- 個別講義の **日付・講師名（担当：…）・教室名**を出さない。lecture-card の `.date` も日付では使わない。`<div class="meta">` には講義タグ＋（科目 index なら曜日・時限）程度に留める。
- 絵文字（📚 📅 🏫 ⚠️ 💡 ▶ ️など装飾用）を入れない。
- SVG `<text>` 内に `$...$`（MathJax 記法）を書かない。

---

## 11. GitHub Pages 公開 + コメント機能

X サーバー手動アップロードとは別系統で、**GitHub Pages による公開** と **Firebase Firestore による匿名コメント機能** をセットアップ済み。

### 11.1 仕組み

- 各ページの `</body>` 直前に `<script type="module" src=".../assets/comments.js"></script>` を仕込んである（追加方法は `tools/inject-comments-script.ps1`）
- `assets/comments.js` が `<main>` 内の `h2 / h3 / p / figure / details` に **テキスト由来の決定論的 anchor-id** を振り、Firestore からそのページのコメントを取得・表示する
- 各アンカー要素をホバーすると左に「＋」ボタン、コメントがあれば右に色付きバッジが出る。クリックでパネル展開
- 投稿種類は3つ：💬コメント（青） / ❓質問（黄） / ⚠️間違い指摘（赤）
- 匿名投稿可。本文1000文字／名前40文字までを Firestore Security Rules で制限

### 11.2 初回セットアップ

1. **Firebase プロジェクト作成**（無料 Spark プラン、クレカ不要）
2. **Firestore Database** を「本番モード」で有効化（リージョン: `asia-northeast1` 推奨）
3. Firestore → ルール画面に `firestore.rules` の内容を貼り付け → 公開
4. プロジェクト設定 → マイアプリ → ウェブアプリを登録 → 出てくる `firebaseConfig` を `assets/firebase-config.js` の `REPLACE_ME` 部分に転記
5. GitHub でリポジトリ作成 → `git init && git add . && git commit -m "init" && git push`
6. GitHub リポジトリ Settings → Pages → Source: `main` ブランチ `/ (root)` → 数十秒で `https://<user>.github.io/<repo>/` で公開

### 11.3 ローカル動作確認

```
cd "HTML移行計画 - コピー"
python -m http.server 8000
# → http://localhost:8000/ をブラウザで開く
```

`file://` だと ES module の CORS で動かないので **必ずローカルサーバー経由**。

### 11.4 新しい HTML を追加したとき

`tools/inject-comments-script.ps1` を再実行する（冪等：既に注入済みのファイルはスキップ）。

```
powershell -ExecutionPolicy Bypass -File .\tools\inject-comments-script.ps1
```

### 11.5 注意：本文編集と anchor-id の関係

anchor-id は **段落テキストの先頭60文字のSHA-1** で決まる。段落のテキストを書き換えると id が変わり、その段落についていたコメントは「未紐付け投稿」セクション（ページ末尾）に移動する（消えない）。

意図的に過去コメントを残したい段落は、本文の言い回しを大きく変えないこと。

### 11.6 Firebase 無料枠の上限

Spark プラン（無料）の Firestore 上限：
- 1日あたり **読み取り 5万 / 書き込み 2万 / 削除 2万**
- ストレージ **1GB**

個人ノートサイトなら通常まったく届かない。Firebase Console の "使用量" タブで監視可能。

### 11.7 スパム対策（必要になったら）

匿名運用なので荒らされる可能性あり。対策の優先順：

1. Firebase Console → App Check を有効化（reCAPTCHA v3）→ ボット投稿を自動弾き
2. Firebase Auth で「Googleログイン者のみ投稿可」に切替（`firestore.rules` を `request.auth != null` で絞る）
3. ひどい投稿は Firebase Console → Firestore Database から手動削除（`/comments/{id}`）

### 11.8 X サーバー（手動アップロード先）への影響

GitHub Pages と X サーバーは **同じソースから別経路で配信** している関係。`assets/comments.js` を含む HTML を X サーバーにアップしても、`firebase-config.js` が同じものを指していれば **両方の配信元で同一のコメントDBを共有** することになる。

これを避けたい場合は X サーバー向けには `<script type="module" src=".../comments.js">` の行を削除したファイルをアップする運用にする。

---

## 12. やらないこと（コメント機能関連）

- `firestore.rules` のルールを甘くしない（読み取り/書き込み無制限 = 即スパム地獄）
- `firebase-config.js` の Service Account キー（管理者キー）をリポジトリに置かない（Web SDK の apiKey は OK、Admin SDK のキーは絶対 NG）
- コメントスクリプトを `<head>` 内に置かない（既存の MathJax/Mermaid と読み込み順序で干渉する恐れ）
