const assert = require('assert');

const PhpFunctionParser = require('../src/php/phpFunctionParser');

const testCode = [
    '<?',
    'abstract',
    'class',
    'TestClass',
    '{',
    'public',
    '$var1',
    '=',
    '1',
    ';',
    'public',
    'function',
    '__constructor',
    '(',
    'string',
    '$test',
    ')',
    '{',
    'return',
    'true',
    ';',
    '}',
    'private',
    'function',
    'getVar1',
    '(',
    'string',
    '$input1',
    ',',
    '$input2',
    '=',
    '3',
    ')',
    '{',
    'return',
    '$this->var1',
    '+',
    '$input1',
    ';',
    '}',
    '}'
];

describe('PhpFunctionParser', () => {

    let parser;

    beforeEach(() => {
        parser = new PhpFunctionParser();
    });

    it('should be defined', () => {
        assert(typeof PhpFunctionParser === 'function');
    });

    describe('parseFunctions', () => {

        it('should detect when a function is being parsed', () => {

            let previousToken = null;

            testCode.slice(0, 20).forEach((currentToken) => {
                parser.parseFunctions(previousToken, currentToken);
                previousToken = currentToken;
            });

            assert.equal(parser.nestingDepth, 0);
            assert.equal(parser.isParsingFunction, true);

        });

        it('should parse function meta data', () => {

            let previousToken = null;

            testCode.slice(20).forEach((currentToken) => {
                parser.parseFunctions(previousToken, currentToken);
                previousToken = currentToken;
            });


            assert.equal(parser.getFunctions()[0].name, 'getVar1');
            assert.equal(parser.getFunctions()[0].scope, 'private');
            assert.equal(parser.getFunctions()[0].lines, 3);
            assert.equal(parser.getFunctions()[0].isStatic, false);

        });

        it('should detect function inputs', () => {

            let previousToken = null;

            testCode.slice(20).forEach((currentToken) => {
                parser.parseFunctions(previousToken, currentToken);
                previousToken = currentToken;
            });

            assert.equal(parser.getFunctions()[0].inputs.length, 2);
            assert.equal(parser.getFunctions()[0].inputs[0].name, '$input1');
            assert.equal(parser.getFunctions()[0].inputs[0].type, 'string');
            assert.equal(parser.getFunctions()[0].inputs[0].value, null);
            assert.equal(parser.getFunctions()[0].inputs[1].name, '$input2');
            assert.equal(parser.getFunctions()[0].inputs[1].type, 'mixed');
            assert.equal(parser.getFunctions()[0].inputs[1].value, 3);

        });

    });

});