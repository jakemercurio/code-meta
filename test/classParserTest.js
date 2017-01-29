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

    it('should parse one classMeta object', () => {

        const parser = new PhpClassParser(TestStream.classTokens());

        assert.equal('object', typeof parser.classMeta);
        assert.equal('TestClass', parser.classMeta.name);
        assert.equal('ParentClass', parser.classMeta.parent);
        assert.equal('TestInterface1', parser.classMeta.interfaces[0]);
        assert.equal('TestInterface2', parser.classMeta.interfaces[1]);
        assert.equal(true, parser.classMeta.isAbstract);

    });

});