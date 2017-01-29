'use strict';

const stream = require('stream');
const Readable = stream.Readable;

class PhpTokenize {

    constructor(code) {
        this.code = code;
    }

    getRawCode() {
        return this.code;
    }

    tokenizeCode() {
        return this.code.replace(/([;,\(\)\{}])/g, function($0, $1) {
            return ' ' + $1 + ' ';
        }).split(/\s+/);
    }

    tokenizeStream() {
        let tokenStream = new Readable();
        let tokenizeCode = this.tokenizeCode() || [];

        tokenizeCode.forEach((token) => {
            tokenStream.push(token);
        });

        tokenStream.push(null);

        return tokenStream;
    }

}

module.exports = PhpTokenize;