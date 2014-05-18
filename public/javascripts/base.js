/**
 * Created with JetBrains WebStorm.
 * User: thomastheissier
 * Date: 26/01/2014
 * Time: 18:09
 * To change this template use File | Settings | File Templates.
 */

//heroku declaration of socket client !
/* var host = location.origin.replace(/^http/, 'wss');
 console.log(host);
 var ws = new WebSocket(host);   */

var map;
var markers = [];
var infoWindows = [];
var cptLabeled = 0;
function initialize() {
    var mapOptions = {
        zoom: 2,
        center: new google.maps.LatLng(10, 0)
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    socket.on('data', function(hits) {
        results = new SearchResults();
        clearMarkers();
        markers = [];
        infoWindows = [];
        $("#text-modal").empty();
        if (hits != '') {
            $('#modal-box').modal('hide');
            for (var index in hits) {
                var search = new Search();
                search.set('input',$("#keyword-search-input").val());
                var hit = new Object();
                console.log("hits[index]", hits[index]);
                hit.id = hits[index]._id;
                console.log("hit id : ", hit.id);
                hit.username = hits[index]._source.user.name;
                hit.created_at = hits[index]._source.created_at;
                hit.text = hits[index]._source.text;
                hit.lng = hits[index]._source.geo.coordinates[0];
                hit.lat = hits[index]._source.geo.coordinates[1];
                hit.score = -1;

                var idInfoWindow = 'contentInfoWindow' + hit['id'];
                var usernameAndTweet = "<div id=" + idInfoWindow + "><div class='tweets-matched'><h3>" + hit['username'] + "</h3><h5>"+ hit['created_at'] +"</h5><p>"+ hit['text'] +"</p></div>";
                var myLatlng = new google.maps.LatLng(hit['lng'], hit['lat']);
                var infoWindow = new google.maps.InfoWindow({
                    content: usernameAndTweet
                });
                infoWindows.push(infoWindow);
                var marker = new google.maps.Marker({
                    position: myLatlng,
                    map: map,
                    title: usernameAndTweet
                });
                markers.push(marker);
                google.maps.event.addListener(markers[index], 'click', function(innerKey) {
                    return function() {
                        infoWindows[innerKey].open(map, markers[innerKey]);
                    }
                }(index));

                $('#text-modal').append(usernameAndTweet);
                var idSelector = "#" + idInfoWindow;
                var idButtons = "id-button-" + index;
                $(idSelector).append("<div id=" + idButtons + " class='yes-or-no'><button type='button' class='button-yes btn btn-success'><span class='glyphicon glyphicon-ok-sign'></span> Yes!</button><br/><button type='button' class='button-no btn btn-danger'><span class='glyphicon glyphicon-remove-sign'></span> Nope!</button></div></div>");
                $(idSelector).css('overflow', 'hidden');
                $(idSelector).css('margin-top', '20px');
                search.set('hits', hit);
                results.add(search);
                $("#" + idButtons + " .button-yes").click(function() {
                    if ($("#list-sessions li").length != 0) {
                        var idParent = $(this).parents().parents().attr('id');
                        var indexHit = idParent.replace('contentInfoWindow','');
                        var indexCollection = findIndex(indexHit, results);
                        var hitsToSave = results.models[indexCollection].attributes.hits;
                        hitsToSave.score = 1;
                        hitsToSave.sessionname = $('#list-sessions').find('.active').text();
                        hitsToSave.username = $('#list-sessions').find('.active').attr('id');
                        var updateObjectScore = new Search;
                        results.remove(results.at(indexCollection));
                        updateObjectScore.set('input', $('#keyword-search-input').val());
                        updateObjectScore.set('hits', hitsToSave);
                        results.push(updateObjectScore, {at: indexCollection});
                        socket.emit('affectGoodScore', {object: hitsToSave});
                        var idThis = "#id-button-" + indexCollection;
                        $(idThis).children("button").addClass("disabled");
                        $(idThis).children("button").prop('disabled', false);
                        cptLabeled++;
                        if ($("#train-classifier").hasClass('disabled') && cptLabeled > 1) {
                            $("#train-classifier").removeClass('disabled');
                            $("#train-classifier").prop('disabled', false);
                        }
                    }
                });
                $("#" + idButtons + " .button-no").click(function() {
                    if ($("#list-sessions li").length != 0) {
                        var idParent = $(this).parents().parents().attr('id');
                        var indexHit = idParent.replace('contentInfoWindow','');
                        var indexCollection = findIndex(indexHit, results);
                        var hitsToSave = results.models[indexCollection].attributes.hits;
                        hitsToSave.score = 0;
                        hitsToSave.sessionname = $('#list-sessions').find('.active').text();
                        hitsToSave.username = $('#list-sessions').find('.active').attr('id');
                        var updateObjectScore = new Search;
                        results.remove(results.at(indexCollection));
                        updateObjectScore.set('input', $('#keyword-search-input').val());
                        updateObjectScore.set('hits', hitsToSave);
                        results.push(updateObjectScore, {at: indexCollection});
                        socket.emit('affectBadScore', {object:hitsToSave});
                        var idThis = "#id-button-" + indexCollection;
                        $(idThis).children("button").addClass("disabled");
                        $(idThis).children("button").prop('disabled', false);
                        cptLabeled++;
                        if ($("#train-classifier").hasClass('disabled') && cptLabeled > 1) {
                            $("#train-classifier").removeClass('disabled');
                            $("#train-classifier").prop('disabled', false);
                        }
                    }
                });

            }
            setAllMap(map);
            $('#modal-box').modal('toggle');
        } else {
            $('#text-modal').append("<p>No tweets are relative to this research</p>");
            $('#modal-box').modal('toggle');
        }
    });
}

google.maps.event.addDomListener(window, 'load', initialize);

$(document).ready(function() {
    var dataSessions = {
        userSessions : []
    };

    $('#submit-keyword').addClass('disabled');
    $('#submit-keyword').prop('disabled', true);

    $("#train-classifier").addClass('disabled');
    $("#train-classifier").prop('disabled', true);

    $("#keyword-search-input").addClass('disabled');
    $("#keyword-search-input").prop('disabled', true);

    $("#submit-keyword").click(function(){
        results = new SearchResults();
        var valInput = $("#keyword-search-input").val();
        socket.emit('updateTweets', { keyword: valInput });
    });

    $("#keyword-search-input").bind('keyup', function() {
        if($("#keyword-search-input").val() == "") {
            clearMarkers();
            markers = [];
        }
    });

    $("#input-username, #input-session-name").bind('keyup', function() {
        if ($("#input-username").val() != "" || $("#input-session-name").val() != "") {
            $("#submit-create-session").addClass("disabled");
        }
        if ($("#input-username").val() != "" && $("#input-session-name").val() != "") {
            //console.log("#submit-create-session", $("#submit-create-session"));
            $("#submit-create-session").removeClass("disabled");
        }
    });

    $("#submit-create-session").click(function() {
        if ($("#input-username").val() != "" && $("#input-session-name").val() != "") {
            var jsObj = { username: $("#input-username").val(), sessionname: $("#input-session-name").val(), status: "active" };
            dataSessions.userSessions.push(jsObj);
        }
        for (var i = 0; i < Object.keys(dataSessions.userSessions).length - 1; i++) {
            console.log(dataSessions);
            dataSessions.userSessions[i].status = "inactive";
            $("#list-sessions").empty();
            $("#list-sessions").append("<li id=" + dataSessions.userSessions[i].username + " class=" + dataSessions.userSessions[i].status + "><span style='cursor:pointer;'>" + dataSessions.userSessions[i].sessionname + "</span></li>");
        }
        $("#choose-session-button").removeClass("btn-danger");
        $('#submit-keyword').removeClass('disabled');
        $('#submit-keyword').prop('disabled', false);
        $("#keyword-search-input").removeClass('disabled');
        $("#keyword-search-input").prop('disabled', false);
        $("#no-history").remove();
        $("#list-sessions span").css('background-color', '');
        $("#list-sessions").append("<li id=" + jsObj.username + " class=" + jsObj.status + "><span style='cursor:pointer;'>"+  jsObj.sessionname + "</span></li>");
        $("#title-alert-active-session").empty().append("Current session : " + jsObj.sessionname);
        //$("#choose-session").val(dataSessions.userSessions[0].sessionname);
       //$("#choose-session-button").text(dataSessions.userSessions[0].sessionname);
    });

    $('#list-sessions').on('click', 'li', function () {
        if ($(this).hasClass("active")) {
            $("#list-sessions li").addClass("inactive");
            $(this).removeClass("inactive");
            $(this).addClass("active");
        } else {
            $("#list-sessions li").removeClass("active");
            $("#list-sessions li").addClass("inactive");
            $(this).removeClass('inactive');
            $(this).addClass("active");
        }
        var currentSession =  $("#list-sessions .active").html();
        $("#title-alert-active-session").html("Current session : " + currentSession);
    });

    //TRAIN CLASSIFIER HERE:
    $("#train-classifier").click(function() {
        socket.emit('trainClassifier', { sessionName : $("#list-sessions .active").text() });
    });

    socket.on("nodata", function(param) {
        console.log("no data");
        $('#text-modal').empty().append("<p>No tweets are relative to this research</p>");
        $('#modal-box').modal('toggle');
    });
});

/**** FUNCTIONS MARKERS GOOGLEMAPS ****/
function setAllMap(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}
function clearMarkers() {
    setAllMap(null);
}

function findIndex(index, collection) {
    for (var i=0; i < collection.models.length; i++) {
        console.log("collection id : ", collection.models[i].attributes.hits.id);
        console.log("index : ", index);
        if (collection.models[i].attributes.hits.id == index) {
            return i;
        }
    }
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
