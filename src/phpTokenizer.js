'use strict';

const stream = require('stream');
const Readable = stream.Readable;

class PhpTokenize {

    constructor(code) {
        this.code = code;
        this.tokens = [];
        this.currentToken = '';
    }

    getRawCode() {
        return this.code;
    }

    tokenizeCode() {

        if (this.tokens.length) {
            return this.tokens;
        }

        let isParsingString = false;
        let stringDelimiter = null;

        for (let i = 0; i < this.code.length; i++) {

            let currentChar = this.code[i];

            switch (currentChar) {
                case ';':
                case ',':
                case '(':
                case ')':
                case '{':
                case '}':
                    this._pushToken(this.currentToken);
                    this._pushToken(currentChar);
                    break;
                case '\'':
                case '"':
                    if (isParsingString && currentChar === stringDelimiter) {
                        isParsingString = false;
                    } else {
                        stringDelimiter = currentChar;
                        isParsingString = true;
                    }

                    this.currentToken += currentChar;
                    break;
                case ' ':
                case '\t':
                case '\n':
                    if (isParsingString) {
                        this.currentToken += currentChar;
                    } else {
                        this._pushToken(this.currentToken);
                    }

                    break;
                default:
                    this.currentToken += currentChar;
            }
        }

        // push last token
        this._pushToken(this.currentToken);

        return this.tokens;
    }

    _pushToken(token) {
        if (token.length) {
            this.tokens.push(token);
            this.currentToken = '';
        }
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