const fs = require('fs');
const config = require('./../../config.json');

const exts = config.img_exts;
let extRegEx = exts.map(ext => { return new RegExp('.+\\.' + ext + '$'); });

exports.isImage = (file) => {
  if (!file) return false;
  if (!exts) return false;

  return extRegEx.some(regex => {
    return regex.test(file);
  });
};

exports.firstImage = (dir) => {
  let files = fs.readdirSync(dir);
  let idx;
  let isImgDir = files.some((file, index) => {
    if (exports.isImage(`${dir}/${file}`)) {
      idx = index;
      return true;
    }
  });

  if (isImgDir) {
    return files[idx];
  } else {
    return null;
  }
};