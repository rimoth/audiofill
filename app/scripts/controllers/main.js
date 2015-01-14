'use strict';

/**
 * @ngdoc function
 * @name audiofillApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the audiofillApp
 */
var app = angular.module('audiofillApp'),
    apiKey = '0225337d85a3527f62382233f29e3c14',
    apiUrl = 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks',
    refreshInterval = 30
    ;
    
app.service('dataService', function($http) {
    delete $http.defaults.headers.common['X-Requested-With'];
    this.getData = function() {
        // $http() returns a $promise that we can add handlers with .then()
        return $http({
            method: 'JSONP',
            url: apiUrl,
            params:{
                'user': 'bbc6music',
                'api_key' : apiKey,
                'format': 'json',
                'callback': 'JSON_CALLBACK'
            }
         });
    };
});

app.controller('MainCtrl', function ($scope, dataService, $interval) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    $scope.seconds = 0;
    $scope.currentTrack ='';
    $scope.currentArtist='';
    $scope.currentImageRef='';
    $scope.currentStartSecs = '';
    $interval(function(){incrementCounter();},1000);
    $interval(function(){refreshStream();},refreshInterval*1000);

    dataService.getData().then(function(dataResponse) {
        
        var t = [];
        // Probably not efficient duplicating the data response. Is there a way to do a reference?
        t=dataResponse.data.recenttracks;

        $scope.currentTrack= t.track[0].name;
        $scope.currentArtist= t.track[0].artist['#text'];
        $scope.currentImageRef=t.track[0].image[2]['#text'];
        
        // Inspect first track and see if it is a 'now playing' entry. (@attr.nowplaying)
        // If now playing then first two entries in the response refer to the same track.
        var t1 =[];
        var startPos=0;
        var len=10;
        t1 = t.track[0];
        if(t1.hasOwnProperty('@attr')){ // Checking for 'nowplaying' didn't work - maybe object within object
            //OK Let's ignore the first entry and pick up the scrobbled time from the second entry
            startPos=1;
            len=11;
            $scope.currentStartSecs=t.track[1].date.uts;
        } else {
            $scope.currentStartSecs=t.track[0].date.uts;
        }

        // Build List of Scrobbled Tracks.
        $scope.tracks = [];
        for (var i = startPos; i < len; i++) {
            $scope.tracks.push({
                name: t.track[i].name,
                artist: t.track[i].artist['#text'],
                image: t.track[i].image[0]['#text'],
                date: ((i === 0) ? 0 : t.track[i].date.uts),
                scrobbled: 'false'
            });
        }        
    });

    var incrementCounter = function() {
        $scope.seconds++;
    };
    var refreshStream = function() {
        $scope.seconds=0; /* Reset Counter */
        dataService.getData().then(function(dataResponse) {
            // Has the track name or artist name changed?
            var t1 =[];
            t1= dataResponse.data.recenttracks.track[0];
            if ($scope.currentTrack!==t1.name || $scope.currentArtist!==t1.artist['#text'])
            {
                // Update Now Playing and add to the play history
                //$scope.tracks = dataResponse.data.recenttracks;
                $scope.currentTrack= t1.name;
                $scope.currentArtist= t1.artist['#text'];
                $scope.currentImageRef=t1.image[2]['#text'];
                if ($scope.currentImageRef.length === 0){
                    // Need to do some work here to use alternative image
                    $scope.currentImageRef='images/yeoman.png';
                }
                if(t1.hasOwnProperty('@attr')){ // This is now playting entry
                    $scope.currentStartSecs=dataResponse.data.recenttracks.track[1].date.uts;
                } else {
                    $scope.currentStartSecs=t1.date.uts;
                }
                // Add new track to play history.
                $scope.tracks.unshift({
                    name: t1.name,
                    artist: t1.artist['#text'],
                    image: t1.image[0]['#text'],
                    date: $scope.currentStartSecs,
                    scrobbled: 'false'
                });

                // Should we scrobble the track?
                

                /* Let's assume the track last's for at least 2 mins */
                refreshInterval=90;
            } else {
                refreshInterval=30;
            }
            /* Need to reset interval */
            /*$interval(function(){refreshStream();},refreshInterval*1000);*/

        });

    };







  });
