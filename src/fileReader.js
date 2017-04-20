const fs = require('fs');

const PhpTokenizer = require('./php/phpTokenizer');
const PhpFileParser = require('./php/phpFileParser');

class FileReader {

     static parsePhpFile(filePath, fileName, path, callback) {

         fs.readFile(filePath, 'utf8', function(err, data) {
             let tokenizer = new PhpTokenizer(data);
             let stream = tokenizer.tokenizeStream();
             let phpFileParser = new PhpFileParser(fileName, path);
             let previousToken;

             stream.on('data', (chunk) => {
                 let currentToken = chunk.toString();
                 phpFileParser.parseFile(previousToken, currentToken);
                 previousToken = currentToken;
             });

             stream.on('end', () => {
                 callback(err, phpFileParser.getFile());
             });
         });

     }

}

module.exports = FileReader;
