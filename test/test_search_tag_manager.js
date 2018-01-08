const assert = require('chai').assert;

const tagManager = require('../lib/modules/search_tag_manager');
describe('search tag manager test', () => {
  describe('set search tag test', () => {
    const testTag = { name: 'testTagName', _id: 'testId' };
    const testTag2 = { name: 'testTagName2', _id: 'testId2' };
    tagManager.resetSearchTag();

    it('set normal tag test', () => {
      tagManager.setSearchTag(testTag);
      assert.deepEqual(tagManager.getSearchTag(), [testTag], 'add test');
    });

    it('duplicate tag test', () => {
      // don't reset
      tagManager.setSearchTag(testTag);
      assert.deepEqual(tagManager.getSearchTag(), [testTag], 'not add test');
    });

    it('set diffarent tag test', () => {
      // don't reset
      tagManager.setSearchTag(testTag2);
      assert.deepEqual(tagManager.getSearchTag(), [testTag, testTag2], 'normal add test');
    });

    it('reset test', () => {
      tagManager.resetSearchTag();
      assert.deepEqual(tagManager.getSearchTag(), [], 'reset test');
    });

    it('set null test', () => {
      tagManager.setSearchTag(null);
      assert.deepEqual(tagManager.getSearchTag(), [], 'do not set null');
    });
  });

  tagManager.resetSearchTag();

  describe('remove tag test', () => {
    const testTag = { name: 'testTagName', _id: 'testId' };
    const testTag2 = { name: 'testTagName2', _id: 'testId2' };

    it('remove null test', () => {
      tagManager.setSearchTag(testTag);
      tagManager.setSearchTag(testTag2);

      tagManager.removeSearchTag(null);
      assert.deepEqual(tagManager.getSearchTag(), [testTag, testTag2]);
    });


    it('remove testTag test', () => {
      tagManager.resetSearchTag();
      tagManager.setSearchTag(testTag);
      tagManager.setSearchTag(testTag2);

      tagManager.removeSearchTag(testTag);
      assert.deepEqual(tagManager.getSearchTag(), [testTag2]);
    });

    it('remove testTag2 by ID test', () => {
      tagManager.resetSearchTag();
      tagManager.setSearchTag(testTag);
      tagManager.setSearchTag(testTag2);

      tagManager.removeSearchTagById(testTag2._id);
      assert.deepEqual(tagManager.getSearchTag(), [testTag]);
    });
  });

  describe('get searchTagIds test',()=>{
    const testTag = { name: 'testTagName', _id: 'testId' };
    const testTag2 = { name: 'testTagName2', _id: 'testId2' };
    
    it('get two id test', () => {
      tagManager.resetSearchTag();
      tagManager.setSearchTag(testTag);
      tagManager.setSearchTag(testTag2);
  
      assert.deepEqual(tagManager.getSearchTagIds(), [testTag._id,testTag2._id]);
    });

    it('get no id test', () => {
      tagManager.resetSearchTag();
    
      assert.deepEqual(tagManager.getSearchTagIds(), []);
    });
  });
});