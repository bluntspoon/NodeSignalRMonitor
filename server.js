var http = require('http');
var qs = require('querystring');

var maxHistory = 60;
var port = 8089;

var history = {
    router: [
        ["Item"]
    ],
    lobby: [
        ["Item"]
    ]
};

startHTTPServer();

function startHTTPServer() {
    http.createServer(function (req, res) {
        handleRequest(req, res);
    }).listen(process.env.PORT || port);
}

function handleRequest(req, res) {
    if (req.method === "POST") {
        var body = "";
        req.on('data', function (data) {
            body += data;
            if (body.length > 1e6) {
                req.connection.destroy();
            }
        });
        req.on('end', function () {
            var post = qs.parse(body);
            storeLatencyTest(post);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end();
        })
    }
    else {
        switch (req.url) {
            case "/lobbyReport":
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(history.lobby));
                break;
            case "/routerReport":
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(history.lobby));
                break;
            default:
                showDashboard(req, res);
        }
    }
}

function storeLatencyTest(post) {
    var hours = new Date().getHours();
    var minutes = new Date().getMinutes();
    hours = (hours < 10) ? "0" + hours.toString() : hours.toString();
    minutes = (minutes < 10) ? "0" + minutes.toString() : minutes.toString();
    var body = {
        servername: (Math.floor(Math.random() * 2) === 0) ? "uk" : "usa",
        connectionname: (Math.floor(Math.random() * 2) === 0) ? "router" : "lobby",
        latency: Math.floor(Math.random() * 500),
        timestamp: hours + ":" + minutes
    };
    console.log(body);
    updatehistory(body);
    console.log(history);
}

function updatehistory(body) {
    if (body.connectionname && body.servername && body.latency && body.timestamp) {
        var hasTimeStamp = false;
        if (history[body.connectionname][0].indexOf(body.servername) === -1) {
            // new server entry
            history[body.connectionname][0].push(body.servername);
            for (var i = 0; i < history[body.connectionname].length; i++) {
                if (i > 0 && history[body.connectionname][i][0] !== body.timestamp) {
                    history[body.connectionname][i].push("0");
                }
                else if (history[body.connectionname][i][0] === body.timestamp) {
                    hasTimeStamp = true;
                    history[body.connectionname][i].push(body.latency);
                }
            }
            if (!hasTimeStamp) {
                // new timestamp entry
                var entry = [body.timestamp];
                for (var i = 1; i < history[body.connectionname][0].length - 1; i++) {
                    entry.push(0);
                }
                entry.push(body.latency);
                history[body.connectionname].push(entry);
            }
        }
        else {
            // existing server entry
            var ix = history[body.connectionname][0].indexOf(body.servername);
            for (var i = 0; i < history[body.connectionname].length; i++) {
                if (history[body.connectionname][i][0] === body.timestamp) {
                    hasTimeStamp = true;
                    history[body.connectionname][i][ix] = body.latency;
                }
            }
            if (!hasTimeStamp) {
                // new timestamp entry
                var entry = [body.timestamp];
                for (var i = 1; i < history[body.connectionname][0].length - 1; i++) {
                    entry.push(0);
                }
                entry.push(body.latency);
                history[body.connectionname].push(entry);
            }
        }
    }
}

function showDashboard(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Hello from Poker Node Server... :)');
}