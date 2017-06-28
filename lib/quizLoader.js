'use strict';

const bluebird = require(`bluebird`);
const fs = bluebird.promisifyAll(require(`fs`));

module.exports = function quizLoader(filePath) {
     return fs.readFileAsync(filePath, `utf8`).error((error) => {
        return bluebird.reject(`Error when reading file '${filePath}'. Error given: ${error}`)
    }).then((file) => {
        return JSON.parse(file);
    }).error((error) => {
        return bluebird.reject(`Error when parsing file '${filePath}'. Error given: ${error}`);
    })
}