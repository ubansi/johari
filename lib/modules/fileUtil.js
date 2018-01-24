const fs = require('fs');

/**
 * is directory
 * @param {string} file
 * @return {boolean} 
 */
const isDirectory = (file) => {
  return fs.existsSync(file) && fs.statSync(file).isDirectory();
};

/**
 * file name from file path
 * @param {string} path 
 */
const path2File = (path) => {
  if (!path) return null;
  return path.match(/[^/]+?$/);
};

/**
 * directory path from file path
 * @param {string} path 
 * @return {string}
 */
const directory = (path) => {
  if (!path) return null;
  return path.replace(/[^/]+$/, '');
};

exports.directory = directory;
exports.path2File = path2File;
exports.isDirectory = isDirectory;