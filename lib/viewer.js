const $ = require('jquery');
const electron = require('electron');
const Datastore = require('nedb');

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

  createTagList();

  // tag input event
  $('#tag-input').on('focus', () => {
    inputMode = true;
    $('#tag-dropdown').addClass('is-active');
  });

  $('#tag-input').on('blur', () => {
    inputMode = false;
    setTimeout(() => {
      $('#tag-dropdown').removeClass('is-active');
    }, 100);
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

    tagArea(imgList[index].tags);

    $('#tag-add-button').on('click', () => {
      let nowImage = imgList[index];
      let newTag = $('#tag-input').val();
      
      updateTag(nowImage,newTag);
    });

    $(window).bind('keydown', (e) => {
      if (!inputMode) {
        if (e.which == 39) {
          // right
          index = movePage(+1 * pageMode);
          changeImage(index);
          tagArea(imgList[index].tags);
        }
        if (e.which == 37) {
          // left
          index = movePage(-1 * pageMode);
          changeImage(index);
          tagArea(imgList[index].tags);
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

function tagArea(tagIds) {
  $('#tag-area').empty();
  if (!tagIds) return;

  tagDB.loadDatabase();
  tagDB.find({ _id: { $in: tagIds } }, (err, tags) => {
    tags.forEach((tag) => {
      let name = tag.name;
      let dom = `
      <div class="control">
        <div class="tags has-addons">
            <a class="tag is-link">${name}</a>
            <a class="tag is-delete" id="${tag._id}"></a>
        </div>
      </div>`;
      $('#tag-area').append(dom);
      $('#' + tag._id).on('click', () => {
        deleteTagFromImage(tag._id);

      });
    });
  });
}

function createTagList() {
  tagDB.loadDatabase();
  tagDB.find({}, (err, tags) => {
    let $tagList = $('#tag-list');
    $tagList.empty();
    if (tags) {
      tags.forEach((tag) => {
        $tagList.append(`<a class="dropdown-item" id="${tag._id}">${tag.name}</a>`);
        $('#' + tag._id).on('click', () => {
          $('#tag-input').val(tag.name);
        });
      });
    }
  });
}
function updateTag(image, newTag) {
  let tags = image.tags || [];

  tagDB.loadDatabase();
  tagDB.findOne({ name: newTag }, (err, tag) => {
    let imgId = imgList[index]._id;
    $('#tag-input').val('');

    // get tag Id
    if (tag) {
      tags.push(tag._id);
      imgList[index].tags = tags;

      updateTagsToImage(imgId, tags, () => {
        tagArea(tags);
      });
    } else {
      // new tag
      tagDB.insert(
        { name: newTag },
        (err, tag) => {
          tags.push(tag._id);
          imgList[index].tags = tags;

          updateTagsToImage(imgId, tags, () => {
            tagArea(tags);
          });
        });
    }
  });

}

function updateTagsToImage(imgId, tags, callback) {
  imgDB.update(
    { _id: imgId },
    { $set: { tags: tags } },
    callback);
}

function deleteTagFromImage(tagId) {
  const nowTagIds = imgList[index].tags;
  const newTagIds = nowTagIds.filter((nowTagId) => {
    return nowTagId !== tagId;
  });

  imgDB.update(
    { _id: imgList[index]._id },
    { $set: { tags: newTagIds } },
    () => {
      imgList[index].tags = newTagIds;
      tagArea(imgList[index].tags);
    }
  );
}

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