const assert = require('assert');

const PhpClassParser = require('../src/PhpClassParser');
const TestStream = require('./testStream');

describe('PhpClassParser', () => {

    it('should be defined', () => {
        assert(typeof PhpClassParser === 'function');
    });

    it('should accept readable stream as first param', () => {

        const parser = new PhpClassParser(TestStream.classTokens());

        assert.equal('object', typeof parser.readableStream);
    });

    it('should detect when a class is being parsed', (done) => {

        const stream = TestStream.classDeclaration();
        const parser = new PhpClassParser(stream);

        stream.on('end', () => {
            assert.equal(parser.nestingDepth, 0);
            assert.equal(parser.isParsingClassBody, true);
            done();
        });

    });

    it('should parse one classMeta object', (done) => {

        const stream = TestStream.classTokens();
        const parser = new PhpClassParser(stream);

        stream.on('end', () => {
            assert.equal(typeof parser.classMeta, 'object');

            assert.equal(parser.classMeta.name, 'TestClass');
            assert.equal(parser.classMeta.parent, 'ParentClass');
            assert.equal(parser.classMeta.interfaces[0], 'TestInterface1');
            assert.equal(parser.classMeta.interfaces[1], 'TestInterface2');
            assert.equal(true, parser.classMeta.isAbstract);

            const firstProperty = parser.classMeta.properties[0];
            assert.equal(typeof firstProperty, 'object');
            assert.equal(firstProperty.name, '$var1');
            assert.equal(firstProperty.value, 1);

            done();
        });



    });

});