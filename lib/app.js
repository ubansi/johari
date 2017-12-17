const fs = require('fs');
const $ = require('jquery');

const img = require('./lib/modules/image');
const config = require('./config.json');

$(() => {
    fs.readdir(config.read_dir, (err, files) => {
        if (err) throw err
        let fileList = files.filter((file) => {
            return img.isImage(file);
        });

        fileList.forEach((val) => {
            let path = `${config.read_dir}/${val}`;
            let name = val.replace(/.+\//,'');
            $('#img-list').append(`<li class="image-thumb"><img src="${path}" title="${name}"></li>`);
        });
    });
});