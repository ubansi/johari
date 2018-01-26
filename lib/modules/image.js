const fs = require('fs');
const config = require('./../../config.json');

const exts = config.img_exts;
const extRegEx = exts.map(ext => { return new RegExp('.+\\.' + ext + '$'); });

/**
 * Determine whether the image is an image or not
 * @param {string} path 
 * @return {boolean}
 */
const isImage = (path) => {
  if (!path) return false;
  if (!exts) return false;

  return extRegEx.some(regex => {
    return regex.test(path);
  });
};

/**
 * first image path in dir path
 * @param {string} dir 
 * @return {string}
 */
const firstImage = (dir) => {
  const files = fs.readdirSync(dir);
  let idx;
  const isImgDir = files.some((file, index) => {
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

exports.isImage = isImage;
exports.firstImage = firstImage;