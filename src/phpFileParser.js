'use strict';
const clone = require('clone');
const fileMeta = require('./fileMeta');
const PhpClassParser = require('./phpClassParser');

class PhpFileParser {

    constructor(fileName, path) {
        this.fileMeta = clone(fileMeta);
        this.phpClassParser = new PhpClassParser();

        this.fileMeta.name = fileName;
        this.fileMeta.path = path;
    }

    setName(name) {
        this.fileMeta.name = name;
    }

    setPath(path) {
        this.fileMeta.path = path;
    }

    parseFile(previousToken, currentToken) {
        this._parseLines(currentToken);
        this._parseNameSpace(previousToken, currentToken);

        this.phpClassParser.parseClass(previousToken, currentToken);
    }

    getFile() {
        this.fileMeta.classes = this.phpClassParser.getClasses();
        return this.fileMeta;
    }

    _parseLines(currentToken) {

        switch (currentToken) {
            case ';':
            case '{':
            case '}':
            case '<?':
            case '?>':
                this.fileMeta.lines++;
        }
    }

    _parseNameSpace(previousToken, currentToken) {

        if (previousToken === 'namespace'){
            this.fileMeta.namespace = currentToken;
        }
    }

}

module.exports = PhpFileParser;