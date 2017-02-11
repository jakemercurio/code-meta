const assert = require('assert');

const PhpVariableParser = require('../src/PhpVariableParser');

describe('PhpVariableParser', () => {

    it('should be defined', () => {
        assert(typeof PhpVariableParser === 'function');
    });

    describe('parseVariable', () => {

        let parser = null;

        before(() => {
            parser = new PhpVariableParser();
        });

        it('should be defined', () => {
            assert(typeof parser.parseVariable === 'function');
        });

        it ('should parse a variable declared with var', () => {

            let previousToken = null;
            let parsedVariable = null;

            ['extra-code','var', '$test1','=','[]',';','extra-code'].forEach((currentToken) => {
                let possibleVariable = parser.parseVariable(previousToken, currentToken);

                if (possibleVariable) {
                    parsedVariable = possibleVariable;
                }

                previousToken = currentToken;
            });


            assert.equal(typeof parsedVariable, 'object');
            assert.equal(parsedVariable.name, '$test1');
            assert.equal(parsedVariable.value, '[]');
            assert.equal(parsedVariable.scope, 'public');
        });

        it ('should parse a variable declared with public', () => {

            let previousToken = null;
            let parsedVariable = null;

            ['extra-code','public', '$testVar','=','[]',';','extra-code'].forEach((currentToken) => {
                let possibleVariable = parser.parseVariable(previousToken, currentToken);

                if (possibleVariable) {
                    parsedVariable = possibleVariable;
                }

                previousToken = currentToken;
            });


            assert.equal(typeof parsedVariable, 'object');
            assert.equal(parsedVariable.name, '$testVar');
            assert.equal(parsedVariable.value, '[]');
            assert.equal(parsedVariable.scope, 'public');
        });

        it ('should parse a variable declared with protected', () => {

            let previousToken = null;
            let parsedVariable = null;

            ['extra-code','protected', '$testProtected','=','test string',';','extra-code'].forEach((currentToken) => {
                let possibleVariable = parser.parseVariable(previousToken, currentToken);

                if (possibleVariable) {
                    parsedVariable = possibleVariable;
                }

                previousToken = currentToken;
            });


            assert.equal(typeof parsedVariable, 'object');
            assert.equal(parsedVariable.name, '$testProtected');
            assert.equal(parsedVariable.value, 'test string');
            assert.equal(parsedVariable.scope, 'protected');
        });

        it ('should parse a variable declared with private', () => {

            let previousToken = null;
            let parsedVariable = null;

            ['extra-code','private', '$testPrivate','=','192',';','extra-code'].forEach((currentToken) => {
                let possibleVariable = parser.parseVariable(previousToken, currentToken);

                if (possibleVariable) {
                    parsedVariable = possibleVariable;
                }

                previousToken = currentToken;
            });


            assert.equal(typeof parsedVariable, 'object');
            assert.equal(parsedVariable.name, '$testPrivate');
            assert.equal(parsedVariable.value, '192');
            assert.equal(parsedVariable.scope, 'private');
        });

    });



});