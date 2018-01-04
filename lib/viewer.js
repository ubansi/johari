const fs = require('fs');
const $ = require('jquery');
const electron = require('electron');
const Datastore = require('nedb');

const imgUtil = require('./lib/modules/image');
const fileUtil = require('./lib/modules/fileUtil');
const imgDB = new Datastore({
  filename: 'db/images.db',
});
const tagDB = new Datastore({
  filename: 'db/tag.db',
});


// ディレクトリ内の画像リスト
let imgList;
// 画像のディレクトリ内での順番
let index;
// 表示モード
let pageMode = 1;
let menuMode = false;
let inputMode = false;

$(() => {
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
  let imgMaxWidth = Number(width / pageMode);

  const params = param2obj(location.search);
  const path = params.path;
  const imageId = params.id;

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

  // tag input event
  $('#tag-input').on('focus', () => {
    inputMode = true;
  });

  $('#tag-input').on('blur', () => {
    inputMode = false;
  });

  // create viewer index
  imgDB.loadDatabase();
  imgDB.find({}, (err, imgs) => {
    imgList = imgs;
    imgs.some((image, idx) => {
      if (image._id == imageId) {
        index = idx;
        return true;
      }
    });

    $('#tag-add-button').on('click', () => {
      let nowImage = imgList[index];
      let newTag = $('#tag-input').val();
      let tags = nowImage.tags || [];
      tagDB.loadDatabase();
      tagDB.update({ name: newTag }, { $set: { name: newTag } }, { upsert: true }, (err, num, upsert) => {
        tags.push(upsert._id);
        imgDB.update({ _id: imageId }, { $set: { tags: tags } },(err,num)=>{
          $('#tag-input').val('');
        });
      });
      
    });

    $(window).bind('keydown', (e) => {
      if (!inputMode) {
        if (e.which == 39) {
          // right
          index = movePage(+1 * pageMode);
          changeImage(index);
        }
        if (e.which == 37) {
          // left
          index = movePage(-1 * pageMode);
          changeImage(index);
        }
        if (e.which == 32) {
          // space
          changePageMode();
          changeImage(index);
          if (menuMode) {
            toggleMenu();
          }
        }
        if (e.which == 77) {
          // 'm'
          toggleMenu();
        }
      }
    });
  });

});

function param2obj(search) {
  const paramStr = search.replace('?', '');
  const splitedParam = paramStr.split('&');
  let result = {};
  splitedParam.forEach(param => {
    const params = param.split('=');
    const name = params[0];
    const val = params[1];

    result[name] = val;
  });
  return result;
}

function toggleMenu() {
  $('#menu-area').toggleClass('is-invisible');

  if (menuMode) {
    $('img').css('-webkit-app-region', 'drag');
  } else {
    $('img').css('-webkit-app-region', 'no-drag');
  }
  menuMode = !menuMode;
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

function changeImage(index) {

  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
  window.resizeTo(width, height);

  let nextImage = imgList[index].path;
  $('#image-area').empty().append(`<img id="left-img" src="${nextImage}">`);
  $('#left-img').on('load', () => {
    windowResize();
  });

  if (pageMode == 2) {
    let nextImage = imgList[movePage(+1)].path;
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