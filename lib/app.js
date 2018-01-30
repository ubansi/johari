const fs = require('fs');
const $ = require('jquery');
const Datastore = require('nedb');
const electron = require('electron');
const Jimp = require('jimp');

const ImgUtil = require('./lib/modules/image');
const FileUtil = require('./lib/modules/file_util');
const TagManager = require('./lib/modules/search_tag_manager');

const BrowserWindow = electron.remote.BrowserWindow;
const imgDB = new Datastore({
  filename: 'db/images.db',
  autoload: true
});
const tagDB = new Datastore({
  filename: 'db/tag.db',
});
const multiImgDB = new Datastore({
  filename: 'db/multi_image.db',
  autoload: true
});

const DIR_ICON = './res/folder.svg';
const LOADING = './res/loading.svg';

$(() => {

  setMenuEvent();
  setAddDrectoryEvent();
  createTagList();
  setSearchEvent();

  updateThumb();

});
/**
 * set menu event
 */
function setMenuEvent() {
  $('.menu').on('mouseover', () => {
    $('#menu-dropdown').addClass('is-active');
  });

  $('.menu').on('mouseleave', () => {
    $('#menu-dropdown').removeClass('is-active');
  });
}
/**
 * create tag selector
 */
function createTagList() {
  tagDB.loadDatabase();
  tagDB.find({}, (err, tags) => {
    const $tagList = $('#tag-list');
    $tagList.empty();
    if (tags) {
      tags.forEach((tag) => {
        $tagList.append(`<a class="dropdown-item" id="${tag._id}">${tag.name}</a>`);
        $('#' + tag._id).on('click', () => {
          TagManager.setSearchTag(tag);
          $('#search-input').val('');
          displayImageHavingTagIds(TagManager.getSearchTagIds());
          activeTagList(TagManager.getSearchTag());
        });
      });
    }
  });
}

/**
 * refine tag list
 * @param {string} name 
 */
function findTagList(name) {
  $('#tag-list>a').addClass('is-hidden');
  $(`#tag-list>a:contains(${name})`).removeClass('is-hidden');
}

/**
 * set add directory event
 */
function setAddDrectoryEvent() {

  $('#open-add-directory').on('click', () => {
    $('#add-directory-modal').addClass('is-active');
    $('nav.navbar').addClass('is-hidden');
  });

  $('#add-directory-close').on('click', () => {
    $('#add-directory-modal').removeClass('is-active');
    $('nav.navbar').removeClass('is-hidden');
    $('#add-directory-result').empty();
  });

  $('#add-directory').on('click', () => {

    const path = $('#directory-path').val();
    const fileList = createImageList(path);

    if (!fileList) {
      $('#add-directory-result').empty();
      $('#add-directory-result').append('<div class="notification">No Image Added</div>');
      return;
    }

    // adding images
    let imageList = [];
    // adding multi images
    let dirPathList = [];

    fileList.forEach((file) => {
      if (ImgUtil.isImage(file.path)) {
        imageList.push(file);
      } else if (fs.statSync(file.path).isDirectory()) {
        dirPathList.push(file);
      }
    });

    dirPathList.forEach((dir) => {
      const dirImages = createImageList(dir.path);
      dirImages.forEach((dirImage) => {
        if (ImgUtil.isImage(dirImage.path)) {
          imageList.push(dirImage);
        }
      });
    });

    $('#add-directory-result').empty();

    insertImage(imageList)
      .then((newImages) => {
        let newImagesNum = 0;
        let message = 'No image added.';
        let dirs = [];
        if (newImages) {
          newImagesNum = newImages.length || 1;
          message = `${newImagesNum} new Image added.`;

          dirs = dirPathList.map((dir) => {
            newImages.forEach((img) => {
              let path = dir.path + '/';
              if (path == FileUtil.directory(img.path)) {
                if (!dir.images) {
                  dir.images = [];
                }
                dir.images.push(img._id);
              }
              if (!dir.thumbnail) {
                dir.thumbnail = img.thumbnail;
              }
            });
            return dir;
          });
          $('#add-directory-result')
            .append(`<div class="notification">${message}</div>`);

          $('#thumbnail-progress')
            .append(`<progress class="progress is-link" value="0" max="${newImagesNum - 1}"></progress>`);
          createThumbImgs(newImages);
        }

        return dirs;
      })
      .then(insertMultiImage)
      .then((newImages) => {
        let newImagesNum = 0;
        let message = 'No directory added.';

        if (newImages) {
          newImagesNum = newImages.length || 1;
          message = `${newImagesNum} new Multi Image added.`;
        }

        $('#add-directory-result').append(
          `<div class="notification">${message}</div>`
        );
      })
      .then(() => {
        updateThumb();
      }).catch((err) => {
        //TODO show error
      });

    $('#directory-path').val('');
  });
}
/**
 * insert images into image DB
 * @param {array} imageList 
 * @return {Promise}
 */
