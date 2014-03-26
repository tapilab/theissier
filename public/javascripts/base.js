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
            console.log(dataSessions);
            dataSessions.userSessions[i].status = "inactive";
            $("#list-sessions").empty();
            $("#list-sessions").append("<li id=" + dataSessions.userSessions[i].sessionname + " class=" + dataSessions.userSessions[i].status + "><a style='backgroud-color:#fff;' href='#'>" + dataSessions.userSessions[i].sessionname + "</a></li>");
        }
        $("#choose-session-button").removeClass("btn-danger");
        $("#no-history").remove();
        $("#list-sessions a").css('background-color', '');
        $("#list-sessions").append("<li id="+ jsObj.sessionname+ " class=" + jsObj.status + "><a style='background-color:#4cae4c;' href='#'>"+  jsObj.sessionname + "</a></li>");
        $("#title-alert-active-session").empty().append("Current session : " + jsObj.sessionname);
        //$("#choose-session").val(dataSessions.userSessions[0].sessionname);
       //$("#choose-session-button").text(dataSessions.userSessions[0].sessionname);
    });
});
