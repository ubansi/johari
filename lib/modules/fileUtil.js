const fs = require('fs');

exports.isDirectory = (file)=> {
    return fs.existsSync(file) && fs.statSync(file).isDirectory();
};

exports.path2File = (path) =>{
    return path.match(/[^\/]+?$/);
}

exports.directory = (path) =>{
    return path.replace(/[^\/]+$/,'');
}