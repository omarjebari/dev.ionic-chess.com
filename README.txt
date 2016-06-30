To run the app you need to do two things from the project root dir:
1) Get the node service running with > node server.js
2) Get the mobile app running with > ionic emulate ios


* cd into your project: $ cd dev.ionic-chess.com

* Setup this project to use Sass: ionic setup sass

* Develop in the browser with live reload: ionic serve

* Add a platform (ios or Android): ionic platform add ios [android]
  Note: iOS development requires OS X currently
  See the Android Platform Guide for full Android installation instructions:
  https://cordova.apache.org/docs/en/edge/guide_platforms_android_index.md.html

* Build your app: ionic build <PLATFORM>

* Simulate your app: ionic emulate <PLATFORM>

* Run your app on a device: ionic run <PLATFORM>

* Package an app using Ionic package service: ionic package <MODE> <PLATFORM>

For more help use ionic --help or ionic docs

Visit the Ionic docs: http://ionicframework.com/docs


New! Add push notifications to your Ionic app with Ionic Push (alpha)!
https://apps.ionic.io/signup
+---------------------------------------------------------+
+ New Ionic Updates for October 2015
+
+ The View App just landed. Preview your apps on any device
+ http://view.ionic.io
+
+ Invite anyone to preview and test your app
+ ionic share EMAIL
+
+ Generate splash screens and icons with ionic resource
+ http://ionicframework.com/blog/automating-icons-and-splash-screens/


+---------------------------------------------------------+
* Making http calls

var options = {
    host: 'https://www.googleapis.com',
    path: '/oauth2/v3/userinfo?access_token=' + access_token
    //method: 'GET'
    //port: 80
};


// ? Should we pass in res instead of http_res or maybe it doesnt matter as callback returning json just goes inside?

http.get(options, function (http_res) {
    // initialize the container for our data
    var data = "";

    // this event fires many times, each time collecting another piece of the response
    http_res.on("data", function (chunk) {
        // append this chunk to our growing `data` var
        data += chunk;
    });

    // this event fires *one* time, after all the `data` events/chunks have been gathered
    http_res.on("end", function () {
        console.log('STATUS: ' + http_res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(http_res.headers));

        // you can use res.send instead of console.log to output via express
        console.log(data);
    });
});


+---------------------------------------------------------+
* Fetching a user record from mongodb with mongoose (where 'req' refers to an available request object)

User.findOne({email: req.body.email, password: req.body.password}, function(err, user) {
    if (err) {
        res.json({
            type: false,
            data: "Error occured: " + err
        });
    } else {
        if (user) {
            res.json({
                type: true,
                data: user,
                token: user.token
            });
        } else {
            res.json({
                type: false,
                data: "Incorrect email/password"
            });
        }
    }
});


+---------------------------------------------------------+
* Protecting node js routes with middleware

app.get('/me', ensureAuthorized, function(req, res) {
    User.findOne({token: req.token}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            res.json({
                type: true,
                data: user
            });
        }
    });
});

function ensureAuthorized(req, res, next) {
    var access_token = req.query.access_token;
    if (typeof access_token !== 'undefined') {
        User.findOne({access_token: access_token}, function(err, user) {
            if (err) {
                console.log('An error occurred querying: ' + err);
            }
            else {
                if (user) {
                    next();
                }
                else {
                    console.log('User token mismatch');
                }
            }
        });
    }
    else {
        console.log('Token missing');
    }
}
