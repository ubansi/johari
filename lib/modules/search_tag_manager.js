let selectTags = [];

exports.setSearchTag = (tag) => {
  if (!tag) return;

  if (selectTags.every((select) => {
    return select._id != tag._id;
  })) {
    selectTags.push(tag);
  }
};

exports.removeSearchTag = (target) => {
  if (!target) return;
  
  exports.removeSearchTagById(target._id);
};

exports.resetSearchTag = () => {
  selectTags = [];
};

exports.removeSearchTagById = (targetId) => {
  selectTags = selectTags.filter((tag) => {
    return targetId != tag._id;
  });
};

exports.getSearchTag = () => {
  return selectTags;
};

exports.getSearchTagIds = () => {
  if (selectTags) {
    return selectTags.map((tag) => {
      return tag._id;
    });
  }
  return [];
};