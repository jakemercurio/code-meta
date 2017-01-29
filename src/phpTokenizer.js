'use strict';

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

}

module.exports = PhpTokenize;