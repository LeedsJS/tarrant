'use strict';

const quizLoader = require('./quizLoader.js');
const webSocket = require(`ws`);
const express = require(`express`);
const http = require(`http`);
const url = require(`url`);
const moniker = require(`moniker`);
const cryptoRandomString = require(`crypto-random-string`);

const authKey = cryptoRandomString(30);

const state = {
    started: false,
    question: {},
    contestants: [],
    quizmasters: [],
    quiz: {}
};

module.exports = function quiz(filePath) {
   return quizLoader(filePath).then((quizObject) => {
        state.quiz = quizObject;

        const app = express();

        const server = http.createServer(app);
        const wss = new webSocket.Server({server});

        wss.on(`connection`, (ws, req) => {
            const path = url.parse(req.url).pathname;

            ws.send(`{"type": "title", "title": "${state.quiz.title}"}`);

            if (path === '/quizmaster/') {
                handleQuizmasterConnection(ws);
                return;
            }

            handleContestantConnection(ws);
        });

        app.use(express.static(`${__dirname}/../public`));

        server.listen(3000, function () {
            console.log(`Server started on port 3000. Quizmaster auth key: ${authKey}`);
        })

    }).catch((error) => {
        console.error(error);
    });
}

function handleQuizmasterConnection(ws) {
    const quizmaster = {
        socket: ws,
        authed: false
    };

    state.quizmasters.push(quizmaster);

    ws.send(`{"type": "command", "command":"auth"}`);

    ws.on(`message`, handleQuizmasterMessage.bind(quizmaster))
}

function handleContestantConnection(ws) {
    const contestant = {
        name: moniker.choose(),
        score: 0,
        socket: ws
    };

    state.contestants.push(contestant);

    ws.send(`{"type": "message", "message": "${contestant.name}"}`);

    ws.on(`message`, handleContestantMessage.bind(contestant));
}

function handleQuizmasterMessage(message) {
    try {
        message = JSON.parse(message);
    } catch (error) {
        this.socket.send(`{"type": "message", "message": "invalid-message-from-client"}`);
        return;
    }

    if (message.type === `auth` && message.key === authKey) {
        this.authed = true;
        this.socket.send(`{"type": "message", "message": "auth-confirmed"}`);
        return;
    }

    if (this.authed === true) {
        if (message.type === `command` && message.command === `next-question`) {
            nextQuestion();
            return;
        }
    }

    this.socket.send(`{"type": "message", "message": "unauthorized"}`);
    this.socket.terminate();

    state.quizmasters.splice(state.quizmasters.indexOf(this), 1);
}

function handleContestantMessage(message) {
    try {
        message = JSON.parse(message);
    } catch (error) {
        this.socket.send(`{"type": "message", "message": "invalid-message-from-client"}`);
        return;
    }

    if (
        message.type === `answer` &&
        message.question === state.question.number &&
        message.answer === state.question.answer
    ) {
        this.score++;
        return;
    }
}

function nextQuestion() {
    let correctAnswer;
    const questionNumber = (state.question.number + 1) || 0;
    const questionObj = Object.assign({}, state.quiz.questions[questionNumber]);
    const questionTime = questionObj.time || state.quiz.time || 30;

    questionObj.time = questionTime;
    questionObj.number = questionNumber;

    questionObj.answers = questionObj.answers.map((item, index) => {
        if (typeof item === `object`) {
            if (item.correct === true) {
                correctAnswer = index;
            }
            return item.text;
        }

        return item;
    });

    const questionJSON = JSON.stringify({
        type: `question`,
        question: questionObj
    });

    const sockets = getAllSockets();

    sockets.forEach((socket) => {
        if (socket.readyState === webSocket.OPEN) {
            socket.send(questionJSON);
        }
    });

    state.question.number = questionNumber;
    state.question.answer = correctAnswer;

    setTimeout(() => {
        const answerJSON = JSON.stringify({
            type: `answer`,
            answer: correctAnswer,
            question: questionNumber,
            nextQuestion: questionNumber < (state.quiz.questions.length - 1)
        });

        sockets.forEach((socket) => {
            if (socket.readyState === webSocket.OPEN) {
                socket.send(answerJSON);
            }
        });

        sendScoreboard();
    }, questionTime * 1000);
}

function getAllSockets() {
    return [...state.contestants, ...state.quizmasters].map((item) => {
        return item.socket;
    });
}

function sendScoreboard() {
    const scores = state.contestants.map((contestant) => {
        return {
            name: contestant.name,
            score: contestant.score
        };
    }).sort((a, b) => {
        return b.score - a.score;
    });

    const scoreboard = JSON.stringify({
        type: `scoreboard`,
        scoreboard: scores
    });

    getAllSockets().forEach((socket) => {
        if (socket.readyState === webSocket.OPEN) {
            socket.send(scoreboard);
        }
    });
}