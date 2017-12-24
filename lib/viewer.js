const fs = require('fs');
const $ = require('jquery');
const electron = require('electron');

const imgUtil = require('./lib/modules/image');
const fileUtil = require('./lib/modules/fileUtil');

// ディレクトリ内の画像リスト
let imgList;

$(() => {

    let { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

    let path = location.search.replace('?', '');
    let img = `<img src="${path}" style="max-height:${height}px;max-width:${width}px;">`;
    $('body').append(img);


    $('img').on('load', () => {
        window.resizeTo($('img').width(), $('img').height());
    });

    $(window).bind('keydown', (e) => {
        if (e.which == 27)
            window.close();
    });
    let imgPath = decodeURIComponent(path);

    let dir = fileUtil.directory(imgPath);
    fs.readdir(dir, (err, files) => {
        if (err) throw err;

        imgList = files.filter((file) => {
            return imgUtil.isImage(file);
        });

    });
});
