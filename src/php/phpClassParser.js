'use strict';

const clone = require('clone');

const classMeta = require('./../classMeta');
const PhpVariableParser = require('./phpVariableParser');
const PhpFunctionParser = require('./phpFunctionParser');

class PhpClassParser {

    constructor() {
        this.classes = [];
        this.classMeta = clone(classMeta);
        this.variableParser = new PhpVariableParser();
        this.functionParser = new PhpFunctionParser();

        this.isParsingDeclaration = false;
        this.isParsingInterface = false;
        this.isParsingClassBody = false;
        this.nestingDepth = 0;
    }

    parseClass(previousToken, currentToken) {

        this._determineSectionOfClass(currentToken);

        if (this.isParsingDeclaration) {
            this._parseClassDeclaration(previousToken, currentToken);
        }

        if (this.isParsingClassBody) {
            this.variableParser.parseVariable(previousToken, currentToken);
            this.functionParser.parseFunctions(previousToken, currentToken);
        }
    }

    getClass() {
        return this.classes[0];
    }

    getClasses() {
        return this.classes;
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
            this.classMeta.properties = this.variableParser.getVariables();
            this.classMeta.functions = this.functionParser.getFunctions();
            this.classes.push(this.classMeta);
            this.classMeta = clone(classMeta);
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