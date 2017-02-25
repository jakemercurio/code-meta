const assert = require('assert');

const PhpFileParser = require('../src/PhpFileParser');

const testCode = [
    '<?',
    'namespace',
    'Library\\Controllers',
    ';',
    'abstract',
    'class',
    'TestClass',
    'extends',
    'ParentClass',
    'implements',
    'TestInterface1',
    ',',
    'TestInterface2',
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
    'test',
    ')',
    '{',
    'return',
    'true',
    ';',
    '}',
    '}'
];

describe('PhpFileParser', () => {

    let parser;

    beforeEach(() => {
        parser = new PhpFileParser();
    });

    it('should be defined', () => {
        assert(typeof PhpFileParser === 'function');
    });


    describe('setName', () => {

        it('should be defined', () => {
            assert(typeof parser.setName === 'function');
        });

        it('should set name', () => {
            const name = 'TestFile.php';
            parser.setName(name);

            assert.equal(parser.fileMeta.name, name);
        });

    });

    describe('setPath', () => {

        it('should be defined', () => {
            assert(typeof parser.setPath === 'function');
        });

        it('should set path', () => {
            const path = '/src/files';
            parser.setPath(path);

            assert.equal(parser.fileMeta.path, path);
        });

    });

    describe('parseFile', () => {

        it('should be defined', () => {
            assert(typeof parser.parseFile === 'function');
        });

        it('should parse number of line', () => {

            let previousToken;

            testCode.forEach((currentToken) => {
                parser.parseFile(previousToken, currentToken);
                previousToken = currentToken;
            });

            assert.equal(parser.fileMeta.lines, 8);
        });

        it('should parse namespace', () => {

            let previousToken;

            testCode.forEach((currentToken) => {
                parser.parseFile(previousToken, currentToken);
                previousToken = currentToken;
            });

            let fileMeta = parser.getFile();

            assert.equal(fileMeta.namespace, 'Library\\Controllers');
        });

        it('should parse class', () => {

            let previousToken;

            testCode.forEach((currentToken) => {
                parser.parseFile(previousToken, currentToken);
                previousToken = currentToken;
            });

            let fileMeta = parser.getFile();

            assert.equal(fileMeta.classes.length, 1);
        });

    });


});