const assert = require('assert');

const PhpTokenizer = require('../src/phpTokenizer');
const testCode = '<? class test { public function __constructor(string test, int number){ return true; } } ?>';
const TestStream = require('./testStream');


describe('phpTokenizer', () => {
    it('should be defined', () => {
        assert(typeof PhpTokenizer === 'function');
    });

    it('should save first argument to this.code', () => {
        const tokenizer = new PhpTokenizer(testCode);
        assert.equal(testCode, tokenizer.code);
    });

    it('should return raw code from getRawCode', () => {
        const tokenizer = new PhpTokenizer(testCode);
        assert.equal(testCode, tokenizer.getRawCode());
    });

    it('should parse and return tokens', () => {
        const tokenizer = new PhpTokenizer(testCode);
        let tokens = tokenizer.tokenizeCode();

        assert(tokens);
        assert.equal('object', typeof tokens);
        assert.equal(21, tokens.length);
    });

    it ('should return a stream', (done) =>{
        const tokenizer = new PhpTokenizer(testCode);
        let data = [];
        let stream = tokenizer.tokenizeStream();

        assert.equal('object', typeof stream);

        stream.on('data', (chunk) => {
            data.push(chunk.toString());
        });

        stream.on('end', () => {

            const expectedArray = tokenizer.tokenizeCode();

            assert.equal(21, data.length);
            assert.equal(expectedArray.length, data.length);
            assert.deepEqual(expectedArray, data);
            done();
        });

    });

    it ('should be able to handle multiple streams', (done) =>{

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

            assert.equal(21, data.length);
            assert.equal(21, data2.length);

            assert.equal(expectedArray.length, data.length);
            assert.equal(expectedArray.length, data2.length);

            assert.deepEqual(expectedArray, data);
            assert.deepEqual(expectedArray, data2);
            done();
        });

    });
});