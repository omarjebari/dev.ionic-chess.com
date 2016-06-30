// Required Modules
var express    = require("express");
var morgan     = require("morgan");
var bodyParser = require("body-parser");
//var jwt        = require("jsonwebtoken");
var mongoose   = require("mongoose");
var http       = require("http");
var cors       = require('cors');
var google     = require('googleapis');
var app        = express();


// Can remove this include as it's only for debugging purposes
var util = require('util');
// useage to eg debug objects
//console.log(util.inspect(myObject, {showHidden: false, depth: null}));


//var port = process.env.PORT || 3001;
var port = 3000;

var host = 'dev.ionic-chess.com';


var User     = require('./models/User');
var Game     = require('./models/Game');



// Connect to DB
//mongoose.connect(process.env.MONGO_URL);

mongoose.connect('mongodb://127.0.0.1:27017/local');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("dev"));


// Can prob remove cors (as the request that's failing is the outgoing one to google poss because the request isnt from the dev.ionic-chess.com domain) and specifying the host above (as i think its just working off the port)


app.use(cors());
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});



// Client is informing the server of the new access token so that it can validate it vs google and store
// it vs the new/existing user account
app.post('/authenticate', function(req, res) {

    console.log('Authenticate');

    var access_token = req.query.access_token;

    // Get user from Auth service provider using access token
/*
    service.getUserInfo = function (access_token, def) {
        var http = $http({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo',
            method: 'GET',
            params: {
                access_token: access_token
            }
        });
        http.then(function (data) {
            $log.debug(data);
            var user_data = data.data;
            var user = {
                name: user_data.name,
                gender: user_data.gender,
                email: user_data.email,
                google_id: user_data.sub,
                picture: user_data.picture,
                profile: user_data.profile
            };
            def.resolve(user);
        });
    };
*/

    /*

     {
         kind: 'plus#person',
         etag: '"i9aZP8TD8jXVPIxD0T0PWsMRx6s/cdg1125ZNXc1G9J83sGujMg8fOI"',
         gender: 'male',
         emails: [ { value: 'chess.carlsen@gmail.com', type: 'account' } ],
         objectType: 'person',
         id: '116094606304484202626',
         displayName: 'chess nemesis',
         name: { familyName: 'nemesis', givenName: 'chess' },
         url: 'https://plus.google.com/116094606304484202626',
         image:
         { url: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50',
         isDefault: true },
         isPlusUser: true,
         language: 'en',
         circledByCount: 0,
         verified: false
     }
     */

    var plus = google.plus('v1');
    var OAuth2 = google.auth.OAuth2;

    var redirect_url = 'http://dev.ionic-chess.com/oauth2callback';
    var client_id = '106299031547-13ena15mjccjsj7la1vm437a4fpqd236.apps.googleusercontent.com';
    var secret = 'LJ0jwYByZJt_e_GmQHNRHaK7';

    var oauth2Client = new OAuth2(client_id, secret, redirect_url);

    // Retrieve tokens via token exchange explained above or set them:
    oauth2Client.setCredentials({
        access_token: access_token
        //refresh_token: 'REFRESH TOKEN HERE'
    });

    plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
        // handle err and response
        if (err) {

            // Add some error handling
            console.log(err);
        }
        else {

            // User details have been returned from the Auth Service
            // Search for the user by service_provider_user_id and update token or create new user

            //console.log('RESPONSE:');
            //console.log(response);


            var serviceProviderUserId = response['id'];
            var firstName = response['name']['givenName'];
            var lastName = response['name']['familyName'];
            var primaryEmail = response['emails'][0]['value'];


            console.log('Checking to see if record exists for id: ' + serviceProviderUserId);

            User.findOne({service_provider_user_id: serviceProviderUserId}, function(err, user) {
                if (err) {
                    res.json({
                        type: false,
                        data: "Error occured: " + err
                    });
                } else {

                    if (user) {

                        console.log('User exists so update the token');

                        // Update the user's token in the db
                        user.access_token = access_token;
                        user.save();

                        res.json({
                            type: true,
                            data: user,
                            access_token: user.access_token
                        });

                    } else {

                        console.log('Create new user');
                        console.log('serviceProviderUserId: ' + serviceProviderUserId);
                        console.log('primaryEmail: ' + primaryEmail);
                        console.log('firstName: ' + firstName);

                        // Create new user in local db
                        var userModel = new User({
                            service_provider_user_id: serviceProviderUserId,
                            email: primaryEmail,
                            first_name: firstName,
                            last_name: lastName,
                            access_token: access_token
                        });

                        userModel.save(function(err, newUser) {
                            if (err) {

                                console.log('Error creating new user');
                                console.log(err);


                                res.json({
                                    type: false,
                                    data: "Error occured: " + err
                                });
                            }
                            else {

                                console.log('Created new user OK');

                                res.json({
                                    type: true,
                                    data: newUser,
                                    access_token: newUser.access_token
                                });
                            }
                        });
                    }
                }
            });
        }
    });
});








