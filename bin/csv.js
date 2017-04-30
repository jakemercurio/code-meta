const fs = require('fs');

const fileSystem = require('file-system');
const json2csv = require('json2csv');

const fileReader = require('./../src/fileReader');

const providedFilePath = process.argv[2] || '';
const csvFields = [
    // 'name',
    'path',
    'lines',
    'classes[0].name',
    'classes[0].functions.length',
];

const parseFilePath = (filePath, callback) => {

    fs.stat(filePath, (err, stat) => {

        if (stat.isFile()) {
            fileReader.parsePhpFile(filePath, filePath, filePath, callback);

        } else if (stat.isDirectory()) {

            fileSystem.recurse(filePath, ['*.php.txt', '**/*.php', '!vendor/*', '!vendor/**/*'], (filePath, relative, fileName) => {
                fileReader.parsePhpFile(filePath, fileName, relative, callback);
            });

        } else {
            throw new Error('Unknown path: ' + filePath);
        }

    });

};

// script

try {

    let rows = [];

    parseFilePath(providedFilePath, (err, data) => {
        rows.push(data);

        if (rows.length % 100 === 0) {
            console.info('Files processed: ' + rows.length)
        }
    });


    process.on('exit', () => {
        let csv = json2csv({ data: rows, fields: csvFields });
        fs.writeFileSync('output.csv', csv);
    })


} catch (err) {
    console.error(err);
}
