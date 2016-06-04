# 課題発表

---

## 課題概要 - コースB: Scheme以外の言語で実装する

* Mini-Schemeの仕様からTCOとマクロは省いてよい
* ホスト言語（実装するための言語）の関数やオブジェクトをMini-Scheme内から利用できるようにすること
* [オプション] ホスト言語側のプログラムからMini-Schemeの関数を呼び出せるようにすること
* [オプション] その他面白そうな言語機構
  * 例：CLOS風のオブジェクト指向言語機構, アクターモデル風の並行計算機構，リアクティブプログラミング，etc.

---

## 制作物概要

* サウンドプログラミングが出来るScheme
  * Software synthesizer
  * 関数を組み合わせて音声を生成する
* 実装言語は JavaScript (ES2015)
* HTML5 の WebAudio を利用して音声生成


---

## WebAudio APIについて

* ブラウザのみで高機能な音声処理を実現する一連のAPI群
* W3Cが策定し、Chrome をはじめとするモダンブラウザで実装されている
* 各種エフェクターや可視化のためのAPIが搭載されている

---

## 言語処理系部

* 構文解析はパーサコンビネータを自作
  * persimmon というライブラリを参考
* 純粋なインタプリタとして実装
* 処理系部はnodeでデバッグ

---

## コード例

* 音源(サイン波や音声ファイル)オブジェクトと、それを処理するエフェクト関数を組み合わせて音声処理を表現
* 処理系内部でエフェクトのノードオブジェクトを生成・結合している

---

## フィードバックについて

* エコーなどのエフェクトでは出力した音声を入力にフィードバックする必要がある
* しかし、関数を組み合わせる方式では単純にはいかない

---

## フィードバックについて

* そこで、feedback 構文を導入
* `(feedback f .... f ...)` → f が出力のオブジェクトであり、それがまた入力として使える
* これは、PCF の `fix` 構文が元となっている

---

## 実装機能

* 波形生成
  * 正弦波、ノコギリ波、三角波、四角波
* 音声ファイルの読み込み
* ディレイ
* ゲイン
* フィードバック
* 各種フィルタ
  * ローパス・ハイパス・バンドパス…など

---

## その他の機能

* ビジュアライザ
  * Canvasで描画
  * WebAudioの波形アナライザAPIを利用
* フィルタ構成の可視化
  * 内部オブジェクトの表現をグラフとして描画
  * mermaid.js というライブラリでSVGとして表示
* 普通のSchemeインタプリタとしても動作

---

## 今後の展望

* Live Programming
  * ソースを変更すると即時反映→インタラクティブにサウンドプログラミングが可能
* Web Audio の機能を更に活用
  * MIDIデバイスやマイクを使う
  * Schemeでインパルス関数などを定義してフィルタを設計
* GUIの強化
  * パラメータを調節できるスライダーなどを作る
  * より自由度の高いシンセサイザーに

---

## 今後の展望（音声を超えて）

* 一般の信号処理や制御設計に用いる
  * SimulinkのようなことをSchemeでやる
* 機械学習・ディープラーニング
  * フィードバックで再帰する部分がRNNやLSTMっぽい