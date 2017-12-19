const fs = require('fs');
const $ = require('jquery');

const img = require('./lib/modules/image');
const config = require('./config.json');

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
            if (img.isImage(file)) {
                addThumb(dir, file);
            } else if (isDirectory) {
                let path = `${dir}/${file}`;
                dirLink += `<li><input type="button" onClick="createView('${path}')" value="${path}"></input></li>`;
            }
        });
        $('#img-list').prepend(dirLink);
    });
}

function windowOpen(path,that) {
    
    window.open(path, '', `width=${$(that).attr('data-width')},height=${$(that).attr('data-height')}`);
    return false;
}