const fs = require('fs');
const $ = require('jquery');
const Datastore = require('nedb');
const electron = require('electron');

const img = require('./lib/modules/image');
const fileUtil = require('./lib/modules/fileUtil');

const config = require('./config.json');

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

  $('#search-input').on('focus keyup', () => {
    let word = $('#search-input').val();
    if (word) {
      let words = word.split(' ');
      tagDB.find({ name: { $in: words } }, (err, tags) => {
        if (tags && tags.length > 0) {
          $('.image-thumb>a').hide();
          let classes = '';
          tags.forEach((tag) => {
            classes += '.' + tag._id;
          });
          $(classes).show();
        } else {
          $('.image-thumb>a').show();
        }
      });
    }
  });

  imgDB.find({}, (err, imgs) => {
    imgs.forEach((image) => {
      if (img.isImage(image.path)) {
        addThumb(image);
      }
    });
  });
  tagDB.loadDatabase();
});

function addDir(dir) {
  let pathList = createPathList(dir);
  pathList.forEach((path) => {
    if (img.isImage(path)) {
      imgDB.insert({ path: path });
    }
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

function createView(dir) {

  $('#img-list').empty();

  let files = fs.readdirSync(dir);

  addThumbs(dir, files);
}

function createPathList(dir) {
  const files = fs.readdirSync(dir);

  const pathList = files.map((file) => {
    return `${dir}/${file}`;
  });

  return pathList;
}

function addThumbs(dir, files) {

  let upper = fileUtil.directory(dir).replace(/\/$/, '');
  let dirLink = createUpperDirIcon(upper);

  files.forEach((file) => {
    let path = `${dir}/${file}`;
    if (img.isImage(file)) {
      addThumb(path);
    } else if (fileUtil.isDirectory(path)) {
      dirLink += createDirIcon(path);
    }
  });
  $('#img-list').prepend(dirLink);
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

function createUpperDirIcon(dir) {

  if (!dir) return '';

  let dirName = fileUtil.path2File(dir);
  let imgIcon = dirIcon(UPPER_DIR_ICON, dirName);

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

  let mainWindow = new BrowserWindow({
    left: 0,
    top: 0,
    width: width,
    height: height,
    useContentSize: true,
    frame: false
  });
  mainWindow.loadURL(`file://${__dirname}/viewer.html?path=${image.path}&id=${image._id}`);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  return false;
}