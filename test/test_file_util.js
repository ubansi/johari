const assert = require('chai').assert;

const fileUtil = require('../lib/modules/fileUtil');

describe('file util test', () => {

  describe('isDirectoryTest', () => {
    it('directory true test', () => {
      assert(fileUtil.isDirectory('./test'), 'test dir');
    });

    it('directory false test', () => {
      assert(fileUtil.isDirectory('./test/test_file_util.js') === false, 'test not dir');
    });

    it('directory null test', () => {
      assert(fileUtil.isDirectory(null) === false, 'null arg test');
    });
  });

});