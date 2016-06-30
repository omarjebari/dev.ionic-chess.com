var googleLoginService = angular.module('GoogleLoginService', ['ngStorage']);

// Create a service using the factory method
googleLoginService.factory('timeStorage', ['$localStorage', function ($localStorage) {
        var timeStorage = {};
        timeStorage.cleanUp = function () {
            var cur_time = new Date().getTime();
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key.indexOf('_expire') === -1) {
                    var new_key = key + "_expire";
                    var value = localStorage.getItem(new_key);
                    if (value && cur_time > value) {
                        localStorage.removeItem(key);
                        localStorage.removeItem(new_key);
                    }
                }
            }
        };
        timeStorage.remove = function (key) {
            this.cleanUp();
            var time_key = key + '_expire';
            $localStorage[key] = false;
            $localStorage[time_key] = false;
        };
        timeStorage.set = function (key, data, hours) {
            this.cleanUp();
            $localStorage[key] = data;
            var time_key = key + '_expire';
            var time = new Date().getTime();
            time = time + (hours * 1 * 60 * 60 * 1000);
            $localStorage[time_key] = time;
        };
        timeStorage.get = function (key) {
            this.cleanUp();
            var time_key = key + "_expire";
            if (!$localStorage[time_key]) {
                return false;
            }
            var expire = $localStorage[time_key] * 1;
            if (new Date().getTime() > expire) {
                $localStorage[key] = null;
                $localStorage[time_key] = null;
                return false;
            }
            return $localStorage[key];
        };
        return timeStorage;
    }]);


/**
 * Note that $q (below) is a service that helps you run functions asynchronously,
 * and use their return values (or exceptions) when they are done processing
 */
