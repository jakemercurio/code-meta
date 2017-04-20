const assert = require('assert');

const PhpClassParser = require('../src/php/phpClassParser');

const testCode = [
    '<?',
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

describe('PhpClassParser', () => {

    let parser;

    beforeEach(() => {
        parser = new PhpClassParser();
    });

    it('should be defined', () => {
        assert(typeof PhpClassParser === 'function');
    });

    describe('parseClass', () => {

        it('should detect when a class is being parsed', () => {

            let previousToken = null;

            testCode.slice(0,15).forEach((currentToken) => {
                parser.parseClass(previousToken, currentToken);
                previousToken = currentToken;
            });

            assert.equal(parser.nestingDepth, 0);
            assert.equal(parser.isParsingClassBody, true);

        });

        it('should parse one classMeta object', () => {

            let previousToken = null;

            testCode.forEach((currentToken) => {
                parser.parseClass(previousToken, currentToken);
                previousToken = currentToken;
            });

            let classMeta = parser.getClass();

            assert.equal(typeof classMeta, 'object');

            assert.equal(classMeta.name, 'TestClass');
            assert.equal(classMeta.parent, 'ParentClass');
            assert.equal(classMeta.interfaces[0], 'TestInterface1');
            assert.equal(classMeta.interfaces[1], 'TestInterface2');
            assert.equal(true, classMeta.isAbstract);

            const firstProperty = classMeta.properties[0];
            assert.equal(typeof firstProperty, 'object');
            assert.equal(firstProperty.name, '$var1');
            assert.equal(firstProperty.value, 1);

        });

    });

    describe('getClasses', () => {

        it('should return array of classes', () => {
            let previousToken = null;

            testCode.forEach((currentToken) => {
                parser.parseClass(previousToken, currentToken);
                previousToken = currentToken;
            });

            let classesMeta = parser.getClasses();

            assert.equal(classesMeta.length, 1);
            assert.equal(typeof classesMeta[0], 'object');
            assert.equal(classesMeta[0], parser.classMeta);
        });

    });

});