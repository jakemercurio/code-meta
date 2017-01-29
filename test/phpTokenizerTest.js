var assert = require('assert');

const PhpTokenizer = require('../src/phpTokenizer');
const testCode = '<? class test { public function __constructor(string test, int number){ return true; } } ?>';

describe('phpTokenizer', function() {
    it('should be defined', function() {
        assert(typeof PhpTokenizer === 'function');
    });

    it('should save first argument to this.code', function() {
        const tokenizer = new PhpTokenizer(testCode);
        assert.equal(testCode, tokenizer.code);
    });

    it('should return raw code from getRawCode', function() {
        const tokenizer = new PhpTokenizer(testCode);
        assert.equal(testCode, tokenizer.getRawCode());
    });

    it('should parse and return tokens', function() {
        const tokenizer = new PhpTokenizer(testCode);
        let tokens = tokenizer.tokenizeCode();

        assert(tokens);
        assert.equal('object', typeof tokens);
        assert.equal(21, tokens.length);
    });
});