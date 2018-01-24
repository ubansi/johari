let selectTags = [];

const setSearchTag = (tag) => {
  if (!tag) return;

  if (selectTags.every((select) => {
    return select._id != tag._id;
  })) {
    selectTags.push(tag);
  }
};

const removeSearchTag = (target) => {
  if (!target) return;
  
  exports.removeSearchTagById(target._id);
};

const resetSearchTag = () => {
  selectTags = [];
};

const removeSearchTagById = (targetId) => {
  selectTags = selectTags.filter((tag) => {
    return targetId != tag._id;
  });
};

const getSearchTag = () => {
  return selectTags;
};

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