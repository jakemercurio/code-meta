'use strict';

const stream = require('stream');
const Readable = stream.Readable;

class TestStream {

    static classTokens() {

        let readable = new Readable();

        [
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
            'pubic',
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
        ].forEach((token)=>{
            readable.push(token);
        });

        readable.push(null);

        return readable;
    }
}

module.exports = TestStream;
