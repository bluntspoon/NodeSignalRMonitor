var lobby_chart, router_chart;

var baseURL = "http://clientdash.azurewebsites.net";

$(document).ready(function () {
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(setupCharts);
});

function setupCharts() {
    lobby_chart = new google.visualization.LineChart(document.getElementById('lobby_chart'));
    router_chart = new google.visualization.LineChart(document.getElementById('router_chart'));
    fetchRouterData();
    fetchLobbyData();
}

function fetchRouterData() {
    $.getJSON(baseURL + "/routerReport", updateRouterStatus);
}

function fetchLobbyData() {
    $.getJSON(baseURL + "/lobbyReport", updateLobbyStatus);
}

function updateRouterStatus(data) {
    data.history = mangleData(data);
    if (data.history) {
        var chartData = google.visualization.arrayToDataTable(data.history);
    }
    var options = {
        title: 'Latency',
        curveType: 'function',
        legend: { position: 'bottom' }
    };
    router_chart.draw(chartData, options);
    setTimeout(fetchRouterData, 60000);
}

function updateLobbyStatus(data) {
    data.history = mangleData(data);
    if (data.history) {
        var chartData = google.visualization.arrayToDataTable(data.history);
    }
    var options = {
        title: 'Latency',
        curveType: 'function',
        legend: { position: 'bottom' }
    };
    lobby_chart.draw(chartData, options);
    setTimeout(fetchLobbyData, 60000);
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