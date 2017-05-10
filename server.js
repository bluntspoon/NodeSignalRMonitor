var http = require('http');
var qs = require('querystring');
var fs = require("fs");
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');
var request = require('request');

var maxHistory = 60;
var maxSpecialHistory = 60;
var port = 8089;

if (checkExists("history.json")) {
    var ourHistory = JSON.parse(fs.readFileSync("history.json"));
}
else {
    var ourHistory = {
        "router": [
            [
                "Item"
            ]
        ],
        "lobby": [
            [
                "Item"
            ]
        ]
    };
}

if (checkExists("specialHistory.json")) {
    var specialHistory = JSON.parse(fs.readFileSync("specialHistory.json"));
}
else {
    var specialHistory = [
        [
            "Item"
        ]
    ];
}

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
                    // post.servername = post.servername.toLowerCase();
                    post.connectionname = post.connectionname.toLowerCase();
                    storeLatencyTest(post);
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end();
            });
        }
        else {
            serveApp(req, res);
        }
    }
    else if (req.url === "/specialHistory") {
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
                storeSpecialHistory(post);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end();
            });
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
                    history: ourHistory.lobby,
                    connectionstate: connectionState.lobby
                }));
                break;
            case "/routerReport":
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    history: ourHistory.router,
                    connectionstate: connectionState.router
                }));
                break;
            case "/specialReport":
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    history: specialHistory
                }));
                break;
            case "/resetHistory":
                resetHistory();
                res.writeHead(307, {
                    'Location': '/'
                });
                res.end("Done.");
                break;
            case "/resetSpecialHistory":
                resetSpecialHistory();
                res.writeHead(307, {
                    'Location': '/'
                });
                res.end("Done.");
                break;
            default:
                serveApp(req, res);
                break;
        }
    }
}

function validatePost(post) {
    var nonInts = new RegExp(/[^0-9]./g);
    if (
        post.servername && typeof post.servername === "string"
        && post.connectionname && typeof post.connectionname === "string"
        && post.latency && typeof post.latency === "string" //&& !nonInts.test(post.latency)
    ) {
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
        return true;

    }
    return false;
}

function storeLatencyTest(post) {
    var timestamp = new Date().toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg", hour12: false });
    post["timestamp"] = timestamp.split(":").splice(0, 2).join(":");
    // var post = {
    //     servername: (Math.floor(Math.random() * 2) === 0) ? "uk" : "usa",
    //     connectionname: (Math.floor(Math.random() * 2) === 0) ? "router" : "lobby",
    //     latency: Math.floor(Math.random() * 500),
    //     timestamp: hours + ":" + minutes
    // };
    updateHistory(post);
}

function storeSpecialHistory(post) {
    // var post = {
    //     id: "string",    
    //     Lobby: 100
    // };
    updateSpecialHistory(post);
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
}

function updateHistory(body) {
    if (body.connectionname && body.servername && body.latency && body.timestamp) {
        var hasTimeStamp = false;
        if (ourHistory[body.connectionname][0].indexOf(body.servername) === -1) {
            // new server entry
            ourHistory[body.connectionname][0].push(body.servername);
            for (var i = 0; i < ourHistory[body.connectionname].length; i++) {
                if (i > 0 && ourHistory[body.connectionname][i][0] !== body.timestamp) {
                    ourHistory[body.connectionname][i].push("0");
                }
                else if (ourHistory[body.connectionname][i][0] === body.timestamp) {
                    hasTimeStamp = true;
                    ourHistory[body.connectionname][i].push(body.latency);
                }
            }
            if (!hasTimeStamp) {
                // new timestamp entry
                var entry = [body.timestamp];
                for (var i = 1; i < ourHistory[body.connectionname][0].length - 1; i++) {
                    entry.push(0);
                }
                entry.push(body.latency);
                ourHistory[body.connectionname].push(entry);
            }
        }
        else {
            // existing server entry
            var ix = ourHistory[body.connectionname][0].indexOf(body.servername);
            for (var i = 0; i < ourHistory[body.connectionname].length; i++) {
                if (ourHistory[body.connectionname][i][0] === body.timestamp) {
                    hasTimeStamp = true;
                    ourHistory[body.connectionname][i][ix] = body.latency;
                }
            }
            if (!hasTimeStamp) {
                // new timestamp entry
                var entry = [body.timestamp];
                for (var i = 1; i < ourHistory[body.connectionname][0].length; i++) {
                    if (i === ix) {
                        entry.push(body.latency);
                    }
                    else {
                        entry.push(0);
                    }
                }
                // entry.push(body.latency);
                ourHistory[body.connectionname].push(entry);
            }
        }
    }
    cleanupHistory();
    fs.writeFileSync("history.json", JSON.stringify(ourHistory, null, 2));
}

function updateSpecialHistory(body) {
    if (body.id) {
        var hasID = false;
        for (var i = 1; i < specialHistory.length; i++) {
            if (specialHistory[i][0] === body.id) {
                hasID = true;
            }
        }
        var newEntry = [];
        for (var entry in body) {
            if (entry !== "id" && specialHistory[0].indexOf(entry) === -1) {
                specialHistory[0].push(entry);
            }
            newEntry.push(body[entry]);
        }
        if (!hasID) {
            specialHistory.push(newEntry);
        }
    }
    //compare to previous number
    if (specialHistory.length > 2) {
        var names = specialHistory[0];
        var current = specialHistory[specialHistory.length - 1];
        var previous = specialHistory[specialHistory.length - 2];

        for (var i = 1; i < names.length; i++) {
            if (current[i] < previous[i]) {
                request.post(
                    'https://mm.derivco.co.uk/hooks/gtch6u3bjina8g9y5hn115ikge',
                    { json: { text: names[i] + " coverage dropped from " + previous[i] + " to " + current[i] + " in build " + current[0] } },
                    function (error, response, body) {
                    }
                );
            }
        }
    }
    cleanupSpecialHistory();
    fs.writeFileSync("specialHistory.json", JSON.stringify(specialHistory, null, 2));
}

function cleanupHistory() {
    if (ourHistory.router.length > maxHistory + 1) {
        var numToRemove = ourHistory.router.length - (maxHistory + 1);
        ourHistory.router.splice(1, numToRemove);
    }
    if (ourHistory.lobby.length > maxHistory + 1) {
        var numToRemove = ourHistory.lobby.length - (maxHistory + 1);
        ourHistory.lobby.splice(1, numToRemove);
    }
}

function cleanupSpecialHistory() {
    if (specialHistory.length > maxSpecialHistory + 1) {
        var numToRemove = specialHistory.length - (maxSpecialHistory + 1);
        specialHistory.splice(1, numToRemove);
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

function checkExists(path) {
    try {
        stats = fs.lstatSync(path);
        if (stats.isFile()) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (e) {
        return false;
    }
}

function resetHistory() {
    ourHistory = {
        "router": [
            [
                "Item"
            ]
        ],
        "lobby": [
            [
                "Item"
            ]
        ]
    };
    fs.writeFileSync("history.json", JSON.stringify(ourHistory, null, 2));
}

function resetSpecialHistory() {
    specialHistory = [
        [
            "Item"
        ]
    ];
    fs.writeFileSync("specialHistory.json", JSON.stringify(specialHistory, null, 2));
}

function debugPost(post) {
    try {
        request.post(
            "https://mm.derivco.co.uk/hooks/e1ca9h5xufy93xf7yqwmts9f4y",
            { json: { text: JSON.stringify(post) } },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body)
                }
            }
        );
    }
    catch (e) {

    }
}