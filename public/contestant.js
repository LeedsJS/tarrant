var currentQuestion = 0;
var buttons = [
    'answer-0',
    'answer-1',
    'answer-2',
    'answer-3'
];
var ws = new WebSocket(window.location.href.replace(/^http/, 'ws'));

ws.onmessage = handleWebSocketMessage;

buttons.forEach(function(button, index) {
    document.getElementById(button).addEventListener('click', function() {
        var answerMessage = {
            type: 'answer',
            answer: index,
            question: currentQuestion
        };

        ws.send(JSON.stringify(answerMessage));

        document.getElementById(button).style.border = '3px solid black';

        disableAnswers();
    });
});

function handleWebSocketMessage(event) {
    try {
        var message = JSON.parse(event.data);
    } catch (error) {
        console.error('Invalid message recieved from server');
        return;
    }

    if (message.type === 'title') {
        document.getElementById('quiz-title').innerText = message.title;
        return;
    }

    if (message.type === 'name') {
        document.getElementById('contestant-name').innerText += ' ' + message.name;
        return;
    }

    if (message.type === 'question') {
        currentQuestion = message.question.number;
        document.getElementById('scoreboard-container').removeAttribute('style');
        document.getElementById('waiting').style.display = 'none';
        document.getElementById('question').style.display = 'block';
        document.getElementById('question__text').innerText = 'Question ' + message.question.number + ': ' + message.question.text;

        message.question.answers.forEach(function(item, index) {
            var element = document.getElementById('answer-' + index)
            element.removeAttribute('style');
            element.innerText = item;
        });

        enableAnswers();

        return;
    }

    if (message.type === 'answer' && message.question === currentQuestion) {
        document.getElementById('answer-' + message.answer).style.backgroundColor = 'limegreen';
        document.getElementById('answer-' + message.answer).style.color = 'black';
        return;
    }

    if (message.type === 'scoreboard') {
        renderScoreboard(message.scoreboard);
        return
    }
}

function disableAnswers() {
    buttons.forEach(function(button) {
        document.getElementById(button).disabled = true;
    })
}

function enableAnswers() {
    buttons.forEach(function(button) {
        document.getElementById(button).disabled = false;
    })
}

function renderScoreboard(scoreboardData) {
    var tbody = document.getElementById('scoreboard').tBodies[0];

    tbody.innerHTML = '';

    scoreboardData.forEach((item) => {
        tbody.innerHTML += '<tr><td>'+ item.name + '</td><td>' + item.score + '</td></tr>';
    })
    document.getElementById('scoreboard-container').style.display = 'block';
}