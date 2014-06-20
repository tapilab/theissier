/**
 * Created with JetBrains WebStorm.
 * User: thomastheissier
 * Date: 12/06/2014
 * Time: 09:16
 * To change this template use File | Settings | File Templates.
 */

$(document).ready(function() {
    $("#input-username2, #input-password2").bind('keyup', function() {
        if ($("#input-username2").val() != "" || $("#input-password2").val() != "") {
            $("#login-button").addClass("disabled");
        }
        if ($("#input-username2").val() != "" && $("#input-password2").val() != "") {
            //console.log("#submit-create-session", $("#submit-create-session"));
            $("#login-button").removeClass("disabled");
        }
    });

    $("#input-username, #input-password").bind('keyup', function() {
        if ($("#input-username").val() != "" || $("#input-password").val() != "") {
            $("#submit-create-account").addClass("disabled");
        }
        if ($("#input-username").val() != "" && $("#input-password").val() != "") {
            //console.log("#submit-create-session", $("#submit-create-session"));
            $("#submit-create-account").removeClass("disabled");
        }
    });

    $(".login-buttons").click(function() {
        var username = "";
        var password = "";
        var usernameAndPassword = '';
        if ($(this).attr('id') == 'login-button') {
            //button-login pressed
            username = $("#input-username2").val();
            password = $("#input-password2").val();
            usernameAndPassword = username + '_' + password;
            socket.emit("login", usernameAndPassword);
        } else {
            //button-create pressed
            username = $("#input-username").val();
            password = $("#input-password").val();
            usernameAndPassword = username + '_' + password;
            socket.emit("createaccount", usernameAndPassword);
        }

    });
});
