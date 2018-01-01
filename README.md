Johari
====

Electronの画像ビューアです。
A image viewer by Electron.

## Description
ディレクトリ内の画像を一覧で表示します。

ディレクトリ内に別のディレクトリがある場合はそのディレクトリの画像ファイルをサムネイルとし、画像と同じように並べられます。

画像をクリックすると縁無しで画面サイズに合わせて表示します。

左右キーで前後の画像へ移動できます。

スペースを押すと画像を2枚表示にできます。

名前の由来は「浄玻璃の鏡」です。

将来的に画像にタグ付けをおこない整理できるようにしようと考えています。

## Screen shot

![screen shot](https://github.com/ubansi/johari/blob/img/img/johari_sample.png)

## Requirement
* node.js
* electron

## Usage
現在は開発者向けバージョンのみとなっています。

起動

`$ npm run start`

windows向けリリースコマンド例

`electron-packager . johari --platform=win32 --arch=x64 --icon=icon.ico --version=1.2.6`

## Install
`$ npm install`

## Lint
`$ npm run lint`

## Test
`$ npm run test`

## Contribution
歓迎します。
日本語で書いてると早いかもしれないです。

1. Fork
2. Feature Branchで作業
3. Lint and Test
4. Commit
5. Pull Requestを作成

## Licence

[MIT](https://github.com/tcnksm/tool/blob/master/LICENCE)
