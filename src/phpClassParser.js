'use strict';

const classMeta = require('../src/classMeta');

class PhpClassParser {
    constructor(readableStream) {
        this.readableStream = readableStream;
        this.classMeta = classMeta;

        this.isParsingDeclaration = false;
        this.isParsingInterface = false;

        this._parseClassDeclaration(readableStream);
    }

    _parseClassDeclaration(readableStream) {

        let previousToken = '';

        readableStream.on('data', (chunk) => {
            let currentToken = chunk.toString();

            if (this._isParsingDeclaration(currentToken)) {
                this._parsePreviousToken(previousToken, currentToken);
            }

            previousToken = currentToken;
        });
    }

    _isParsingDeclaration(currentToken) {

        if (currentToken === 'class') {
            this.isParsingDeclaration = true;
        } else if (this.isParsingDeclaration && currentToken === '{') {
            this.isParsingDeclaration = false;
        }

        return this.isParsingDeclaration;
    }

    _parsePreviousToken(previousToken, currentToken) {
        switch(previousToken) {
            case 'abstract':
                this.classMeta.isAbstract = true;
                break;
            case 'class':
                this.classMeta.name = currentToken;
                break;
            case 'extends':
                this.classMeta.parent = currentToken;
                break;
            case 'implements':
                this.classMeta.interfaces.push(currentToken);
                this.isParsingInterface = true;
                break;
            case ',':
                if (this.isParsingInterface) {
                    this.classMeta.interfaces.push(currentToken);
                }
        }
    }


}

module.exports = PhpClassParser;