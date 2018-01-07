const fs = require('fs');
const $ = require('jquery');
const Datastore = require('nedb');
const electron = require('electron');

const img = require('./lib/modules/image');
const fileUtil = require('./lib/modules/fileUtil');

const BrowserWindow = electron.remote.BrowserWindow;
const imgDB = new Datastore({
  filename: 'db/images.db',
  autoload: true
});
const tagDB = new Datastore({
  filename: 'db/tag.db',
});

const DIR_ICON = './res/folder.svg';
const UPPER_DIR_ICON = './res/upper_folder.svg';

$(() => {
  $('.menu').on('mouseover', () => {
    $('#menu-dropdown').addClass('is-active');
  });

  $('.menu').on('mouseleave', () => {
    $('#menu-dropdown').removeClass('is-active');
  });

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
    let imageList = createImageList(path);

    imgDB.insert(imageList, (err, newImages) => {
      let newImagesNum = 0;
      let message = 'No image added.';

      if (newImages) {
        newImagesNum = newImages.length || 1;
        message = `${newImagesNum} new Image added.`;
      }

      $('#add-directory-result').empty().append(
        `<div class="notification">${message}</div>`
      );
      $('#img-list').empty();
      updateThumb();
    });

    $('#directory-path').val('');
  });

  $('#search-input').on('focus keyup', () => {
    let input = $('#search-input').val();
    if (input) {
      let tagNames = input.split(' ');
      displayImageHavingTag(tagNames);
    } else {
      $('.image-thumb>a').show();
    }
  });

  updateThumb();

  tagDB.loadDatabase();
});

function displayImageHavingTag(tagNames) {
  tagDB.find({ name: { $in: tagNames } }, (err, tags) => {
    if (tags && tags.length > 0) {
      let classes = '';
      $('.image-thumb>a').hide();
      tags.forEach((tag) => {
        classes += '.' + tag._id;
      });
      $(classes).show();
    } else {
      $('.image-thumb>a').show();
    }
  });
}

function updateThumb() {
  imgDB.loadDatabase();
  imgDB.find({}, (err, imgs) => {
    imgs.forEach((image) => {
      if (img.isImage(image.path)) {
        addThumb(image);
      }
    });
  });
}

function addThumb(image) {
  let name = fileUtil.path2File(image.path);
  let tags = image.tags || [];
  let tumbs = `<li class="image-thumb">
    <a target="_blank" id="${image._id}">
      <img src="${image.path}" title="${name}">
    </a>
  </li>`;
  $('#img-list').append(tumbs);
  $('#' + image._id).on('click', () => { windowOpen(image); });

  tags.forEach((tag) => {
    $('#' + image._id).addClass(tag);
  });

}

function createImageList(dir) {
  const files = fs.readdirSync(dir);

  const pathList = files.map((file) => {
    let path = `${dir.replace(/\\/g, '/')}/${file}`;

    if (img.isImage(path)) {
      return { path: path };
    }
  });

  // remove undefined
  return pathList.filter((val) => {
    return val;
  });
}

function createDirIcon(dir) {

  if (!dir) return '';

  let dirName = fileUtil.path2File(dir);
  let imgIcon;
  let dirImage = img.firstImage(dir);

  if (dirImage) {
    let imgSrc = `${dir}/${dirImage}`;
    imgIcon = thumbDirIcon(imgSrc, dirName);

  } else {
    imgIcon = dirIcon(DIR_ICON, dirName);
  }

  return `<li class="dir-thumb">
      <a target="_blank" 
      onclick="createView('${dir}')">
        ${imgIcon}
      </a>
      </li>`;
}

function thumbDirIcon(img, dirName) {
  return `
  <img class="dir-thumb" src="${img}">
  <p><img class="icon" src="${DIR_ICON}">${dirName}</p>
  `;
}

function dirIcon(icon, dirName) {
  return `
  <img class="dir-thumb-img" src="${icon}">
  <p>${dirName}</p>
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
  viewerWindow.loadURL(`file://${__dirname}/viewer.html?path=${image.path}&id=${image._id}`);

  viewerWindow.on('closed', function () {
    viewerWindow = null;
    tagDB.loadDatabase();
    imgDB.loadDatabase();

    imgDB.findOne({ _id: image._id }, (err, newImage) => {
      if (newImage.tags) {
        $('#' + newImage._id).removeClass();
        newImage.tags.forEach((tag) => {
          $('#' + newImage._id).addClass(tag);
        });
      }
    });
  });

  return false;
}