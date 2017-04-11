var http = require('http');
var qs = require('querystring');

var maxHistory = 60;

var history = {
    router: [
        []
    ]
};

http.createServer(function (req, res) {
    handleRequest(req, res);
}).listen(process.env.PORT || 8080);

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
        })
    }
    else {
        showDashboard(req, res);
    }
}

function storeLatencyTest(post) {
    var date = new Date().format("hh:mm");
    var body =
        {
            servername: "something",
            connectionname: "router",
            latency: 100,
            timestamp: date
        };
    updatehistory(body);
    console.log(history);
}

function updatehistory(body) {
    if (history[body.connectionname][0].indexOf(body.servername) === -1) {
        // new server entry
        history[body.connectionname][0].push(body.servername);
        var hasTimeStamp = false;
        history[body.connectionname].forEach(function (i) {
            if (i > 0 && history[body.connectionname][i][0] !== body.timestamp) {
                history[body.connectionname][i].push("0");
            }
            else if (history[body.connectionname][i][0] === body.timestamp) {
                hasTimeStamp = true;
                history[body.connectionname][i].push(body.latency);
            }
        });
        if (!hasTimeStamp) {
            // new timestamp entry
            var entry = [body.timestamp];
            for (var i = 1; i < history[body.connectionname][0].length; i++) {
                entry.push(0);
            }
            entry.push(body.latency);
            history[body.connectionname].push(entry);
        }
    }
    else {
        // existing server entry

    }
}

function showDashboard(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Hello from Poker Node Server... :)');
}