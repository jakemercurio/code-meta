'use strict';

const classMeta = require('./classMeta');
const PhpVariableParser = require('./phpVariableParser');

class PhpClassParser {
    constructor(readableStream) {
        this.readableStream = readableStream;
        this.classMeta = classMeta;
        this.variableParser = new PhpVariableParser();

        this.isParsingDeclaration = false;
        this.isParsingInterface = false;
        this.isParsingClassBody = false;
        this.nestingDepth = 0;

        this._parseClass(readableStream);
    }

    _parseClass(readableStream) {

        let previousToken = '';

        readableStream.on('data', (chunk) => {
            let currentToken = chunk.toString();

            this._determineSectionOfClass(currentToken);

            if (this.isParsingDeclaration) {
                this._parseClassDeclaration(previousToken, currentToken);
            }

            if (this.isParsingClassBody) {
                this.variableParser.parseVariable(previousToken, currentToken);
            }

            previousToken = currentToken;
        });

        readableStream.on('end', () => {
            this.classMeta.properties = this.variableParser.getVariables();
        });
    }

    _determineSectionOfClass(currentToken) {

        if (currentToken === 'class') {
            this.isParsingDeclaration = true;
        } else if (this.isParsingDeclaration && currentToken === '{') {
            this.isParsingDeclaration = false;
            this.isParsingClassBody = true;
        } else if (this.isParsingClassBody && currentToken === '{') {
            this.nestingDepth++;
        } else if (this.isParsingClassBody && currentToken === '}') {
            this.nestingDepth--;
        }

        if (this.isParsingClassBody && this.nestingDepth === -1) {
            this.isParsingClassBody = false;
            this.nestingDepth = 0;
        }
    }

    _parseClassDeclaration(previousToken, currentToken) {
        switch (previousToken) {
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