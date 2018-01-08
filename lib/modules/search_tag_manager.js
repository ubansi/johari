const Datastore = require('nedb');

const tagDB = new Datastore({
  filename: 'db/tag.db',
});

let selectTag = [];

exports.setSearchTag = (tag) => {
  selectTag.push(tag);
};

exports.removeSearchTag = (target) => {
  exports.removeSearchTagById(target._id);
};

exports.removeSearchTagById = (targetId) => {
  selectTag = selectTag.filter((tag) => {
    return targetId != tag._id;
  });
};

exports.getSearchTag = () => {
  return selectTag;
};

exports.getSearchTagIds = () => {
  if (selectTag) {
    return selectTag.map((tag) => {
      return tag._id;
    });
  }
  return [];
};