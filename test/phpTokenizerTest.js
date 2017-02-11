const assert = require('assert');

const PhpTokenizer = require('../src/phpTokenizer');
const testCode = "<? class test { public function __constructor(string test = 'test value', int number){ return true; } } ?>";
const numberOfTokens = 23;


describe('phpTokenizer', () => {
    it('should be defined', () => {
        assert.equal(typeof PhpTokenizer, 'function');
    });

    it('should save first argument to this.code', () => {
        const tokenizer = new PhpTokenizer(testCode);
        assert.equal(tokenizer.code, testCode);
    });

    it('should return raw code from getRawCode', () => {
        const tokenizer = new PhpTokenizer(testCode);
        assert.equal(tokenizer.getRawCode(), testCode);
    });

    it('should parse and return tokens', () => {
        const tokenizer = new PhpTokenizer(testCode);
        let tokens = tokenizer.tokenizeCode();

        assert(tokens);
        assert.equal(typeof tokens, 'object');
        assert.equal(tokens.length, numberOfTokens);
    });

    it('should return a stream', (done) => {
        const tokenizer = new PhpTokenizer(testCode);
        let data = [];
        let stream = tokenizer.tokenizeStream();

        assert.equal('object', typeof stream);

        stream.on('data', (chunk) => {
            data.push(chunk.toString());
        });

        stream.on('end', () => {

            const expectedArray = tokenizer.tokenizeCode();

            assert.equal(numberOfTokens, data.length);
            assert.equal(expectedArray.length, data.length);
            assert.deepEqual(expectedArray, data);
            done();
        });

    });

    it('should be able to handle multiple streams', (done) => {

        const tokenizer = new PhpTokenizer(testCode);
        let data = [];
        let data2 = [];
        let stream = tokenizer.tokenizeStream();

        assert.equal('object', typeof stream);

        stream.on('data', (chunk) => {
            data.push(chunk.toString());
        });

        stream.on('data', (chunk) => {
            data2.push(chunk.toString());
        });

        stream.on('end', () => {

            const expectedArray = tokenizer.tokenizeCode();

            assert.equal(numberOfTokens, data.length);
            assert.equal(numberOfTokens, data2.length);

            assert.equal(expectedArray.length, data.length);
            assert.equal(expectedArray.length, data2.length);

            assert.deepEqual(expectedArray, data);
            assert.deepEqual(expectedArray, data2);
            done();
        });

    });
});