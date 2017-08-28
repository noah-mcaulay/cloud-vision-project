'use strict';

var CLOUD_VISION_URL = "https://vision.googleapis.com/v1/images:annotate?key=" + API_KEY;

var chart = null;

var fileInputElement = $('.fileinput');

// on page load generate the two pie charts from our data
$(function() {
   generatePieChart("labelPieChart", "orderedLabels.json");
   generatePieChart("breedPieChart", "orderedBreeds.json");
});

// get the file and process it if a new image is inputted
fileInputElement.on('change.bs.fileinput', function() {

    // get file, convert to base64, and pass to the handleFile function when done
    var file = $("#fileUpload").prop("files")[0];
    var fileReader = new FileReader();
    fileReader.onloadend = handleFile;
    fileReader.readAsDataURL(file);

});

// remove the bar chart if the user removes their image
fileInputElement.on('clear.bs.fileinput', function() {

    // delete chart if it exists
    if (chart !== null) {
        chart.destroy();
    }

});

// remove the image header from the base64 and pass the data to the cloud vision api handler
function handleFile(event) {

    var image = event.target.result;

    image = image.replace("data:image/jpeg;base64,", ""); // remove jpeg header (if it exists)
    image = image.replace("data:image/png;base64,", "");  // remove png header (if it exists)
    queryCloudVisionApi(image);
}

// query the cloud vision api and get the response
function queryCloudVisionApi(image) {

    var req = {
        requests: [{
            image: {
                content: image
            },
            features: [{
                type: "LABEL_DETECTION",
                maxResults: 100
            }]
        }]
    };

    $.post({
        url: CLOUD_VISION_URL,
        data: JSON.stringify(req),
        contentType: 'application/json'
    }).fail(function() {
        console.log("fail....");
    }).done(processResponse);
}

// parse the labels from the response
function processResponse(response) {
    var labels = response["responses"][0]["labelAnnotations"];
    generateBarChart(labels);
}

// generate a bar chart of the labels we received
function generateBarChart(labels) {
    console.log(labels);
    labels.forEach(function(label) {
        console.log(label["description"] + ": " + label["score"]);
    });

    // get label descriptions and scores (just the first 10)
    var descriptions = [];
    var scores = [];
    labels.slice(0, 10).forEach(function(label) {
        descriptions.push(label["description"]);
        scores.push((label["score"] * 100).toFixed(2));
    });

    // delete old chart if it exists
    if (chart !== null) {
        chart.destroy();
    }

    Chart.Tooltip.positioners.cursor = function(chartElements, coordinates) {
        return coordinates;
    };

    var ctx = document.getElementById("barChart").getContext("2d");
    chart = new Chart(ctx, {
        // The type of chart we want to create
        type: "horizontalBar",

        // The data for our dataset
        data: {
            labels: descriptions,
            datasets: [{
                backgroundColor: "#3A88C4",
                borderColor: "#3A88C4",
                data: scores
            }]
        },

        // Configuration options go here
        options: {
            legend: {
              display: false
            },
            tooltips: {
                position: 'cursor'
            },
            scales: {
                xAxes: [{
                    ticks: {
                        max: 100,
                        min: 0,
                        callback: function(value) {
                            return value + "%";
                        }
                    }
                }]

            }
        }
    });
}

// generate a pie chart at the targetID element based on the data within the specified file
function generatePieChart(targetID, filename) {
    var labels = [];
    var counts = [];

    var colors = ["#3366CC", "#DC3912", "#FF9900", "#109618", "#990099", "#3B3EAC", "#0099C6", "#DD4477", "#66AA00", "#B82E2E"];

    var pieData = [];

    // get data from file
    $.get("data/" + filename, function(data) {
        data.slice(0, 10).forEach(function(entry) {
           labels.push(entry[0]);
           counts.push(entry[1]);
        });

        for (var i = 0; i < 10; ++i) {
            pieData.push({
               value: counts[i],
               label: labels[i],
               color: colors[i]
            });
        }

        var pieChart = document.getElementById(targetID).getContext("2d");
        var myPieChart = new Chart(pieChart, {
            type: 'pie',
            data: {
                datasets: [{
                    data: counts,
                    backgroundColor: colors
                }],
                labels: labels
            }
        });
    });

}