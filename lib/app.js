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
    $('#img-list').append(`<li class="image-thumb"><a href="${path}" target="_blank"><img src="${path}" title="${name}"></a></li>`);

};

function isDirectory(file) {
    return fs.existsSync(file) && fs.statSync(file).isDirectory();
};

function createView(dir) {

    $('#img-list').empty();
    let dirLink = `<li><input type="button" onClick="createView('${dir}/..')" value="${dir}/.."></input></li>`;
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