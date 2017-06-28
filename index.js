'use strict';

const quiz = require(`./lib/quiz`);
const preview = require(`./lib/preview`);

const argv = require(`yargs`).argv;


if (argv.preview) {
    if (typeof argv.preview !== `string` || argv.preview.length === 0) {
        return console.error(`No file passed.`);
    }

    return preview(argv.preview);
}

if (argv._.length > 0) {
    quiz(argv._[0]);
}