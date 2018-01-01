const fs = require('fs');
const $ = require('jquery');

const img = require('./lib/modules/image');
const fileUtil = require('./lib/modules/fileUtil');

const config = require('./config.json');
const electron = require('electron');
var BrowserWindow = electron.remote.BrowserWindow;

const DIR_ICON = './res/folder.svg';
const UPPER_DIR_ICON = './res/upper_folder.svg';

$(() => {
  let readdir = config.read_dir;
  createView(readdir);
});

function addThumb(dir, file) {
  let path = `${dir}/${file}`;
  let name = file.replace(/.+\//, '');
  let imgId = name.replace(/\..+/, '').replace(/%/g, '');

  let tumbs = `<li class="image-thumb">
    <a target="_blank" id="${imgId}">
      <img src="${path}" title="${name}">
    </a>
  </li>`;
  $('#img-list').append(tumbs);
  $('#' + imgId).bind('click', () => { windowOpen(path); });

  let img = new Image();
  img.onload = () => {
    $('#' + imgId).attr('data-width', img.naturalWidth);
    $('#' + imgId).attr('data-height', img.naturalHeight);
  };
  img.src = path;
}

function createView(dir) {

  $('#img-list').empty();
  let upper = dir.split('/').slice(0, -1).toString().replace(/,/g, '/');

  let dirLink = createDirIcon(upper, UPPER_DIR_ICON);

  fs.readdir(dir, (err, files) => {
    if (err) throw err;

    files.forEach((file) => {
      let path = `${dir}/${file}`;
      if (img.isImage(file)) {
        addThumb(dir, file);
      } else if (fileUtil.isDirectory(path)) {
        dirLink += createDirIcon(path, DIR_ICON);
      }
    });
    $('#img-list').prepend(dirLink);
  });
}

function createDirIcon(dir, icon) {

  if (!dir) {
    return '';
  }

  let files = fs.readdirSync(dir);
  let idx;
  let isImgDir = files.some((file, index) => {
    if (img.isImage(`${dir}/${file}`)) {
      idx = index;
      return true;
    }
  });
  let dirName = fileUtil.path2File(dir);
  let imgIcon;

  if (isImgDir) {

    imgIcon = `
    <img class="dir-thumb" src="${dir}/${files[idx]}">
    <p><img class="icon" src="${icon}">${dirName}</p>
    `;

  } else {
    imgIcon = `
    <img  class="dir-thumb-img" src="${icon}">
    <p>${dirName}</p>
    `;
  }

  return `<li class="dir-thumb">
      <a target="_blank" 
      onclick="createView('${dir}')">
        ${imgIcon}
      </a>
      </li>`;
}

function windowOpen(path) {
  let { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

  let mainWindow = new BrowserWindow({
    left: 0,
    top: 0,
    width: width,
    height: height,
    useContentSize: true,
    frame: false
  });
  mainWindow.loadURL(`file://${__dirname}/viewer.html?${path}`);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  return false;
}