/**
NEXT!
You have created the 'checkAuthorised' function below as middleware for protected routes and have setup routes
that will use it that have urls of '/api/*.
You have loaded the user found in the 'checkAuthorised' function into a global req.current_user variable so that
it is available globally.
In the callback from /authorised (on the client side) a call is being made to load the games (GET /api/games)
 and it is fetching the games back from the db.
Now do the following:
    - In the callback from GET /api/games (on the client side) get the angular template and (in it's callback)
 populate it with the data
    - at this point u’ll need to integrate socket.io - this may require using socket for the login.
 This is because the output is sent to all connected sockets when just using node.


 Node RESTful API
 Route	            HTTP Verb	Description
 /api/games	        GET	        Get all the games.
 /api/games	        POST	    Create a game.
 /api/games/:game_id	GET	        Get a single game.
 /api/games/:game_id	PUT	        Update a game with new info.
 /api/games/:game_id	DELETE	    Delete a game.
 
*/

// Call the middleware for all functions matching this route pattern
app.all('/api/*', checkAuthorised, function(req, res, next) {
    next(); // if the middleware allowed us to get here,
            // just move on to the next route handler
});

app.get('/api/games', function(req, res) {

    console.log('Hit server to get games');

    var access_token = req.query.access_token;

    User.findOne({access_token: access_token}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        }
        else {

            if (user) {

                console.log('User exists so retrieve games and return them');

                Game.find({$or : [{white_id: user._id}, {black_id: user._id}]}).exec(function(err, games){


                    if (err) {
                        res.json({
                            type: false,
                            data: "Error occured: " + err
                        });
                    }
                    else {
                        if (games) {

                            console.log(games);

                            res.json({
                                type: true,
                                data: games,
                            });

                        }
                        else {
                            res.json({
                                type: false,
                                data: "Error occurred (dont seem to be any games)"
                            });
                        }
                    }


                });

            } else {

                res.json({
                    type: false,
                    data: "Error occurred (doesnt seem to be a user)"
                });
            }
        }
    });



    // Retrieve the currentUser's games
    // req.current_user should be available to use here

    // CHECK THE ABOVE STATEMENT, NOT SURE THERE'S ANY POINT SETTING req.current_user AS IT DOESNT LAST BETWEEN
    // REQUESTS. BETTER TO USE THE TOKEN TO RETRIEVE THE USER AND GET THEIR GAMES. WILL NEED TO BE USING SOCKET FOR THIS!

});

function checkAuthorised(req, res, next) {

    console.log('Check Authorised');

    var access_token = req.query.access_token;

    if (typeof access_token !== 'undefined') {

        User.findOne({access_token: access_token}, function(err, user) {

            if (err) {

                console.log('An error occurred finding the user: ' + err);

                res.json({
                    type: false,
                    data: "Error occured: " + err
                });
            }
            else {

                if (user) {



                    // Need to set the 'user' kinda globally else gonna have to keep getting it!

                    req.current_user = user;


                    next();
                }
                else {

                    console.log('User token mismatch');

                    res.json({
                        type: false,
                        data: "User token mismatch"
                    });

                    // Bump user to login page on the clientside (and clear its token and auth/session)!
                    // DO WE EVER HIT THIS IF THE CLIENTSIDE HANDLES STUFF - NEED TO TEST THIS


                }

            }
        });
    }
    else {
        // DO WE EVER HIT THIS IF THE CLIENTSIDE HANDLES STUFF - NEED TO TEST THIS

        console.log('Token missing');

        res.json({
            type: false,
            data: "Token missing"
        });

        // Bump user to login page on the clientside (and clear its token and auth/session)!


    }
}

function createGame(user, otherUser)
{
    // THIS FN IS INCOMPLETE AS NEEDS TO BE PASSED OBJECTS FOR EACH OF OWNER/WHITE/BLACK/USER_TO_MOVE

    // Create new games in local db
    var gameModel = new Game({
        game_data: {
            'board': { 0:1, 1:2 },
            'playerWhite': {'username': 'chess nemesis', 'colour': 'white'},
            'playerBlack': {'username': 'chess kramnik', 'colour': 'black'},
            'game_history': [['e4','e5'],['Nf3','Nc6'],['Bb5']],
            'game_status': 'black to play',
            'castling': {'white': [1, 2], 'black': [3, 4]}
        },
        owner_id: user._id,
        white_id: user._id,
        black_id: otherUser._id,
        user_to_move_id: user._id,
        finished: 0
    });

    gameModel.save(function(err, newGame) {
        if (err) {

            console.log('Error creating new game');
            console.log(err);

            res.json({
                type: false,
                data: "Error occured: " + err
            });
        }
        else {

            console.log('Created new game OK');

            res.json({
                type: true,
                data: newGame,
            });
        }
    });
}


process.on('uncaughtException', function(err) {
    console.log(err);
});

// Start Server
app.listen(port, host, function () {
    console.log( "Express server listening on port " + port);
});
/*
app.listen(port, function () {
    console.log( "Express server listening on port " + port);
});
*/