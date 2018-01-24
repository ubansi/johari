let selectTags = [];

/**
 * set search tag
 * @param {{name:string,_id:string}} tag 
 */
const setSearchTag = (tag) => {
  if (!tag) return;

  if (selectTags.every((select) => {
    return select._id != tag._id;
  })) {
    selectTags.push(tag);
  }
};

/**
 * remove tag from search tags
 * @param {{name:string,_id:string}} target
 */
const removeSearchTag = (target) => {
  if (!target) return;
  
  exports.removeSearchTagById(target._id);
};

/**
 * clear all search tags
 */
const resetSearchTag = () => {
  selectTags = [];
};

/**
 * remove search tag by id
 * @param {string} targetId 
 */
const removeSearchTagById = (targetId) => {
  selectTags = selectTags.filter((tag) => {
    return targetId != tag._id;
  });
};

/**
 * @return {{name:string,_id:string}[]}
 */
const getSearchTag = () => {
  return selectTags;
};

/**
 * @return {{name:string,_id:string}[]}
 */
const getSearchTagIds = () => {
  if (selectTags) {
    return selectTags.map((tag) => {
      return tag._id;
    });
  }
  return [];
};

exports.setSearchTag = setSearchTag;
exports.removeSearchTag = removeSearchTag;
exports.resetSearchTag = resetSearchTag;
exports.removeSearchTagById = removeSearchTagById;
exports.getSearchTag = getSearchTag;
exports.getSearchTagIds = getSearchTagIds;