const fs = require('fs');
const $ = require('jquery');

const img = require('./lib/modules/image');
const fileUtil = require('./lib/modules/fileUtil');

const config = require('./config.json');
const electron = require('electron');
var BrowserWindow = electron.remote.BrowserWindow;

const DIR_ICON = './res/folder.svg';
const UPPER_DIR_ICON = './res/upper_folder.svg';
let imgIndex = 0;

$(() => {
  $('.menu').on('mouseover',()=>{
    $('#menu-dropdown').addClass('is-active');
  });

  $('.menu').on('mouseleave',()=>{
    $('#menu-dropdown').removeClass('is-active');
  });

  let readdir = config.read_dir;
  createView(readdir);
});

function addThumb(dir, file) {
  let path = `${dir}/${file}`;
  let name = file.replace(/.+\//, '');
  let imgId = 'id-'+imgIndex++;

  let tumbs = `<li class="image-thumb">
    <a target="_blank" id="${imgId}">
      <img src="${path}" title="${name}">
    </a>
  </li>`;
  $('#img-list').append(tumbs);
  $('#' + imgId).on('click', () => { windowOpen(path); });
}

function createView(dir) {

  $('#img-list').empty();
  let upper = fileUtil.directory(dir).replace(/\/$/, '');
  let dirLink = createUpperDirIcon(upper);

  fs.readdir(dir, (err, files) => {
    if (err) throw err;

    files.forEach((file) => {
      let path = `${dir}/${file}`;
      if (img.isImage(file)) {
        addThumb(dir, file);
      } else if (fileUtil.isDirectory(path)) {
        dirLink += createDirIcon(path);
      }
    });
    $('#img-list').prepend(dirLink);
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