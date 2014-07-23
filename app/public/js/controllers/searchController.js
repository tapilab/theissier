
var map;
var markers = [];
var infoWindows = [];
var cptLabeledYES = 0;
var cptLabeledNO = 0;
var dataSessions = {
    userSessions : []
};
var userId = $("#userId").val();
var activeSession = $("#activeSession").val();
var sessions = $("#sessionsUser").val();
sessions = JSON.parse(sessions);

var Search = Backbone.Model.extend({
    defaults: {
        input: "Keyword",
        hits: new Object()
    },
    initialize: function(){
        //console.log("Search is initialized");
    }
});
var SearchResults = Backbone.Collection.extend({
    model: Search
});
var results = new SearchResults();
// console.log( results.models );

function SearchController()
{
    console.log("user ID : ", userId);
    console.log("active one : ", activeSession);
    console.log("sessions : ", sessions);

    results = new SearchResults();
    results.reset();
    clearMarkers();
    markers = [];
    infoWindows = [];
    var mapOptions = {
        zoom: 2,
        center: new google.maps.LatLng(10, 0)
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    google.maps.event.addDomListener(window, 'load', initialize());

// bind event listeners to button clicks //
    var that = this;

    initButtons(); //first thing some buttons can't be clicked on.
    initSessions();

    $("#submit-keyword").click(function() {    //search for a precise keyword
        var word = $("#keyword-search-input").val();
        if (word != "") {
            that.searchKeyword(word);
        } else {
            that.onUpdate('Search failed !', '<p>You have to provide a keyword to search for something !</p>');
        }
    });

    $("#submit-create-session").click(function() {  //create a session
        var sessionname = $("#input-session-name").val();
        if (sessionname != "") {
            that.submitSession(sessionname);
        }
    });

    $("#keyword-search-input").bind('keyup', function() {   //markers for map
        if($("#keyword-search-input").val() == "") {
            clearMarkers();
            markers = [];
        }
    });

    //TRAIN CLASSIFIER HERE:
    $("#train-classifier").click(function() {
        results.reset();
        that.trainClassifier(userId, activeSession);
        console.log("active session : ", activeSession);
    });

    changeStateButtons(); //change state buttons
    changeActiveSession();

    this.trainClassifier = function(userId, activeSession) {
        var that = this;
        $.ajax({
            url: "/train",
            type: "POST",
            data: { userId: userId, activeSession: activeSession },
            success: function(data) {
                that.onUpdate('TOP N TWEETS', data.hits);
            },
            error: function(jqXHR){
                console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
            }
        });
    }

    this.submitSession = function(sessionname) {
        that.postSession(sessionname);
    }

    this.searchKeyword = function(word)
    {
        var that = this;
        $.ajax({
            url: "/search",
            type: "POST",
            data: { keyword: word },
            success: function(data) {
                results.reset();
                that.onUpdate('Tweets found', data.hits);
            },
            error: function(jqXHR){
                console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
            }
        });
    }

    this.postSession = function(sessionname)
    {
        var that = this;
        $.ajax({
            url: '/postsession',
            type: 'POST',
            data: { id: $("#userId").val(), sessionname : sessionname },
            success: function(sessionname) {
                that.onUpdate('Session created', '<p>You can now label tweets under the session : ' + sessionname + '</p>');
                activeSession = sessionname;
                updateSessionsClient();
            },
            error: function(e) {
                if (e.responseText == 'session already created'){
                    that.onUpdate('Error when creating the session', '<p>Session already created. Please change the name of the session</p>');
                    //updateSessionsClient();
                } else {
                    console.log(e.responseText + ' :: ' + e.statusText);
                }
            }
        });
    }
}

SearchController.prototype.onUpdate = function(title , data)
{
    $('.modal-alert .modal-header h4').empty();
    $('.modal-alert .modal-body').empty();
    $('.modal-alert .modal-header h4').text(title);
    if  (typeof(data) == 'object') {
        clearMarkers();
        initialize(data, this);
    } else {
        $('.modal-alert .modal-body').append(data);
    }
    $('.modal-alert').modal('toggle');
}

function initButtons()
{
    $('#submit-keyword').addClass('disabled');
    $('#submit-keyword').prop('disabled', true);

    $("#train-classifier").addClass('disabled');
    $("#train-classifier").prop('disabled', true);

    $("#keyword-search-input").addClass('disabled');
    $("#keyword-search-input").prop('disabled', true);
}

function changeStateButtons() {  //enable/disable form buttons clicks
    $("#input-username, #input-session-name, #input-login-username").bind('keyup', function() {
        if ($("#input-username").val() != "" || $("#input-session-name").val() != "") {
            $("#submit-create-session").addClass("disabled");
        }
        if ($("#input-username").val() != "" && $("#input-session-name").val() != "") {
            //console.log("#submit-create-session", $("#submit-create-session"));
            $("#submit-create-session").removeClass("disabled");
        }
        if ($("#input-login-username").val() != "") {
            $("#submit-login-box").removeClass("disabled");
        }
        if ($("#input-login-username").val() == "") {
            $("#submit-login-box").addClass("disabled");
        }
    });
}

function initSessions() {   //initialize sessions -> retrieve sessions on the server side before & display on the client
    if (Object.size(sessions) == 0) {
        console.log("no sessions available");
    } else {
        $('#submit-keyword').removeClass('disabled');
        $('#submit-keyword').prop('disabled', false);
        $("#keyword-search-input").removeClass('disabled');
        $("#keyword-search-input").prop('disabled', false);
        $("#list-sessions").empty();
        $("#choose-session-button").removeClass("btn-danger");
        for (var key in sessions) {
            var session = sessions[key];
            var status = "inactive";
            console.log("active Session : ", activeSession);
            if (session == activeSession)
                status = "active";
            var jsObj = { username: $("#userId").val(), sessionname: session.sessionname, status: status };
            dataSessions.userSessions.push(jsObj);
            status = "inactive";
            $("#list-sessions").append("<li id=" + dataSessions.userSessions[key].username + " class=" + dataSessions.userSessions[key].status + "><span style='cursor:pointer;'>" + dataSessions.userSessions[key].sessionname + "</span></li>");
        }
        $("#title-alert-active-session").empty().append("Current session : " + activeSession);
    }
}

function initialize(data, reference) {
    if (typeof(data) != 'undefined' ) {
        for (var index = 0; index < Object.size(data); index++) {
            var search = new Search();
            search.set('input',$("#keyword-search-input").val());
            var hit = new Object();
            console.log("hits[i]", data[index]);
            /************ FILL THE HIT OUT **********/
            hit.userId = userId;
            hit.id = data[index]._id;
            hit.username = data[index]._source.user.name;
            hit.created_at = data[index]._source.created_at;
            hit.text = data[index]._source.text;
            if (data[index]._source.geo != null) {
                hit.lng = data[index]._source.geo.coordinates[0];
                hit.lat = data[index]._source.geo.coordinates[1];
            }
            hit.score = -1;
            /*********** FILL THE HIT OUT ***********/

            var idButtons = "id-button-" + index;
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

            $('.modal-alert .modal-body').append(usernameAndTweet);
            var idSelector = "#" + idInfoWindow;
            $(idSelector).append("<div id=" + idButtons + " class='yes-or-no'><button type='button' class='button-yes btn btn-success'><span class='glyphicon glyphicon-ok-sign'></span> Yes!</button><br/><button type='button' class='button-no btn btn-danger'><span class='glyphicon glyphicon-remove-sign'></span> Nope!</button></div></div>");
            $(idSelector).css('overflow', 'hidden');
            $(idSelector).css('margin-top', '20px');
            search.set('hits', hit);
            results.add(search);
            $("#" + idButtons + " .button-yes").click(function() {
                //affect score 1
                var scoreAffected = 1;
                onClickTweet(scoreAffected, $(this), reference);
            });
            $("#" + idButtons + " .button-no").click(function() {
                //affect score 0
                var scoreAffected = 0;
                onClickTweet(scoreAffected, $(this), reference);
            });
        }
    }
}

function onClickTweet(scoreAffected, parent, reference) {
    if ($("#list-sessions li").length != 0) {
        var idParent = parent.parents().parents().attr('id');
        var indexHit = idParent.replace('contentInfoWindow','');
        var indexCollection = findIndex(indexHit, results);
        console.log("index collection : ",indexCollection);
        var hitsToSave = results.models[indexCollection].attributes.hits;
        hitsToSave.score = scoreAffected;
        hitsToSave.sessionname = $('#list-sessions').find('.active').text();
        hitsToSave.username = $('#list-sessions').find('.active').attr('id');
        var updateObjectScore = new Search;
        results.remove(results.at(indexCollection));
        updateObjectScore.set('input', $('#keyword-search-input').val());
        updateObjectScore.set('hits', hitsToSave);
        results.push(updateObjectScore, { at: indexCollection });
        $.ajax({
            url: "/affectscore",
            type: "POST",
            data: { hit: hitsToSave },
            success: function() {
                console.log("success written in the database");
                var idThis = "#id-button-" + indexCollection;
                $(idThis).children("button").addClass("disabled");
                $(idThis).children("button").prop('disabled', false);
            },
            error: function(e){
                if (e.responseText == 'tweet already labeled') {
                    $('.modal-alert .modal-header h4').text('Error when labeling the tweet');
                    $('.modal-alert .modal-body').empty().append('<p>The tweet has already been labeled. Please label other ones.</p>');
                } else {
                    console.log(e.responseText + ' :: ' + e.statusText);
                }
            }
        });
        if (scoreAffected)
            cptLabeledYES++;
        else
            cptLabeledNO++;
        if ($("#train-classifier").hasClass('disabled') && cptLabeledNO >= 1 && cptLabeledYES >= 1) {
            $("#train-classifier").removeClass('disabled');
            $("#train-classifier").prop('disabled', false);
        }
    }
}

function updateSessionsClient() {
    var jsObj = { username: $("#userId").val(), sessionname: $("#input-session-name").val(), status: "active" };
    dataSessions.userSessions.push(jsObj);
    $("#list-sessions").empty();
    for (var j = 0; j < Object.size(dataSessions.userSessions) - 1; j++) {
        console.log(dataSessions);
        dataSessions.userSessions[j].status = "inactive";
        $("#list-sessions").append("<li id=" + dataSessions.userSessions[j].username + " class=" + dataSessions.userSessions[j].status + "><span style='cursor:pointer;'>" + dataSessions.userSessions[j].sessionname + "</span></li>");
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
}

function changeActiveSession() {
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
        activeSession = $("#list-sessions .active span").html();
    });
}

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

function stringToArray(string) {
    var array = [];
    if (!string) {
        return []
    } else {
        console.log("the string is : ", string);
        array = string.split(',');
        return array;
    }
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};