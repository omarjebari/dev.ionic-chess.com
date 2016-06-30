var gameService = angular.module('gameService', ['GoogleLoginService']);

/**
 * Note that $q (below) is a service that helps you run functions asynchronously,
 * and use their return values (or exceptions) when they are done processing
 */
gameService.factory('game', [
    '$http', '$q', '$interval', '$log', '$googleLogin'
    function ($http, $q, $interval, $log, googleLogin) {

        var currentUser = googleLogin.currentUser;

        var service = {};
        service.access_token = googleLogin.access_token;

        service.getGames = function () {
            var def = $q.defer();

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
                // get the promise/template/date stuff working prperly




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