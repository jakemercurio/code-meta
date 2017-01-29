'use strict';

var stream = require('stream');
var Readable = require('stream').Readable;


class PhpTokenize {

    constructor(code) {
        this.code = code;
    }

    getRawCode() {
        return this.code;
    }

    tokenizeCode() {
        this.tokens = this.code.replace(/([;,\(\)\{}])/g, function($0, $1) {
            return ' ' + $1 + ' ';
        }).split(/\s+/);

        return this.tokens;
    }

    tokenizeStream() {
        let tokenStream = new Readable();
        let tokenizeCode = this.tokenizeCode() || [];

        tokenizeCode.forEach((token) => {
            tokenStream.push(token);
        });

        return tokenStream;
    }

}

module.exports = PhpTokenize;