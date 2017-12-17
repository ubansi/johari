const fs = require('fs');
const $ = require('jquery');
let config = require('./config.json');

$(() => {
    fs.readdir(config.read_dir, (err, files) => {
        if (err) throw err
        // let fileList = files.filter((file) => {
        //     return fs.statSync(file).isFile();
        // });
        files.forEach((val) => {
            $('ul').append(`<li>${val}</li>`);
        });
    });
});
