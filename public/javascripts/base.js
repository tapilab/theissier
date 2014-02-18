/**
 * Created with JetBrains WebStorm.
 * User: thomastheissier
 * Date: 26/01/2014
 * Time: 18:09
 * To change this template use File | Settings | File Templates.
 */

$(document).ready(function() {
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

});
