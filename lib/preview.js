'use strict';

const quizLoader = require('./quizLoader.js');

module.exports = function preview(filePath) {

    return quizLoader(filePath).then((quizObject) => {
        console.log(quizObject.title);
        console.log(`Questions:`);
        quizObject.questions.forEach((questionItem, index) => {
            console.log(`    Question ${index + 1}: ${questionItem.text}`);
            console.log(`    Answers:`);
            questionItem.answers.forEach((answer, index) => {
                if (typeof answer === `object`) {
                    console.log(`        ${String.fromCharCode(97 + index)}. ${answer.text} ${answer.correct ? `✔` : ``}`);
                } else {
                    console.log(`        ${String.fromCharCode(97 + index)}. ${answer}`);
                }
            })
        })
    }).catch((error) => {
        console.error(error);
    });
}