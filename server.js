var http = require('http');
var qs = require('querystring');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');

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

var connectionState = {
    router: {
    },
    lobby: {
    }
};
var connectionTimeouts = {};

startHTTPServer();

function startHTTPServer() {
    http.createServer(function (req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Request-Method', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        handleRequest(req, res);
    }).listen(process.env.PORT || port);
}

function handleRequest(req, res) {
    if (req.url === "/") {
        if (req.method === "POST") {
            var queryData = "";
            req.on('data', function (data) {
                queryData += data;
                if (queryData.length > 1e6) {
                    queryData = "";
                    res.writeHead(413, { 'Content-Type': 'text/plain' });
                    res.end();
                    req.connection.destroy();
                }
            });
            req.on('end', function () {
                var post = qs.parse(queryData);
                if (validatePost(post)) {
                    post.servername = post.servername.toLowerCase();
                    post.connectionname = post.connectionname.toLowerCase();
                    storeLatencyTest(post);
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end();
            })
        }
        else {
            serveApp(req, res);
        }
    }
    else if (req.url === "/connectionState") {
        if (req.method === "POST") {
            var queryData = "";
            req.on('data', function (data) {
                queryData += data;
                if (queryData.length > 1e6) {
                    queryData = "";
                    res.writeHead(413, { 'Content-Type': 'text/plain' });
                    res.end();
                    req.connection.destroy();
                }
            });
            req.on('end', function () {
                var post = qs.parse(queryData);
                if (validateConnectionPost(post)) {
                    post.servername = post.servername.toLowerCase();
                    post.connectionname = post.connectionname.toLowerCase();
                    storeConnectionStateTest(post);
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end();
            })
        }

    }
    else {
        switch (req.url) {
            case "/lobbyReport":
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    history: history.lobby,
                    connectionstate: connectionState.lobby
                }));
                break;
            case "/routerReport":
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    history: history.router,
                    connectionstate: connectionState.router
                }));
                break;
            default:
                serveApp(req, res);
                break;
        }
    }
}

function validatePost(post) {
    var nonInts = new RegExp(/[^0-9]/g);
    if (
        post.servername && typeof post.servername === "string"
        && post.connectionname && typeof post.connectionname === "string"
        && post.latency && typeof post.latency === "string" && !nonInts.test(post.latency)
    ) {
        console.log(post.servername);
        return true;

    }
    return false;
}

function validateConnectionPost(post) {
    var nonInts = new RegExp(/[^0-9]/g);
    if (
        post.servername && typeof post.servername === "string"
        && post.connectionname && typeof post.connectionname === "string"
        && post.connectionstate && typeof post.connectionstate === "string" && (post.connectionstate === "true" || post.connectionstate === "false")
    ) {
        console.log(post.servername);
        return true;

    }
    return false;
}

function storeLatencyTest(post) {
    var timestamp = new Date().toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg" });
    post["timestamp"] = timestamp.split(":").splice(0, 2).join(":");
    // var post = {
    //     servername: (Math.floor(Math.random() * 2) === 0) ? "uk" : "usa",
    //     connectionname: (Math.floor(Math.random() * 2) === 0) ? "router" : "lobby",
    //     latency: Math.floor(Math.random() * 500),
    //     timestamp: hours + ":" + minutes
    // };
    updatehistory(post);
}

function storeConnectionStateTest(post) {
    // var post = {
    //     servername: (Math.floor(Math.random() * 2) === 0) ? "uk" : "usa",
    //     connectionname: (Math.floor(Math.random() * 2) === 0) ? "router" : "lobby",
    //     connectionstate: (Math.floor(Math.random() * 2) === 0) ? "true" : "false"
    // };
    updateConnectionState(post);
}

function updateConnectionState(post) {
    connectionState[post.connectionname][post.servername] = post.connectionstate;
    if (connectionTimeouts[post.connectionname][post.servername]) {
        clearTimeout(connectionTimeouts[post.connectionname][post.servername]);
    }
    if (post.connectionstate === "true") {
        connectionTimeouts[post.connectionname][post.servername] = setTimeout(function () {
            connectionState[post.connectionname][post.servername] = "false";
        }, 120000)
    }
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
                for (var i = 1; i < history[body.connectionname][0].length; i++) {
                    if (i === ix) {
                        entry.push(body.latency);
                    }
                    else {
                        entry.push(0);
                    }
                }
                // entry.push(body.latency);
                history[body.connectionname].push(entry);
            }
        }
    }
}

function serveApp(req, res) {
    if (req.url === "/") {
        req.url = "index.htm";
    }
    var serve = serveStatic("./app");
    var done = finalhandler(req, res);
    serve(req, res, done);
}
