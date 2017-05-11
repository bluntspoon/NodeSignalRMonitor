var lobby_chart, router_chart;
var baseURL = "http://clientdash.azurewebsites.net";
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
var maxLabels = 8;

$(document).ready(function () {
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(setupCharts);
});

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
    setTimeout(fetchRouterData, 60000);
}

function updateLobbyStatus(data) {
    data.history = mangleData(data);
    if (data.history) {
        var chartData = google.visualization.arrayToDataTable(data.history);
        chart_options["hAxis"] = { "showTextEvery": Math.ceil(data.history.length / maxLabels) };
    }
    lobby_chart.draw(chartData, chart_options);
    setTimeout(fetchLobbyData, 60000);
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
        for (var i = 1; i < data.history.length; i++) {
            var item = [
                data.history[i][0]
            ];
            for (var j = 1; j < data.history[i].length; j++) {
                item.push(Number(data.history[i][j]));
            }
            newHistory.push(item);
        }
        var chartData = google.visualization.arrayToDataTable(newHistory);
        special_options["hAxis"] = { "showTextEvery": Math.ceil(newHistory.length / maxLabels) };
    }
    special_chart.draw(chartData, special_options);
    setTimeout(fetchSpecialData, 300000);
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