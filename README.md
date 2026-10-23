# pstack for OpenCode

Lauren Tan（poteto）の [pstack](https://github.com/cursor/plugins/tree/main/pstack) を OpenCode 向けに移植したものです。[michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude) の Claude Code 版を土台に、OpenCode のコマンド、サブエージェント、モデルルーティング、自動ルーティングに合わせて作り直しています。

pstack は「速く進みたいなら、まず深く潜れ」という方針のエージェント・ワークフロー集です。コードを増やすのではなく、減らしながら検証された変更だけを残すことを狙います。`poteto-mode` がタスクに合うプレイブックを選び、必要なスキルを呼び出します。

## Claude Code 版との違い

Claude Code 版はスキルを `~/.agents/skills/` に置くだけで OpenCode でも読めますが、次のものは提供していません。

- `/poteto-mode` などのスラッシュコマンド
- `poteto-agent`、`comment-sicko`、thermo-nuclear レビュアーのサブエージェント定義
- ロールごとのモデルルーティング
- セッション開始時の自動ルーティング

この移植では、それらを OpenCode の仕組みで追加しています。

| 機能 | Claude Code 版 | この移植 |
| --- | --- | --- |
| スキル | `skills/` | `~/.config/opencode/skills/` |
| コマンド | スキルが `/pstack:<name>` になる | `commands/<name>.md` が `/<name>` になる |
| サブエージェント | `pstack:poteto-agent` | `poteto-agent` |
| モデル指定 | `Agent` の `model` | ロール別エージェントに固定 |
| 自動ルーティング | SessionStart フック | OpenCode プラグインの `context` フック |
| モデル設定 | `~/.claude/pstack-models.md` | `~/.config/opencode/pstack-models.md` |

## 必要環境

- OpenCode 2.1.3 以降
- `git`
- PR ワークフローを使う場合は GitHub CLI（`gh`）
- `watch-pr` や `orch` を使う場合は Bun

## インストール

```sh
git clone https://github.com/<your-name>/pstack-opencode.git
cd pstack-opencode
./install.sh
```

グローバル設定（`~/.config/opencode`）にスキル、コマンド、エージェント、プラグインをリンクします。既存ファイルは上書きしません。

プロジェクト単位で入れたい場合:

```sh
cd /path/to/project
/path/to/pstack-opencode/install.sh --project
```

`./.opencode/` にリンクします。プロジェクト設定はグローバル設定より優先されます。

コピーで入れたい場合:

```sh
./install.sh --copy
```

`XDG_CONFIG_HOME` を使っている場合は、その配下の `opencode` が対象になります。明示したい場合は `OPENCODE_CONFIG_DIR` を設定してください。

インストール後に OpenCode を再起動するか、新しいセッションを開始してください。

### 最初の設定

```text
/setup-pstack
```

`opencode models` で利用可能なモデルを検出し、ロールごとのモデルを `~/.config/opencode/pstack-models.md` に書き込みます。モデルを分けなくても動きますが、パネル（`arena`、`architect`、`interrogate`）は異なるモデルにすると効果的です。

## 使い方

```text
/poteto-mode 検索フィルタがページ変更でリセットされるバグを直して
```

`poteto-mode` がタスクに合うプレイブックを選び、必要に応じて `how`、`why`、`architect`、`arena`、`interrogate`、`swarm` などを呼び出します。

直接スキルを呼ぶこともできます。

```text
/how 実行のキャンセルはどう動く？ N+1 はある？
/interrogate このPRをレビューして
/tdd このバグを再現するテストを先に書いて
```

コマンド一覧は [docs/reference.md](docs/reference.md) にあります。

### todo を使う

OpenCode の todo ツールを有効にすると、`poteto-mode` がプレイブックの手順を todo として管理します。

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "experimental": {
    "todo": true
  }
}
```

有効にしない場合は `.audit/<task-slug>.todo.md` にチェックリストを書きます。

## モデルルーティング

Claude Code の `Agent` ツールは `model` を受け取れますが、OpenCode の `subagent` ツールはエージェントIDだけを受け取ります。そこで pstack はロールごとに専用のサブエージェントを用意し、プラグインが `pstack-models.md` の値をそのエージェントの `model` に適用します。

例:

```markdown
feature, refactoring: anthropic/claude-sonnet-4-5
bug-fix: anthropic/claude-opus-4-1#high
judgment and prose: anthropic/claude-opus-4-1
strongest judgment: anthropic/claude-opus-4-1#max
arena runners: anthropic/claude-opus-4-1, openai/gpt-5.1, google/gemini-3-pro
default effort: high
session hook: on
```

- `provider/model` は OpenCode のモデル参照です。
- `#high` のようにモデルバリアントを指定できます。
- `inherit-parent` または `auto` は親セッションのモデルを使います。
- パネルはカンマ区切りで、先頭から `pstack-panel-1` から `pstack-panel-4` に対応します。
- `session hook: off` で自動ルーティングを止められます。

