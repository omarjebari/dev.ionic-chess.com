// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'GoogleLoginService'])
//angular.module('starter', ['ionic', 'GoogleLoginService', 'GameService'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {


            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)

            
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    })

    // This controller gets bound in index.html
    .controller('google', function ($scope, googleLogin) {
    //.controller('google', function ($scope, googleLogin, game) {


            // Define google_data and bind it into the scope (this gets output in index.html)
        $scope.google_data = {};

        // This function gets called when the user presses the 'Login Via Google' button
        $scope.login = function () {

            // This kicks off a cascade of calls which ultimately result in the data being returned to $scope.google_data
            // which is output in index.html and auto updated (note this happens anywhere that it is bound)
            var promise = googleLogin.startLogin();
            promise.then(function (data) {


                // @todo: Might be more transparent if call getGames here instead of at the end of startLogin() chain of calls!
                // googleLogin.access_token
                //googleLogin.getGames();
                //game.getGames();


                $scope.google_data = data;
            }, function (data) {
                $scope.google_data = data;
            });
        }
    });
