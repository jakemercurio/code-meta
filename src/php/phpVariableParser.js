'use strict';

const classMeta = require('../classMeta');
const variableMeta = require('../variableMeta');

class PhpVariableParser {
    constructor() {
        this.variables = [];
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
            case 'static':
                if (this.isParsingProperty) {
                    this.variableMeta.isStatic = true;
                    this.variableMeta.name = currentToken;
                    break;
                }
                break;
            case '=':
                if (this.isParsingProperty) {
                    this.variableMeta.value = currentToken;
                    this.isParsingProperty = false;
                }
                break;
            case ';':
                this.variables.push(this.variableMeta);
                this.variableMeta = variableMeta;
        }

    }

    getVariables() {
        return this.variables || [];
    }

}

module.exports = PhpVariableParser;