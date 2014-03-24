/**
 * Created with JetBrains WebStorm.
 * User: thomastheissier
 * Date: 26/01/2014
 * Time: 18:09
 * To change this template use File | Settings | File Templates.
 */

$(document).ready(function() {
    var dataSessions = {
        userSessions : []
    };

    $("#submit-keyword").click(function(){
        var valInput = $("#keyword-search-input").val();
        socket.emit('updateTweets', {keyword: valInput});
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
            dataSessions.userSessions[i].status = "inactive";
        }
        $("#choose-session-button").removeClass("btn-danger");
        $("#no-history").remove();
        $("#list-sessions a").css('background-color', '');
        $("#list-sessions").append("<li><a style='background-color:#4cae4c;' href='#'>"+  jsObj.sessionname + "</a></li>");
        //$("#choose-session").val(dataSessions.userSessions[0].sessionname);
       //$("#choose-session-button").text(dataSessions.userSessions[0].sessionname);
    });
});
