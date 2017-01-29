'use strict';

const classMeta = require('../src/classMeta');

class PhpClassParser {
    constructor(readableStream) {
        this.readableStream = readableStream;
        this.classMeta = classMeta;

        this.isParsingClassName = false;
        this.isParsingInterface = false;

        this._parseClassName(readableStream);
    }

    _parseClassName(readableStream) {

        let previousToken = '';

        readableStream.on('data', (chunk) => {
            let currentToken = chunk.toString();

            this._determineIfParsing(currentToken);

            if (this.isParsingClassName) {
                this._parsePreviousToken(previousToken, currentToken);
            }

            previousToken = currentToken;
        });
    }

    _determineIfParsing(currentToken) {

        if (currentToken === 'class') {
            this.isParsingClassName = true;
        } else if (this.isParsingClassName && currentToken === '{') {
            this.isParsingClassName = false;
        }

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