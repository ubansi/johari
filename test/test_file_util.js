const assert = require('chai').assert;

const fileUtil = require('../lib/modules/fileUtil');

describe('file util test', () => {

  describe('isDirectory test', () => {
    it('directory true test', () => {
      assert(fileUtil.isDirectory('./test'), 'test dir');
    });

    it('directory false test', () => {
      assert(fileUtil.isDirectory('./test/test_file_util.js') === false, 'test not dir');
    });

    it('null test', () => {
      assert(fileUtil.isDirectory(null) === false, 'null arg test');
    });

    it('void test', () => {
      assert(fileUtil.isDirectory() === false, 'null arg test');
    });
  });

  describe('path2File test', () => {
    const testPath1 = 'aaa/bbb/ccc';
    const testPath2 = 'aaa/bbb/ccc/';

    it(testPath1 + ' test', () => {
      assert.equal(fileUtil.path2File(testPath1), 'ccc', 'normal path');
    });

    it(testPath2 + ' test', () => {
      assert.equal(fileUtil.path2File(testPath2), null, 'normal path');
    });

    it('null path test', () => {
      assert.equal(fileUtil.path2File(null), null, 'normal path');
    });

    it('void path test', () => {
      assert.equal(fileUtil.path2File(''), null, 'normal path');
    });
  });

  describe('directory test', () => {
    const testPath1 = 'aaa/bbb/ccc';
    const testPath2 = 'aaa/bbb/ccc/';

    it(testPath1 + ' test', () => {
      assert.equal(fileUtil.directory(testPath1), 'aaa/bbb/', 'normal path');
    });

    it(testPath2 + ' test', () => {
      assert.equal(fileUtil.directory(testPath2), testPath2, 'normal path');
    });

    it('null path test', () => {
      assert.equal(fileUtil.directory(null), null, 'normal path');
    });

    it('void path test', () => {
      assert.equal(fileUtil.directory(''), null, 'normal path');
    });
  });
});