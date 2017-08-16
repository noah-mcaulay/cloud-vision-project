'use strict';

var apiKey = "AIzaSyAC4pDcXBTc8VmVRdtOfppmLBFtFm-t7xw";

var CLOUD_VISION_URL = "https://vision.googleapis.com/v1/images:annotate?key=" + apiKey;

var chart = null;

var fileInputElement = $('.fileinput');

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

function handleFile(event) {

    var image = event.target.result;

    image = image.replace("data:image/jpeg;base64,", ""); // remove jpeg header (if it exists)
    image = image.replace("data:image/png;base64,", "");  // remove png header (if it exists)
    queryCloudVisionApi(image);
}

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

function processResponse(response) {
    console.log(response);
    var labels = response["responses"][0]["labelAnnotations"];
    generateChart(labels);
}

function generateChart(labels) {
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

    // set global font size
    //Chart.defaults.global.defaultFontSize = 20;
    Chart.Tooltip.positioners.cursor = function(chartElements, coordinates) {
        return coordinates;
    };

    var ctx = document.getElementById("chart").getContext("2d");
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