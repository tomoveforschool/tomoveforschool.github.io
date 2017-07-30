var API_KEY = 'AIzaSyBuz1_iq_dPx5FUAzfWQ9VbGtAU_V-ngJE';

var map;
var jsonData;
var markers = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -28, lng: 153.35 },
        zoom: 12
    });

    $.ajax({
        type: "GET",
        url: 'data.json', //path to file   https://github.com/processing/p5.js/wiki/Loading-external-files:-AJAX,-XML,-JSON
        dataType: "json", //type of file (txt, json, xml, etc)
        success: function(data) {
            jsonData = data;
            var firstLoad = true
            createMarkers(jsonData, firstLoad);
            showMarkers();
        },
        error: function(xhr, ajaxOptions, thrownError) {
            alert("Status: " + xhr.status + "     Error: " + thrownError);
        }
    });
}

function closePopup() {
    document.getElementById('popup').style.zIndex = '-1';
    document.getElementById('popup').style.display = 'none';
}

function createMarkers(data, firstLoad) {
    var skipCount = 1;
    if (firstLoad  === true) {
        skipCount = 5;
    }

    markers = [];
    // for (var i = 0; i < data.length; i++) {
    for (var i = 0; i < data.length; i=i+skipCount) { // every 5th to speed up loading
        var marker = new google.maps.Marker({
            position: { lat: data[i].Y, lng: data[i].X },
            title: data[i].COMMONNAME,
            icon: getIconName(data[i].EPBCSTATUS)
        });
        marker.data = data[i];
        markers.push(marker);

        google.maps.event.addListener(marker, 'click', function(e) {
            queryStr = this.data.COMMONNAME
            createHTMLString(this.data);
            $.ajax({
                url: 'https://s3-ap-southeast-2.amazonaws.com/gc2018-website-data/tickets/venues.json',
                dataType: 'json',
                success: function(data) {
                    if (data.result.records.length > 0) {
                        document.getElementById('popupQLDData').innerHTML = '<div class="container" id="content">'+
                            '<p>Type: '+ data.result.records[0].PlantOrAnimalType +'<p>' +
                            '<p><a href="'+ data.result.records[0].Link +'">Species Information</a><p>'+
                            '</div>';
                    }
                }
            });
        });
    }
}

function createHTMLString(data) {

    var collection = '';
    if (data.COMMONNAME === 'Koala') {
        collection = '<a class="btn btn-primary" href="collection.html">Collection</a>'
    }

    var status = data.EPBCSTATUS ? data.EPBCSTATUS : 'Common';
    var str = '<div class="container" id="content"><div id="close" onclick="closePopup()">'+
        '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span></div>'+
        '<h1 id="firstHeading" class="firstHeading">' + data.COMMONNAME + '</h1>'+
        '<img class="image" src="images/'+ getAvatarImage(data) +'"></img>'+
        '<div id="bodyContent">'+
        '<p>Genus: '+data.GENUS+'</p>'+
        '<p>Species: '+data.SPECIES+'</p>'+
        '<p>Status: '+ status+'</p>'+
        '<p>Wikipedia: <a href="https://en.wikipedia.org/wiki/Special:Search?search='+ encodeURI(data.COMMONNAME) +'">More Info</a></p>'+
        collection +
        '</div>'+
        '</div>';
    var popup = document.getElementById('popup');
    var popupData = document.getElementById('popupData');
    popupData.innerHTML = str;
    popup.style.zIndex = '10';
    popup.style.display = 'block';

    return str;
}

function showMarkers() {
    // var items = 10;
    // for (var j = 0; j < items; j++) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
        }
        // TODO: to do better processing of data
    // }
}

function removeMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

function getIconName(string) {
    switch(string) {
        case 'Marine':
            return 'images/mapPinMarine.png'
            break;
        case 'Vulnerable':
            return 'images/mapPinVulnerable.png'
            break;
        case 'Endangered':
            return 'images/mapPinEndangered.png'
            break;
        case 'Critically Endangered':
            return 'images/mapPinCriticallyEndangered.png'
            break;
        default:
            return 'images/mapPinNormal.png'
        }
}

function getAvatarImage(data) {
    switch(data.COMMONNAME.toLowerCase()) {
        case 'koala':
            return 'koala.jpg'
            break;
        case 'spotted-tailed quoll':
            return 'spotted-tailed-quoll.jpg'
            break;
        default:
            return 'defaultAnimalAvatar.jpg'
        }
}

function query(string) {
    var string = string.toLowerCase();
    removeMarkers();
    var queryMarkers = [];
    for (var i = 0; i < jsonData.length; i++) {
        if (jsonData[i].COMMONNAME.toLowerCase().indexOf(string) !== -1) {
            queryMarkers.push(jsonData[i]);
        } else if (jsonData[i].GENUS.toLowerCase().indexOf(string) !== -1) {
            queryMarkers.push(jsonData[i]);
        } else if (jsonData[i].SPECIES.toLowerCase().indexOf(string) !== -1) {
            queryMarkers.push(jsonData[i]);
        }
    }
    createMarkers(queryMarkers);
    showMarkers();
}

document.getElementById('searchBtn').addEventListener('click', function() {
    var queryString = document.getElementById('search').value;
    query(queryString);
});

document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var queryString = document.getElementById('search').value;
    query(queryString);
    return false;
});


if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        var accuracy = position.coords.accuracy;
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        };

        map.setCenter(pos);

        var marker = new google.maps.Marker({
            position: pos,
            map: map,
            title: 'Your Location',
           // icon: //the dot icon
        });
        var circle = new google.maps.Circle({
            center: pos,
            radius: accuracy,
            map: map,
            fillColor: '#0000ff',
            fillOpacity: 0.3,
            strokeColor: '#0000ff',
            strokeOpacity: 0.9,
        });

        //set the zoom level to the circle's size
        map.fitBounds(circle.getBounds());
    });

} else {
    // Browser doesn't support Geolocation
    console.error('Error: The Geolocation service failed.');
}
