
var CT            = require('./modules/country-list');
var AM            = require('./modules/account-manager');
var EM            = require('./modules/email-dispatcher');
var zerorpc       = require('zerorpc');
var clientZeroRPC = new zerorpc.Client();
clientZeroRPC.connect("tcp://127.0.0.1:4242");
var elasticsearch = require('elasticsearch');
var ESclient      = new elasticsearch.Client();

module.exports = function(app) {

// main login page //

	app.get('/', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
					res.redirect('/map');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});

	app.post('/', function(req, res){
		AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
			if (!o){
				res.send(e, 400);
			}	else{
			    req.session.user = o;
				if (req.param('remember-me') == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.send(o, 200);
			}
		});
	});

    app.get('/map', function(req,res) {
        if (req.session.user == null) {
            //if user is not logged-in redicrect back to login page //
            res.redirect('/');
        } else {
            console.log("map router called here", req.session.user);
            console.log("sessions : ", req.session.user.sessions);
            res.render('map', {
                title : 'Map',
                udata : req.session.user,
                sessions: JSON.stringify(req.session.user.sessions)
            });
        }
    });

// logged-in user homepage //

	app.get('/home', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
			res.render('home', {
				title : 'Control Panel',
				countries : CT,
				udata : req.session.user
			});
	    }
	});

	app.post('/home', function(req, res){
		if (req.param('user') != undefined) {
			AM.updateAccount({
				user 		: req.param('user'),
				name 		: req.param('name'),
				email 		: req.param('email'),
				country 	: req.param('country'),
				pass		: req.param('pass')
			}, function(e, o){
				if (e){
					res.send('error-updating-account', 400);
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });
					}
					res.send('ok', 200);
				}
			});
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});

// creating new accounts //

	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup', countries : CT });
	});

	app.post('/signup', function(req, res){
        var sessions = [];
		AM.addNewAccount({
			name 	     : req.param('name'),
			email 	     : req.param('email'),
			user 	     : req.param('user'),
			pass	     : req.param('pass'),
			country      : req.param('country'),
            sessions     : sessions,
            activesession: ''
		}, function(e){
			if (e){
				res.send(e, 400);
			}	else{
				res.send('ok', 200);
			}
		});
	});

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.param('email'), function(o){
			if (o){
				res.send('ok', 200);
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// should add an ajax loader to give user feedback //
					if (!e) {
					//	res.send('ok', 200);
					}	else{
						res.send('email-server-error', 400);
						for (k in e) console.log('error : ', k, e[k]);
					}
				});
			}	else{
				res.send('email-not-found', 400);
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});

	app.post('/reset-password', function(req, res) {
		var nPass = req.param('pass');
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
        AM.updatePassword(email, nPass, function(e, o){
            if (o){
                res.send('ok', 200);
            }	else{
                res.send('unable to update password', 400);
            }
        })
	});

// view & delete accounts //

	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});

	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
	            req.session.destroy(function(e){ res.send('ok', 200); });
			}	else{
				res.send('record not found', 400);
			}
	    });
	});

	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');
		});
	});


    /** END LOGIN **/

    app.get('/search', function(req,res) {

    });

    app.post('/search', function(req, res) {
        if (req.session.user == null) {
            res.redirect('/');
        } else {
            if(req.body.keyword.indexOf(" ") == -1) { //if word
                ESclient.search({
                    index: 'test',
                    type: 'test',
                    body: {
                        query: {
                             bool: {
                                should : [
                                    {
                                         term: {
                                            "text": req.body.keyword
                                         }
                                    }
                                ]
                             }
                        }
                    }
                }).then(function (resp) {
                    var hits = resp.hits.hits;
                    res.send({
                        title: 'Map',
                        udata: req.session.user,
                        hits: hits
                    }, 200);
                }, function (err) {
                    console.trace(err.message);
                });
            } else { //else sentence
                ESclient.search({
                    index: 'test',
                    type: 'test',
                    body: {
                        query :{
                            bool : {
                                must : {
                                    match : {
                                        text : {
                                            "query" : req.body.keyword, "type" : "phrase"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }).then(function (resp) {
                    var hits = resp.hits.hits;
                    res.send({
                            title: 'Map',
                            udata: req.session.user,
                            hits: hits
                    });
                }, function (err) {
                    console.trace(err.message);
                });
            }
        }
    });

    app.post('/affectscore', function(req,res) {
        if (req.session.user == null) {
            res.redirect('/');
        } else {
            console.log("req body hit : ", req.body.hit);
            AM.addScoredTweet(req.body.hit, function(e, o) {
                if (o){
                    console.log("output : ", o);
                    res.send('ok', 200);
                }	else {
                    res.send(e, 400);
                }
            });
        }
    });

    app.post('/postsession', function(req,res) {
        if (req.session.user == null) {
            res.redirect('/');
        } else {
            console.log("req sessionname : ", req.body.sessionname);
            console.log("req id user : ", req.body.id);
            var jsObj = { sessionname: req.body.sessionname, countYes: 0, countNo: 0 };
            console.log("type of js Obj here : ", typeof(jsObj));
            console.log("js Obj here : ", jsObj);
            AM.postSessionTry(req.body.id, jsObj, function(e, o){
                if (e)
                    res.send(e, 400);
                else
                    res.send(req.body.sessionname, 200);
            });
        }
    });

    app.post('/train', function(req,res) {
        if (req.session.user == null) {
            res.redirect('/');
        } else {
            var allIds = [];
            var hits = [];
            clientZeroRPC.invoke("fit", req.body.activeSession, req.body.userId, function(error, res, more) {
                console.log("well-fit");
            });

            clientZeroRPC.invoke("predict", req.body.activeSession, req.body.userId, function(error, result, more) {
                console.log("send to python predict");
                console.log("this is the res from python", result);
                var ids = result.replace("[", "");
                ids = ids.replace("]", "");
                regExp=/'/g;
                ids = ids.replace(regExp, "");
                ids = stringToArrayBis(ids);
                console.log("here last id :", ids[Object.size(ids) - 1]);
                var lastID = ids[Object.size(ids) - 1].split(" ");
                ids[Object.size(ids) - 1] = lastID[0];
                for (var k = 0; k < Object.size(ids); k++) {
                    console.log("id number : ", k, ids[k]);
                }
                ESclient.mget({
                    index: 'test',
                    type: 'test',
                    body: {
                        ids: ids
                    }
                }, function(error, response) {
                    if (error) throw error;
                    else {
                        console.log("res : ", res);
                        console.log("response docs : ", response.docs);
                        res.send({
                            title: 'Map',
                            udata: req.session.user,
                            hits: response.docs
                        });
                    }
                });
            });
        }

    });

	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });


};

function stringToArrayBis(string) {
    var array = [];
    if (!string) {
        return []
    } else {
        console.log("the string is : ", string);
        array = string.split(', ');
        return array;
    }
}