// Create a service using the factory method
googleLoginService.factory('googleLogin', [
    '$http', '$q', '$interval', '$log', 'timeStorage',
    function ($http, $q, $interval, $log, timeStorage) {

        var currentUser = null;

        var service = {};
        service.access_token = false;

        //service.redirect_url = 'http://127.0.0.1:81/google_demo/www/';
        //service.client_id = '789799094420-uuak74v7em9o9a2ek9fd5v1hiki9knmi.apps.googleusercontent.com';
        //service.secret = 'n_h_eHTdXLn2AUeKSy6NVaYk';

        service.redirect_url = 'http://dev.ionic-chess.com/oauth2callback';
        service.client_id = '106299031547-13ena15mjccjsj7la1vm437a4fpqd236.apps.googleusercontent.com';
        service.secret = 'iC8m9qdrZIQ_CbekcMNsQumT';

        service.scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/plus.me';
        service.gulp = function (url, name) {
            url = url.substring(url.indexOf('?') + 1, url.length);

            return url.replace('code=', '');

//            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
//            var regexS = "[\\#&]" + name + "=([^&#]*)";
//            var regex = new RegExp(regexS);
//            var results = regex.exec(url);
//            if (results == null)
//                return "";
//            else
//                return results[1];

//            var match,
//                    pl = /\+/g, // Regex for replacing addition symbol with a space
//                    search = /([^&=]+)=?([^&]*)/g,
//                    decode = function (s) {
//                        return decodeURIComponent(s.replace(pl, " "));
//                    },
//                    query = url;
//
//            var urlParams = {};
//            while (match = search.exec(query))
//                urlParams[decode(match[1])] = decode(match[2]);
//
//            if (urlParams.name) {
//                return urlParams.name;
//            } else {
//                return false;
//            }

        };
        service.authorize = function (options) {
            var def = $q.defer();
            var self = this;

            console.log('AUTHORSING');

            var access_token = timeStorage.get('google_access_token');
            if (access_token) {

                $log.info('Direct Access Token :' + access_token);

                console.log('Direct Access Token Exists:' + access_token);


                // Load a base view if havent got one already loaded!
                // Note that the views (inc the one currently being loaded) should come from node client.js


                // NOTE THAT BELOW DOES NOT GET CALLED UNTIL WE MAKE A REQUEST WITH THE TOKEN, IE NOT WHEN THE
                // 'ELSE' STATEMENT GETS EXECUTED (THE SCENARIO WHERE IT LOGS THE USER IN WITH GOOGLE)

                // Inform the server of the new access token so that it can validate it vs google and store
                // it vs the new/existing user account
                service.authNotifyServer(access_token, def);

                // Essentially you just want to do the service.getUserInfo(access_token) call below on the serverside!




                //service.getUserInfo(access_token, def);


            } else {

                console.log('No token so getting one');

                var params = 'client_id=' + encodeURIComponent(options.client_id);
                params += '&redirect_uri=' + encodeURIComponent(options.redirect_uri);
                params += '&response_type=code';
                params += '&scope=' + encodeURIComponent(options.scope);
                var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + params;

                var win = window.open(authUrl, '_blank', 'location=no,toolbar=no,width=800, height=800');
                var context = this;

                if (ionic.Platform.isWebView()) {
                    console.log('using in app browser');
                    win.addEventListener('loadstart', function (data) {
                        console.log('load start');
                        if (data.url.indexOf(context.redirect_url) === 0) {
                            console.log('redirect url found ' + context.redirect_url);
                            console.log('window url found ' + data.url);
                            win.close();
                            var url = data.url;
                            var access_code = context.gulp(url, 'code');
                            if (access_code) {
                                context.validateToken(access_code, def);
                            } else {
                                def.reject({error: 'Access Code Not Found'});
                            }
                        }

                    });
                } else {
                    console.log('InAppBrowser not found11');
                    var pollTimer = $interval(function () {
                        try {
                            console.log("google window url " + win.document.URL);
                            if (win.document.URL.indexOf(context.redirect_url) === 0) {
                                console.log('redirect url found');
                                win.close();
                                $interval.cancel(pollTimer);
                                pollTimer = false;
                                var url = win.document.URL;
                                $log.debug('Final URL ' + url);
                                var access_code = context.gulp(url, 'code');
                                if (access_code) {
                                    $log.info('Access Code: ' + access_code);
                                    context.validateToken(access_code, def);
                                } else {
                                    def.reject({error: 'Access Code Not Found'});
                                }
                            }
                        } catch (e) {
                        }
                    }, 100);
                }
            }
            return def.promise;
        };
        service.validateToken = function (token, def) {
            $log.info('Code: ' + token);
            var http = $http({
                url: 'https://www.googleapis.com/oauth2/v3/token',
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    code: token,
                    client_id: this.client_id,
                    client_secret: this.secret,
                    redirect_uri: this.redirect_url,
                    grant_type: 'authorization_code',
                    scope: ''
                }
            });
            var context = this;
            http.then(function (data) {
                $log.debug(data);
                var access_token = data.data.access_token;
                var expires_in = data.data.expires_in;
                expires_in = expires_in * 1 / (60 * 60);

                $log.info('Expires In:' + expires_in);

                timeStorage.set('google_access_token', access_token, expires_in);
                if (access_token) {
                    $log.info('Access Token :' + access_token);
                    context.getUserInfo(access_token, def);
                } else {
                    def.reject({error: 'Access Token Not Found'});
                }
            });
        };

        service.startLogin = function () {
            var def = $q.defer();
            var promise = this.authorize({
                client_id: this.client_id,
                client_secret: this.secret,
                redirect_uri: this.redirect_url,
                scope: this.scope
            });
            promise.then(function (data) {
                def.resolve(data);
            }, function (data) {
                $log.error(data);
                def.reject(data.error);
            });
            return def.promise;
        };

        service.authNotifyServer = function (access_token, def) {
            console.log('CALLING SERVER TO AUTHENTICATE');
            var http = $http({
                url: 'http://localhost:3000/authenticate',
                method: 'POST',
                params: {
                    access_token: access_token
                }
            });

            // @todo: For success retrieve the user's games (node call) and a template (angular js) and display the list on screen
            // For failure show a message. remove the token from the clientside and display the login screen

            http.then(function (data) {
                $log.debug(data);


                // DECLARE THE VAR BELOW SOMEWHERE!!

                // Set the currenUser in the scope so universally available
                currentUser = data.data;


                console.log('CALLING service.getGames');


                // PUT STUFF BELOW INTO FUNCTIONS

                // Retrieve the user's games
                service.getGames(def);


                // Get the template to display the games
                // Populate the template with the games


                // **** NOTE: I think the getGames service needs to be all hooked up to controllers then does
                // all the population automatically - see the ionic documentation



                def.resolve(data);
            }, function (data) {
                $log.error(data);
                def.reject(data.error);
            });
            return def.promise;
        };


        service.getGames = function (def) {
            //var def = $q.defer();

            console.log('CALLING SERVER TO GET GAMES');
            var http = $http({
                url: 'http://localhost:3000/api/games',
                method: 'GET',
                params: {
                    access_token: this.access_token
                }
            });

            // Need error handler too

            http.then(function (data) {
                console.log('Games List:');
                console.log(data);

                // Get the games list template


                // NEED TO WORK OUT HOW TO DO THE IONIC ROUTING AND TEMPLATING!!

                // @todo: NEXT see http://www.metaltoad.com/blog/angularjs-promises-from-service-to-template for how to
                // get the promise/template/date stuff working properly
                // Is this the place to call the template? How is this done?? Work out the correct architecture to achieve this!



                // Data gets passed back up the chain
                def.resolve(data);

            }, function (data) {
                $log.error(data);
                def.reject(data.error);
            });
            return def.promise;
        };







        return service;
    }
]);