function insertImage(imageList) {
  return new Promise((res, rej) => {
    imgDB.insert(imageList, (err, images) => {
      if (err) rej(err);

      res(images);
    });
  });
}
/**
 * insert directorys into multi image DB
 * @param {array} dirs 
 * @return {Promise}
 */
function insertMultiImage(dirs) {
  return new Promise((res, rej) => {
    multiImgDB.insert(dirs, (err, newImages) => {
      if (err) rej(err);

      res(newImages);
    });
  });
}
/**
 * set tag search event
 */
function setSearchEvent() {
  $('#search-input').on('focus', () => {
    $('#search-dropdown').addClass('is-active');
  });

  $('#search-input').on('blur', () => {
    // wait update value from dropdown
    setTimeout(() => {
      $('#search-dropdown').removeClass('is-active');
    }, 100);
  });

  $('#search-input').on('focus keyup', () => {
    const input = $('#search-input').val() || '';
    findTagList(input);
  });
}
/**
 * create active tag list
 * @param {array} tags 
 */
function activeTagList(tags) {
  $('#search-tags').empty();
  tags.forEach((tag) => {
    $('#search-tags').append(`
      <div class="control">
        <div class="tags has-addons">
            <a class="tag is-link">${tag.name}</a>
            <a class="tag is-delete" id="del-${tag._id}"></a>
        </div>
      </div>
    `);
    $('#del-' + tag._id).on('click', () => {
      TagManager.removeSearchTagById(tag._id);
      displayImageHavingTagIds(TagManager.getSearchTagIds());
      activeTagList(TagManager.getSearchTag());
    });
  });
}

/**
 * Display only images with selected tags.
 * @param {string} tagIds 
 */
function displayImageHavingTagIds(tagIds) {
  if (tagIds && tagIds.length > 0) {
    let classes = '';
    $('.image-thumb>a').hide();
    tagIds.forEach((tagId) => {
      classes += '.' + tagId;
    });
    $(classes).show();
  } else {
    $('.image-thumb>a').show();
  }
}

/**
 * uodate thumbnail from db
 */
function updateThumb() {
  $('#img-list').empty();

  multiImgDB.loadDatabase();
  multiImgDB.find({}, (err, mimgs) => {
    mimgs.forEach((dir) => {
      createDirIcon(dir);
    });
  });

  imgDB.loadDatabase();
  imgDB.find({}, (err, imgs) => {
    imgs.forEach((image) => {
      addThumb(image);
    });
  });
}
/**
 * add thumbnail to image list
 * @param {Object} image 
 * @param {string} image.path
 * @param {array} image.tags
 * @param {string} image.thumbnail
 * @param {string} image._id
 */
function addThumb(image) {
  const name = FileUtil.path2File(image.path);
  const tags = image.tags || [];
  const imagePath = image.thumbnail || LOADING;
  const tumbs = `<li class="image-thumb">
    <a target="_blank" id="${image._id}">
      <img src="${imagePath}" title="${name}">
    </a>
  </li>`;
  $('#img-list').append(tumbs);
  $('#' + image._id).on('click', () => { windowOpen(image); });

  tags.forEach((tag) => {
    $('#' + image._id).addClass(tag);
  });

}

/**
 * create image path list
 * @param {string} dir 
 */
