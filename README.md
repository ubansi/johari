Johari
====

Electronの画像ビューアです。
A image viewer by Electron.

## Description
### Top
データベースに追加されている画像を一覧で表示します。

Menuからディレクトリを追加すると、ディレクトリ内の画像がデータベースへ追加されます。

Searchに文字を入力するとタグの候補が現れ、
候補をクリックすると選択したタグが付いている画像のみが一覧に表示されます。

画像をクリックすると縁無しで画面サイズに合わせて表示します。(Viewerへ移行)

### Viewer
左右キーで前後の画像へ移動できます。

Mを押すと画像に対してタグ付けなどの操作が行えます。

Escを押すとViewerを終了します。

### Tips
名前の由来は「浄玻璃の鏡」です。

## Screen shot

![screen shot](https://github.com/ubansi/johari/blob/img/img/johari_sample.png)

## Requirement
* node.js
* electron

## Usage
現在は開発者向けバージョンのみとなっています。

起動

`$ npm start`

windows向けリリースコマンド例

`$ electron-packager . johari --platform=win32 --arch=x64 --icon=icon.ico --version=1.4.13`

## Install
`$ npm install`

## Lint
`$ npm run lint`

## Test
`$ npm test`

## Contribution
歓迎します。
日本語で書いてると早いかもしれないです。

1. Fork
2. Feature Branchで作業
3. Lint and Test
4. Commit
5. Pull Requestを作成

## Licence

[MIT](https://github.com/ubansi/johari/blob/master/LICENSE)