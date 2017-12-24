const fs = require('fs');
const $ = require('jquery');
const electron = require('electron');

const imgUtil = require('./lib/modules/image');
const fileUtil = require('./lib/modules/fileUtil');

// ディレクトリ内の画像リスト
let imgList;
let index;

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
    let imgName = fileUtil.path2File(imgPath);
    let dir = fileUtil.directory(imgPath);
    fs.readdir(dir, (err, files) => {
        if (err) throw err;

        imgList = files.filter((file) => {
            return imgUtil.isImage(file);
        });

        index = imgList.indexOf(imgName[0]);

        $(window).bind('keydown', (e) => {
            if (e.which == 39) {
                movePage(+1);
                let nextImage = dir + '/' + imgList[index];
                $('body').empty().append(`<img src="${nextImage}"">`);
            }
            if (e.which == 37) {
                movePage(-1);
                let nextImage = dir + '/' + imgList[index];
                $('body').empty().append(`<img src="${nextImage}"">`);
            }
        });

    });
});

// ページ循環
function movePage(page) {
    if (index + page >= imgList.length) {
        index = 0;
    } else if (index + page < 0) {
        index = imgList.length - 1;
    } else {
        index += page;
    }
} 