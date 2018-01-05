var lobby_chart, router_chart;
var chart_options = {
    title: 'Latency',
    // curveType: 'function',
    legend: { position: 'bottom' },
    vAxis: {
        baseline: 300,
        baselineColor: "red"
        // scaleType: "mirrorLog"
    },
    explorer: {}
};

$(document).ready(() => {
    loadScript("scripts/options.js", continueLoading);
});

function continueLoading() {
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(setupCharts);
    fetchAutomationData();
}


function loadScript(url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = callback;
    script.onload = callback;
    head.appendChild(script);
}

function setupCharts() {
    lobby_chart = new google.visualization.LineChart(document.getElementById('lobby_chart'));
    router_chart = new google.visualization.LineChart(document.getElementById('router_chart'));
    special_chart = new google.visualization.LineChart(document.getElementById('special_chart'));
    fetchRouterData();
    fetchLobbyData();
    fetchSpecialData();
}

function fetchRouterData() {
    $.getJSON(baseURL + "/routerReport", updateRouterStatus).fail(function () {
        setTimeout(fetchRouterData, 60000);
    });
}

function fetchLobbyData() {
    $.getJSON(baseURL + "/lobbyReport", updateLobbyStatus).fail(function () {
        setTimeout(fetchLobbyData, 60000);
    });
}

function fetchSpecialData() {
    $.getJSON(baseURL + "/specialReport", updateSpecialStatus).fail(function () {
        setTimeout(fetchSpecialData, 60000);
    });
}

function updateRouterStatus(data) {
    data.history = mangleData(data);
    if (data.history) {
        var chartData = google.visualization.arrayToDataTable(data.history, false);
        chart_options["hAxis"] = { "showTextEvery": Math.ceil(data.history.length / maxLabels) };
    }
    router_chart.draw(chartData, chart_options);
    setTimeout(fetchRouterData, standardDataInterval * 1000);
}

function updateLobbyStatus(data) {
    data.history = mangleData(data);
    if (data.history) {
        var chartData = google.visualization.arrayToDataTable(data.history);
        chart_options["hAxis"] = { "showTextEvery": Math.ceil(data.history.length / maxLabels) };
    }
    lobby_chart.draw(chartData, chart_options);
    setTimeout(fetchLobbyData, standardDataInterval * 1000);
}

function updateSpecialStatus(data) {
    var special_options = {
        title: 'Percentage',
        legend: { position: 'bottom' },
        explorer: {}
    };
    if (data.history) {
        var newHistory = [
            data.history[0]
        ];
        var start = data.history.length > 51 ? data.history.length - 50 : 0;
        for (var i = start; i < data.history.length; i++) {
            var item = [
                data.history[i][0]
            ];
            for (var j = 1; j < data.history[i].length; j++) {
                item.push(Number(data.history[i][j]));
            }
            if (item.length === newHistory[0].length) {
                newHistory.push(item);
            }
        }
        var chartData = google.visualization.arrayToDataTable(newHistory);
        special_options["hAxis"] = { "showTextEvery": Math.ceil(newHistory.length / maxLabels) };
    }
    special_chart.draw(chartData, special_options);
    setTimeout(fetchSpecialData, specialDataInterval * 1000);
}

function mangleData(data) {
    var newArr = [];
    newArr.push(data.history[0]);
    for (var i = 1; i < data.history.length; i++) {
        var tmpArr = [];
        tmpArr.push(data.history[i][0]);
        for (var j = 1; j < data.history[i].length; j++) {
            tmpArr.push(Number(data.history[i][j]));
        }
        newArr.push(tmpArr);
    }
    return newArr;
}

function updateAutomationData(data, name) {
    if (data && data.Environments) {
        var rowData = data.Environments[0];
        var div = document.getElementById(name + "Row");
        var span = div.children[0].children[0];
        var datespan = div.children[0].children[2];
        var newdata = name + ": " + rowData.Passed + "/" + rowData.Total;
        span.innerText = newdata;
        datespan.innerText = rowData.DateCompleted;
        setRowColor(rowData.Passed, rowData.Total, div);
    }
}

function setRowColor(pass, total, div) {
    console.log(pass / total);
    if (pass === total){
        div.classList.remove("orange");
        div.classList.remove("red");
        div.classList.add("green");
    }
    else if (pass / total <= 0.9) {
        div.classList.remove("orange");
        div.classList.remove("green");
        div.classList.add("red");
    }
    else if (pass / total > 0.9 && pass / total !== 0.9) {
        div.classList.remove("red");
        div.classList.remove("green");
        div.classList.add("orange");
    }
}

function doCheck(name, url) {
    $.ajax({
        url: url,
        type: "GET",
        headers: autoHeaders,
        crossDomain: true
    }).done((data) => {
        try {
            updateAutomationData(data, name);
        }
        catch (e) {
            // do nothing
        }
    })
        .always(() => {
            console.log(name, url);
            queueCheck(name, url);
        });
}

function queueCheck(name, url) {
    setTimeout(() => {
        doCheck(name, url);
    }, automationIntervalSeconds * 1000);
}

function fetchAutomationData() {
    for (var i = 0; i < autoPerms.length; i++) {
        var name = autoPerms[i].name
        var url = autoPerms[i].url
        doCheck(name, url);
    }
}