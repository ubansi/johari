const config = require('./../../config.json');

const exts = config.img_exts;
let extRegEx = exts.map(ext => { return new RegExp('.+\.' + ext + '$') });

exports.isImage = (file) => {
    if (!file) return false;
    if (!exts) return false;

    return extRegEx.some(regex => {
        return regex.test(file)
    });

}