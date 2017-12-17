let fs = require('fs');

let config = require('./config.json');

fs.readdir(config.read_dir, (err, files) => {
    if (err) throw err
    // let fileList = files.filter((file) => {
    //     return fs.statSync(file).isFile();
    // });
    console.log(files);
});
