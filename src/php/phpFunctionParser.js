'use strict';

const clone = require('clone');

const functionMeta = require('./../functionMeta');
const variableMeta = require('./../variableMeta');

class PhpFunctionParser {

    constructor() {
        this.functions = [];
        this.functionMeta = clone(functionMeta);
        this.currentVariable = clone(variableMeta);

        this.isParsingFunction = false;
        this.isParsingFunctionDeclaration = false;
        this.isParsingFunctionBody = false;
        this.isParsingInputs = false;
        this.nestingDepth = 0;
    }

    parseFunctions(previousToken, currentToken) {

        this._determineSectionOfClass(currentToken);

        if (this.isParsingFunctionDeclaration) {
            this._parseFunctionDeclaration(previousToken, currentToken);
        }

        if (this.isParsingFunctionBody) {
            this._parseFunctionBody(currentToken);
        }
    }

    _determineSectionOfClass(currentToken) {

        switch (currentToken) {
            case 'function':
                this.isParsingFunction = true;
                this.isParsingFunctionDeclaration = true;
                break;
            case '(':
                if (this.isParsingFunction && this.isParsingFunctionDeclaration) {
                    this.isParsingInputs = true;
                }
                break;
            case ')':
                if (this.isParsingFunction && this.isParsingInputs) {
                    this.isParsingInputs = false;
                    this._addCurrentVariableToInput();
                }
                break;
            case '{':

                if (this.isParsingFunctionDeclaration) {
                    this.isParsingFunctionDeclaration = false;
                    this.isParsingFunctionBody = true;
                    break;
                }

                if (this.isParsingFunction && this.isParsingFunctionBody) {
                    this.nestingDepth++;
                }

                break;
            case '}':
                if (this.isParsingFunction && this.isParsingFunctionBody) {
                    this.nestingDepth--;
                }
        }

        if (this.isParsingFunction && this.nestingDepth === -1) {
            this.isParsingFunctionBody = false;
            this.nestingDepth = 0;
            this.functions.push(this.functionMeta);
            this.functionMeta = clone(functionMeta);
        }
    }

    _parseFunctionDeclaration(previousToken, currentToken) {

        if (previousToken === 'function') {
            this.functionMeta.name = currentToken;
        }

        if (currentToken === 'function') {
            switch (previousToken) {
                case 'private':
                case 'protected':
                case 'public':
                    this.functionMeta.scope = previousToken;
            }
        }

        this._parseInputParams(previousToken, currentToken);
    }

    _parseInputParams(previousToken, currentToken) {

        if (!this.isParsingInputs) {
            return;
        }

        if (currentToken === ',') {
            this._addCurrentVariableToInput();
        }

        if (previousToken === '=') {
            this.currentVariable.value = currentToken;
        } else if (currentToken.slice(0, 1) === '$') {
            this.currentVariable.name = currentToken;
            this.currentVariable.scope = 'private';
        } else if (previousToken === '(' || previousToken === ',') {
            this.currentVariable.type = currentToken;
        }
    }

    _parseFunctionBody(currentToken) {

        switch (currentToken) {
            case ';':
            case '{':
            case '}':
                this.functionMeta.lines++;
        }
    }

    _addCurrentVariableToInput() {

        if (this.currentVariable.name) {
            this.functionMeta.inputs.push(this.currentVariable);
            this.currentVariable = clone(variableMeta);
        }

    }

    getFunctions() {
        return this.functions;
    }

}

module.exports = PhpFunctionParser;