function createImageList(dir) {

  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }

  const pathList = files.map((file) => {
    const path = `${dir.replace(/\\/g, '/').replace(/\/$/, '')}/${file}`;
    return {
      path: path,
      thumbnail: LOADING
    };
  });

  // remove undefined
  return pathList.filter((val) => {
    return val;
  });
}
/**
 * create Icon for Dir
 * @param {Object} dir 
 * @param {string} dir.path
 * @param {string[]} dir.tags
 * @param {string[]} dir.images
 * @param {string} dir.thumbnail
 * @param {string} dir._id
 */
function createDirIcon(dir) {
  if (!dir) return '';

  const dirName = FileUtil.path2File(dir.path);
  const tags = dir.tags || [];
  let imgIcon;
  const dirImageId = dir.images[0];

  imgDB.findOne({ _id: dirImageId }, (err, img) => {
    const thumbnail = img.thumbnail;
    if (thumbnail) {
      imgIcon = thumbDirIconHTML(thumbnail, dirName);
      const thumbs = `<li class="dir-thumb">
    <a target="_blank" id="${dir._id}">
      ${imgIcon}
    </a>
    </li>`;

      $('#img-list').prepend(thumbs);

      $('#' + dir._id).on('click', () => {
        // dir view mode 
        windowOpen(dir);
      });

      tags.forEach((tag) => {
        $('#' + dir._id).addClass(tag);
      });
    }
  });

}

/**
 * create dir thumbnail
 * @param {string} img 
 * @param {string} dirName 
 */
function thumbDirIconHTML(img, dirName) {
  return `
  <img class="dir-thumb" src="${img}">
  <p><img class="icon" src="${DIR_ICON}">${dirName}</p>
  `;
}

/**
 * open preview window
 * @param {Object} image 
 * @param {string} image.path
 * @param {string} image._id
 * 
 */
function windowOpen(image) {
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

  let viewerWindow = new BrowserWindow({
    left: 0,
    top: 0,
    width: width,
    height: height,
    useContentSize: true,
    frame: false
  });

  const param = $.param({
    path: image.path,
    id: image._id,
    tags: TagManager.getSearchTagIds()
  });

  viewerWindow.loadURL(`file://${__dirname}/viewer.html?${param}`);

  viewerWindow.on('closed', function () {
    viewerWindow = null;
    tagDB.loadDatabase();
    imgDB.loadDatabase();

    imgDB.findOne({ _id: image._id }, (err, newImage) => {
      if (newImage && newImage.tags) {
        $('#' + newImage._id).removeClass();
        newImage.tags.forEach((tag) => {
          $('#' + newImage._id).addClass(tag);
        });
      }
    });

    createTagList();
  });

  return false;
}

/**
 * create thumbnail image
 * @param {{path :string,_id:string,thumbnail:string}[]} images
 * @return {Promise} 
*/
function createThumbImgs(images) {

  return new Promise((res, rej) => {

    const loop = (i) => {
      return new Promise((resolve, reject) => {
        let image = images[i];
        createThumbImg(image.path, image._id)
          .then((thumbnailPath) => {
            image.thumbnail = thumbnailPath;
            imgDB.update({ _id: image._id }, { $set: { thumbnail: thumbnailPath } }, {}, (err, updates) => {
              if (err) reject(err);
              const name = FileUtil.path2File(image.path);
              $('#' + image._id)
                .empty()
                .append(`<img src="${image.thumbnail}" title="${name}">`);
            });

          })
          .then(() => {
            $('#thumbnail-progress>progress').val(i);
            resolve(i + 1);
          })
          .catch((err) => {
            reject(err);
          });

      }).then((count) => {
        const imageNum = images.length;
        if (count >= imageNum) {
          res();
        } else {
          loop(count);
        }
      }).catch((err) => {
        rej(err);
      });
    };

    loop(0);
  });

}
/**
 * create a thumbnail image
 * @param {string} path 
 * @param {string} output 
 */
function createThumbImg(path, output) {
  return new Promise((res, rej) => {
    Jimp.read(path, (err, img) => {
      if (err) rej(err);

      const outputPath = 'thumbnail/' + output + '.jpg';

      img.resize(Jimp.AUTO, 300)
        .quality(60)
        .write(outputPath);

      res(outputPath);
    });
  });
}