ロールとエージェントの対応は [skills/poteto-mode/references/opencode-tools.md](skills/poteto-mode/references/opencode-tools.md#role-agents) にあります。

`pstack-models.md` を編集すると、次のプロンプトでプラグインが変更を検出して反映します。

## サブエージェント

| エージェント | 用途 |
| --- | --- |
| `poteto-agent` | 汎用の実装代行 |
| `pstack-feature` | 機能追加・リファクタリング |
| `pstack-bug-fix` | バグ修正 |
| `pstack-perf` | パフォーマンス問題 |
| `pstack-hillclimb` | メトリクスの継続改善 |
| `pstack-judgment` | 判断・文章 |
| `pstack-strongest` | 最も難しい判断 |
| `pstack-how-*` | `how` の調査・説明 |
| `pstack-why-*` | `why` の調査・統合 |
| `pstack-reflect-*` | `reflect` のレビュー |
| `pstack-panel-1` から `pstack-panel-4` | `arena`、`architect`、`interrogate` のパネル |
| `pstack-swarm-worker` | `swarm` のワーカー |
| `comment-sicko` | コメント削除レビュー（読み取り専用） |
| `thermo-nuclear-review-subagent` | バグ・セキュリティ監査（読み取り専用） |
| `thermo-nuclear-code-quality-review-subagent` | 保守性監査（読み取り専用） |

読み取り専用エージェントは `edit` を拒否します。`poteto-agent` と実装系のロールだけがファイルを編集できます。

## 自動ルーティング

プラグインが各モデルリクエストのシステムプロンプトに短い指示を追加します。

- 複数ファイルに触る変更
- 共有シグネチャの変更
- 設計・アーキテクチャの判断
- 原因不明のバグ
- パフォーマンス問題

に該当するとき、`poteto-mode` を読み込むよう促します。小さいタスクは直接進めます。

止めたい場合は `pstack-models.md` に次を書きます。

```text
session hook: off
```

## モデルを変えたとき

`/setup-pstack` を再実行するか、`pstack-models.md` を直接編集してください。プラグインがファイルの変更を検出して、次のプロンプトでロールエージェントに適用します。

## アンインストール

```sh
./uninstall.sh
```

このチェックアウトへのシンボリックリンクだけを削除します。コピーで入れた場合や、強制的に消す場合:

```sh
./uninstall.sh --force
```

`~/.config/opencode/pstack-models.md` は `--force` を付けたときだけ削除します。

## 構成

```text
skills/                      65 スキル（41 公開 + 24 principles）
commands/                    公開スキルごとの /<name> コマンド
agents/                      pstack のサブエージェント
plugins/pstack.ts            モデル適用と自動ルーティング
hooks/session-start.md       自動ルーティングの本文
examples/pstack-models.md    モデル設定の雛形
install.sh                   グローバル / プロジェクトへのインストーラ
```

## 既知の制約

- OpenCode の `subagent` にモデル指定はありません。ロールごとにエージェントを分けて対応しています。
- パネル用の 4 エージェントは `arena`、`architect`、`interrogate` で共有です。`arena runners`、`architect runners`、`interrogate reviewers`、`arena cross-judge pool` の順に調べ、最初に実モデルが入っているリストを使います。3 つのロールに別々のリストを書いた場合、すべて `inherit-parent` でない最初のロールが優先されます。同じリストを書くか、`pstack-panel-*` エージェントを直接編集してください。
- OpenCode のサブエージェントは既定で 1 階層までです。`poteto-mode` の親チャットがすべての spawn を持ちます。
- `SessionStart` フックは OpenCode にないため、`context` フックで毎リクエスト注入します。
- 自動ルーティングは全エージェントに効きますが、`poteto-agent`、`pstack-*`、`comment-sicko`、thermo-nuclear の各エージェントには注入しません。

## ライセンスと帰属

MIT。元の pstack は Lauren Tan（poteto）、Claude Code 版は Michael Denyer、cursor-team-kit と thermos の一部は Cursor によるものです。詳細は [NOTICE.md](NOTICE.md)、[LICENSE](LICENSE)、[LICENSE-cursor-team-kit](LICENSE-cursor-team-kit)、[LICENSE-thermos](LICENSE-thermos) を参照してください。
