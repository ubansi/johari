const fs = require('fs');
const $ = require('jquery');
const electron = require('electron');

const imgUtil = require('./lib/modules/image');
const fileUtil = require('./lib/modules/fileUtil');

// ディレクトリ内の画像リスト
let imgList;
// 画像のディレクトリ内での順番
let index;
// 表示モード
let pageMode = 1;

$(() => {
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
  let imgMaxWidth = Number(width / pageMode);

  let path = location.search.replace('?', '');
  let img = `<img src="${path}" style="max-height:${height}px;max-width:${imgMaxWidth}px;">`;
  $('#image-area').append(img);

  $('img').on('load', () => {
    window.resizeTo($('img').width(), $('img').height());
  });

  $(window).bind('keydown', (e) => {
    if (e.which == 27) {
      // esc
      window.close();
    }
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
        // right
        index = movePage(+1 * pageMode);
        changeImage(dir, index);
      }
      if (e.which == 37) {
        // left
        index = movePage(-1 * pageMode);
        changeImage(dir, index);
      }
      if (e.which == 32) {
        // space
        changePageMode();
        changeImage(dir, index);
      }
      if (e.which == 77) {
        // 'm'
        toggleMenu();
      }
    });

  });
});

function toggleMenu() {
  $('#menu-area').toggleClass('is-invisible');
}

// ページ循環
function movePage(page) {
  return (imgList.length + index + page) % (imgList.length);
}

function changePageMode() {
  if (pageMode == 1) {
    pageMode = 2;
  } else {
    pageMode = 1;
  }
}

function changeImage(dir, index) {

  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
  window.resizeTo(width, height);

  let nextImage = dir + '/' + imgList[index];
  $('#image-area').empty().append(`<img id="left-img" src="${nextImage}">`);
  $('#left-img').on('load', () => {
    windowResize();
  });

  if (pageMode == 2) {
    let nextImage = dir + '/' + imgList[movePage(+1)];
    $('#image-area').prepend(`<img id="right-img" src="${nextImage}">`);
    $('#right-img').on('load', () => {
      windowResize();
    });
  }

  windowResize();

}

function windowResize() {

  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
  let imgMaxWidth = Number(width / pageMode);

  if (pageMode == 1) {
    window.resizeTo($('#left-img').width(), $('#left-img').height());
  }
  if (pageMode == 2) {
    let imgWidth = Math.min($('#left-img').width() + $('#right-img').width() + 1, width);
    let imgHeight = Math.max($('#left-img').width(), $('#right-img').width(), height);
    window.resizeTo(imgWidth, imgHeight);
  }
  $('img').css('max-height', `${height}px`);
  $('img').css('max-width', `${imgMaxWidth}px`);
}