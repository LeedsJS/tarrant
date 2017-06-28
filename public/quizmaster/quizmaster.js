var ws;
var currentQuestion = 0;

document.getElementById('quizmaster-auth__submit').addEventListener('click', function(event) {
    ws = new WebSocket(window.location.href.replace(/^http[s]?/, 'ws'));
    ws.onmessage = handleWebSocketMessage;
});

document.getElementById('quiz__next-question').addEventListener('click', function() {
    ws.send('{"type": "command", "command":"next-question"}');
})

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

    if (message.type === 'command' && message.command === 'auth') {
        ws.send(JSON.stringify({
            type: 'auth',
            key: document.getElementById('quizmaster-auth__key').value
        }));
        return;
    }

    if (message.type === 'message' && message.message === 'auth-confirmed') {
        document.getElementById('quizmaster-auth').style.display = 'none';
        return;
    }

    if (message.type === 'message' && message.message === 'unauthorized') {
        ws = undefined;
        return;
    }

    if (message.type === 'question') {
        document.getElementById('quiz__next-question').disabled = true;

        document.getElementById('question__text').innerText = 'Question ' + message.question.number + ': ' + message.question.text;

        message.question.answers.forEach(function(item, index) {
            var element = document.getElementById('answer-' + index)
            element.removeAttribute('style');
            element.innerText = item;
        });

        currentQuestion = message.question.number;
        return;
    }

    if (message.type === 'answer' && message.question === currentQuestion) {
        document.getElementById('answer-' + message.answer).style.backgroundColor = 'limegreen';
        if (message.nextQuestion) {
            document.getElementById('quiz__next-question').disabled = false;
        }
        return;
    }

    if (message.type === 'scoreboard') {
        renderScoreboard(message.scoreboard);
        return
    }
}

function renderScoreboard(scoreboard) {
    const tbody = document.getElementById('scoreboard').tBodies[0];

    scoreboard.forEach((item) => {
        tbody.innerHTML += '<tr><td>'+ item.name + '</td><td>' + item.score + '</td></tr>';
    })
}