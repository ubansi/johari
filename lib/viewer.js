const $ = require('jquery');
const electron = require('electron');
const Datastore = require('nedb');

const ImageUtil = require('./lib/modules/image');

const imgDB = new Datastore({
  filename: 'db/images.db',
});
const multiImgDB = new Datastore({
  filename: 'db/multi_image.db',
  autoload: true
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
let multiImageMode = false;

$(() => {
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
  let imgMaxWidth = Number(width / pageMode);

  const params = param2obj(location.search);
  const path = params.path;
  const imageId = params.id;
  const searchTags = params.tags || [];

  let imagePath = path;

  if (!ImageUtil.isImage(path)) {
    multiImageMode = true;
    imagePath = path + '/' + ImageUtil.firstImage(path);
  }

  let img = `<img src="${imagePath}" style="max-height:${height}px;max-width:${imgMaxWidth}px;">`;
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
  inputTagEvent();

  setLikeEvent();
  imgDB.loadDatabase();
  
  if (multiImageMode) {
    multiImgDB.loadDatabase();
    multiImgDB.findOne({ _id: imageId }, (err, dir) => {
      let imgIdList = dir.images;
      index = 0;
      imgDB.find({_id:{$in:imgIdList}},(err, imgs)=>{

        imgList = imgs;

        tagArea(imgList[0].tags);

        setLikeStar(imgList[index].like);
  
        $('#tag-add-button').on('click', () => {
          let nowImage = imgList[index];
          let newTag = $('#tag-input').val();
  
          updateTag(nowImage, newTag);
        });
  
        setKeyEvent();
      });

    });
  } else {
    
    let query = searchTags.map((tag) => {
      return { tags: tag };
    });

    imgDB.find({ $and: query }, (err, imgs) => {
      imgList = imgs;
      imgs.some((image, idx) => {
        if (image._id == imageId) {
          index = idx;
          return true;
        }
      });

      tagArea(imgList[index].tags);

      setLikeStar(imgList[index].like);

      $('#tag-add-button').on('click', () => {
        let nowImage = imgList[index];
        let newTag = $('#tag-input').val();

        updateTag(nowImage, newTag);
      });

      setKeyEvent();
    });
  }
});
/**
 * set key event
 */
function setKeyEvent() {
  $(window).on('keydown', (e) => {
    if (!inputMode) {
      if (e.which == 39) {
        // right
        index = movePage(+1 * pageMode);
        changeImage(index);
        tagArea(imgList[index].tags);
        setLikeStar(imgList[index].like);
      }
      if (e.which == 37) {
        // left
        index = movePage(-1 * pageMode);
        changeImage(index);
        tagArea(imgList[index].tags);
        setLikeStar(imgList[index].like);
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
}
/**
 * input tag event
 */
function inputTagEvent() {
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

  $('#tag-input').on('focus keyup', () => {
    let input = $('#tag-input').val() || '';
    findTagList(input);
  });
}
/**
 * refine completion
 * @param {string[]} tagIds 
 */
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
/**
 * create completion
 */
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
/**
 * update tag list
 * @param {string} name 
 */
function findTagList(name) {
  $('#tag-list>a').addClass('is-hidden');
  $(`#tag-list>a:contains(${name})`).removeClass('is-hidden');
}
/**
 * add tag to image
 * @param {Object} image 
 * @param {array} image.tags
 * @param {string} newTag 
 */
function updateTag(image, newTag) {
  let tags = image.tags || [];

  tagDB.loadDatabase();
  tagDB.findOne({ name: newTag }, (err, tag) => {
    let imgId = imgList[index]._id;
    $('#tag-input').val('');

    // get tag Id
    if (tag) {
      if (tags.indexOf(tag._id)) {
        tags.push(tag._id);
        imgList[index].tags = tags;

        updateTagsToImage(imgId, tags, () => {
          tagArea(tags);
        });
      }
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
/**
 * update tags to image
 * @param {string} imgId 
 * @param {string[]} tags 
 * @param {function} callback 
 */
function updateTagsToImage(imgId, tags, callback) {
  imgDB.update(
    { _id: imgId },
    { $set: { tags: tags } },
    callback);
}

/**
 * delete tag from image
 * @param {string} tagId 
 */
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
/**
 * URI param to object
 * @param {string} search 
 * @return {Object}
 */
function param2obj(search) {
  const paramStr = decodeURIComponent(search.replace('?', ''));
  const splitedParam = paramStr.split('&');
  let result = {};
  splitedParam.forEach(param => {
    const params = param.split('=');

    if (/\[\]$/.test(params[0])) {
      const name = params[0].replace(/\[\]$/, '');
      const val = params[1];
      if (result[name]) {
        result[name].push(val);
      } else {
        result[name] = [val];
      }
    } else {
      const name = params[0];
      const val = params[1];

      result[name] = val;
    }
  });
  return result;
}
/**
 * toggle menu
 */
function toggleMenu() {
  $('#menu-area').toggleClass('is-invisible');

  if (menuMode) {
    $('img').css('-webkit-app-region', 'drag');
  } else {
    $('img').css('-webkit-app-region', 'no-drag');
  }
  menuMode = !menuMode;
}

/**
 * move page
 * @param {number} page 
 */
function movePage(page) {
  return (imgList.length + index + page) % (imgList.length);
}

/**
 * toggle page mode
 */
function changePageMode() {
  if (pageMode == 1) {
    pageMode = 2;
  } else {
    pageMode = 1;
  }
}
/**
 * change to index page of viewer limage list
 * @param {number} index 
 */
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
/**
 * window resize to image size
 */
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

/**
 * set like start event
 */
function setLikeEvent() {
  let i = 1;
  while (i <= 5) {
    let like = i;
    $('#is-like-' + i).on('mouseover', () => {
      setLikeStar(like);
    });
    $('#is-like-' + i).on('mouseout', () => {
      let imgLike = imgList[index] && imgList[index].like || 0;
      setLikeStar(imgLike);
    });

    $('#is-like-' + i).on('click', () => {
      setLikeStar(like);
      let imgId = imgList[index]._id;
      imgList[index].like = like;

      imgDB.update(
        { _id: imgId },
        { $set: { like: like } },
        (err) => {
          if (err) throw err;
        });
    });

    i++;
  }
}

/**
 * like star action
 * @param {number} input 
 */
function setLikeStar(input) {
  let like = 0;
  if (!isNaN(Number(input))) {
    like = Number(input);
  }

  let i = 0;
  while (i <= like) {
    $('#is-like-' + i).text('★');
    i++;
  }
  while (i <= 5) {
    $('#is-like-' + i).text('☆');
    i++;
  }
}