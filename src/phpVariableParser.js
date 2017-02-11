'use strict';

const classMeta = require('../src/classMeta');
const variableMeta = require('../src/variableMeta');

class PhpVariableParser {
    constructor() {
        this.variableMeta = variableMeta;
        this.isParsingProperty = false;
    }

    parseVariable(previousToken, currentToken) {

        switch (previousToken) {
            case 'private':
            case 'protected':
            case 'public':
            case 'var':
                if (currentToken !== 'function') {
                    this.isParsingProperty = true;
                    this.variableMeta.name = currentToken;

                    this.variableMeta.scope = previousToken === 'var' ? 'public' : previousToken;
                }
                break;
            case '=':
                if (this.isParsingProperty) {
                    this.variableMeta.value = currentToken;
                    this.isParsingProperty = false;

                    return this.variableMeta;
                }
                break;
            case ';':
                this.variableMeta = variableMeta;
        }

    }

}

module.exports = PhpVariableParser;