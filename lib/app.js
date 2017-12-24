const fs = require('fs');
const $ = require('jquery');

const img = require('./lib/modules/image');
const config = require('./config.json');
const electron = require('electron');
var BrowserWindow = electron.remote.BrowserWindow;


$(() => {
    let readdir = config.read_dir;
    createView(readdir);

});

function addThumb(dir, file) {
    let path = `${dir}/${file}`;
    let name = file.replace(/.+\//, '');
    let imgId = name.replace(/\..+/, '').replace(/%/g, '');

    let tumbs = `<li class="image-thumb">
        <a target="_blank" 
        id="${imgId}" onclick="windowOpen('${path}',this)">
            <img src="${path}" title="${name}">
        </a>
    </li>`;
    $('#img-list').append(tumbs);

    let img = new Image();
    img.onload = () => {
        $('#' + imgId).attr('data-width', img.naturalWidth);
        $('#' + imgId).attr('data-height', img.naturalHeight);
    };
    img.src = path;
};

function isDirectory(file) {
    return fs.existsSync(file) && fs.statSync(file).isDirectory();
};

function createView(dir) {

    $('#img-list').empty();
    let upper = dir.split('/').slice(0, -1).toString().replace(/,/g, '/');
    let dirLink = `<li><input type="button" onClick="createView('${upper}')" value="${upper}"></input></li>`;

    fs.readdir(dir, (err, files) => {
        if (err) throw err

        let fileList = files.filter((file) => {
            let path = `${dir}/${file}`;
            if (img.isImage(file)) {
                addThumb(dir, file);
            } else if (isDirectory(path)) {
                dirLink += createDirIcon(path);
            }
        });
        $('#img-list').prepend(dirLink);
    });
}

function createDirIcon(dir) {

    let files = fs.readdirSync(dir);
    let idx;
    let isImgDir = files.some((file, index) => {
        if (img.isImage(`${dir}/${file}`)) {
            idx = index;
            return true;
        }
    });
    let dirName = dir.match(/\/[^\/]+?$/);
    let imgIcon;

    if (isImgDir) {

        imgIcon = `<img src="${dir}/${files[idx]}">`;

    } else {
        imgIcon = '<img src="./res/folder.png" style="width:212px;">';
    }

    return `<li class="dir-thumb">
            <a target="_blank" 
            onclick="createView('${dir}')">
                ${imgIcon}
                <p>${dirName}</p>
            </a>
            </li>`;
}

function windowOpen(path, that) {
    let { width, height } = electron.screen.getPrimaryDisplay().workAreaSize

    //    let height = Number($(that).attr('data-height'));
    //    let width = Number($(that).attr('data-width'));

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

    //window.open(path, '', `width=${$(that).attr('data-width')},height=${$(that).attr('data-height')}`);
    return false;
}