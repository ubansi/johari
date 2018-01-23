const fs = require('fs');
const $ = require('jquery');
const Datastore = require('nedb');
const electron = require('electron');
const Jimp = require('jimp');

const ImgUtil = require('./lib/modules/image');
const FileUtil = require('./lib/modules/fileUtil');
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

function setMenuEvent() {
  $('.menu').on('mouseover', () => {
    $('#menu-dropdown').addClass('is-active');
  });

  $('.menu').on('mouseleave', () => {
    $('#menu-dropdown').removeClass('is-active');
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
          TagManager.setSearchTag(tag);
          $('#search-input').val('');
          displayImageHavingTagIds(TagManager.getSearchTagIds());
          acriveTagList(TagManager.getSearchTag());
        });
      });
    }
  });
}

function findTagList(name) {
  $('#tag-list>a').addClass('is-hidden');
  $(`#tag-list>a:contains(${name})`).removeClass('is-hidden');
}

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

    let path = $('#directory-path').val();
    let fileList = createImageList(path);

    if(!fileList) return;

    let imageList = [];
    let dirPathList = [];

    fileList.forEach((file) => {
      if (ImgUtil.isImage(file.path)) {
        imageList.push(file);
      } else if (fs.statSync(file.path).isDirectory()) {
        dirPathList.push(file);
      }
    });

    dirPathList.forEach((dir) => {
      let dirImages = createImageList(dir.path);
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

          createThumbImgs(newImages);

          $('#add-directory-result').append(
            `<div class="notification">${message}</div>`
          );
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

function insertImage(imageList) {
  return new Promise((res, rej) => {
    imgDB.insert(imageList, (err, images) => {
      if (err) rej(err);

      res(images);
    });
  });
}

function insertMultiImage(dirs) {
  return new Promise((res, rej) => {
    multiImgDB.insert(dirs, (err, newImages) => {
      if (err) rej(err);

      res(newImages);
    });
  });
}

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
    let input = $('#search-input').val() || '';
    findTagList(input);
  });
}

function acriveTagList(tags) {
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
      acriveTagList(TagManager.getSearchTag());
    });
  });
}

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

function addThumb(image) {
  let name = FileUtil.path2File(image.path);
  let tags = image.tags || [];
  let imagePath = image.thumbnail || LOADING;
  let tumbs = `<li class="image-thumb">
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

function createImageList(dir) {
  
  let files;
  try{
    files = fs.readdirSync(dir);
  }catch(e){
    return;
  }

  const pathList = files.map((file) => {
    let path = `${dir.replace(/\\/g, '/').replace(/\/$/, '')}/${file}`;
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

function createDirIcon(dir) {
  if (!dir) return '';

  let dirName = FileUtil.path2File(dir.path);
  let tags = dir.tags || [];
  let imgIcon;
  let dirImageId = dir.images[0];

  imgDB.findOne({ _id: dirImageId }, (err, img) => {
    let thumbnail = img.thumbnail;
    if (thumbnail) {
      imgIcon = thumbDirIcon(thumbnail, dirName);
      let thumbs = `<li class="dir-thumb">
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

function thumbDirIcon(img, dirName) {
  return `
  <img class="dir-thumb" src="${img}">
  <p><img class="icon" src="${DIR_ICON}">${dirName}</p>
  `;
}

function windowOpen(image) {
  let { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

  let viewerWindow = new BrowserWindow({
    left: 0,
    top: 0,
    width: width,
    height: height,
    useContentSize: true,
    frame: false
  });

  let param = $.param({
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

function createThumbImgs(images) {

  return new Promise((res, rej) => {

    let loop = (i) => {
      return new Promise((resolve, reject) => {
        let image = images[i];
        createThumbImg(image.path, image._id)
          .then((thumbnailPath) => {
            image.thumbnail = thumbnailPath;
            imgDB.update({ _id: image._id }, { $set: { thumbnail: thumbnailPath } }, {}, (err, updates) => {
              if (err) reject(err);
              let name = FileUtil.path2File(image.path);
              $('#' + image._id)
                .empty()
                .append(`<img src="${image.thumbnail}" title="${name}">`);
            });

          })
          .then(() => {
            resolve(i + 1);
          })
          .catch((err) => {
            reject(err);
          });

      }).then((count) => {
        let imageNum = images.length;
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

function createThumbImg(path, output) {
  return new Promise((res, rej) => {
    Jimp.read(path, (err, img) => {
      if (err) rej(err);

      let outputPath = 'thumbnail/' + output + '.jpg';

      img.resize(Jimp.AUTO, 300)
        .quality(60)
        .write(outputPath);

      res(outputPath);
    });
  });
}