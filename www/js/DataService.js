/**
 * Created by dinhquangtrung on 1/22/15.
 */
function mapXML(badJson) {
    var movies = [];
    for (var i = 0; i < badJson.movies.movie.length; i++) {
        var obj = badJson.movies.movie[i];
        var movie = {
            name                :    obj.name            && obj.name.__cnt            == undefined ? obj.name : "",
            description         :    obj.description     && obj.description.__cnt     == undefined ? obj.description : "",
            poster              :    obj.poster          && obj.poster.__cnt          == undefined ? obj.poster : "",
            trailer             :    obj.trailer         && obj.trailer.__cnt         == undefined ? obj.trailer : "",
            show_date           :    obj.show_date       && obj.show_date.__cnt       == undefined ? obj.show_date : "",
            length              :    obj.length          && obj.length.__cnt          == undefined ? obj.length : "",
            genre               :    obj.genre           && obj.genre.__cnt           == undefined ? obj.genre : "",
            director            :    obj.director        && obj.director.__cnt        == undefined ? obj.director : "",
            actor               :    obj.actor           && obj.actor.__cnt           == undefined ? obj.actor : "",
            age_restriction     :    obj.age_restriction && obj.age_restriction.__cnt == undefined ? obj.age_restriction : "",
            audio_type          :    obj.audio_type      && obj.audio_type.__cnt      == undefined ? obj.audio_type : "",
            video_type          :    obj.video_type      && obj.video_type.__cnt      == undefined ? obj.video_type : "",
            sessions: []
        };

        for (var j = 0; j < obj.sessions.session.length; j++) {
            var obj2 = obj.sessions.session[j];
            var session = {
                show_time: obj2.show_time.__cnt == undefined ? obj2.show_time : "",
                theater: {
                    cinema:         obj2.theater.cinema      && obj2.theater.cinema.__cnt       == undefined ? obj2.theater.cinema : "",
                    name:           obj2.theater.name        && obj2.theater.name.__cnt         == undefined ? obj2.theater.name : "",
                    description:    obj2.theater.description && obj2.theater.description.__cnt  == undefined ? obj2.theater.description : "",
                    city:           obj2.theater.city        && obj2.theater.city.__cnt         == undefined ? obj2.theater.city : "",
                    address:        obj2.theater.address     && obj2.theater.address.__cnt      == undefined ? obj2.theater.address : "",
                    map_link:       obj2.theater.map_link    && obj2.theater.map_link.__cnt     == undefined ? obj2.theater.map_link : "",
                    image:          obj2.theater.image       && obj2.theater.image.__cnt        == undefined ? obj2.theater.image : ""
                }
            };
            movie.sessions.push(session);
        }
        movies.push(movie);
    }
    return movies;
}
angular.module('app').service('DataService', function($q, $http) {
    var self = this;
    var CITY_KEY = 'movie-showtimes-city';
    var API_SOURCE = 'http://jbossews-trungdq88.rhcloud.com/API/getMovies?city=' + localStorage[CITY_KEY] || "";
    var pData = $http.get(API_SOURCE)
            .then(function(payload) {
                var result = x2js.xml_str2json(payload.data);
                return mapXML(result);
            });
    this.getMovies = function () {
        return pData;
    };
    this.getTheaters = function () {
        return this.getMovies().then(function (movies) {
            var theaterArrays = movies.map(function (movie) {
                return movie.sessions.map(function (session) {
                    return session.theater;
                });
            });

            //Flatten
            var theaters = [];
            for (var i = 0; i < theaterArrays.length; i++) {
                theaters = theaters.concat(theaterArrays[i]);
            }

            // Remove duplicate and sort
            theaters = uniqBy(theaters, function (theater) {
                return theater.name;
            });

            // Add sessions
            for (i = 0; i < theaters.length; i++) {
                var currentTheater = theaters[i];
                currentTheater.sessions = [];
                // Loop through movies
                for (var k = 0; k < movies.length; k++) {
                    // Get all sessions of each movies
                    // In Array(Session), filter all the session of current theater
                    var _sessions = movies[k].sessions.filter(function (session) {
                        return session.theater.name == currentTheater.name;
                    });
                    // Sessions in _sessions are currently missing `movie` property, add it now
                    for (var j = 0; j < _sessions.length; j++) {
                        _sessions[j].movie = movies[k].name;
                    }
                    // And add to current theater's sessions
                    currentTheater.sessions = currentTheater.sessions.concat(_sessions);
                }
            }


            return theaters;
        })
    };
    this.getCities = function () {
        return $q(function (resolve, reject) {
            resolve([
                'Hồ Chí Minh',
                'Hà Nội',
                'Hải Phòng',
                'Đà Nẵng',
                'Thừa Thiên Huế'
            ]);
        });
    };
    this.getCinemas = function () {
        return this.getMovies().then(function (movies) {
            var cinemaNamesArrays = movies.map(function (movie) {
                return movie.sessions.map(function (session) {
                    return session.theater.cinema;
                });
            });
            var cinemaNames = [];
            for (var i = 0; i < cinemaNamesArrays.length; i++) {
                cinemaNames = cinemaNames.concat(cinemaNamesArrays[i]);
            }
            return cinemaNames.filter(function (cinemaName, index) { // Remove duplicate
                return cinemaNames.indexOf(cinemaName) == index;
            });
        });
    };
    this.getTheaterNames = function () {
        return this.getTheaters().then(function (theaters) {
            var names = theaters.map(function (o) {
                return o.name;
            });
            return names.filter(function(item, pos) { // Remove duplicate items
                return names.indexOf(item) == pos;
            });
        });
    };
    this.setCity = function (city) {
        localStorage[CITY_KEY] = city;
    };
    this.getCurrentCity = function () {
        return localStorage[CITY_KEY];
    };
    this.getMovie = function (movieName) {
        return self.getMovies().then(function (movies) {
            var result = movies.filter(function (movie) {
                return movie.name == movieName;
            });
            if (result.length) {
                // If there is a duplicate id movies, return the first one
                return result[0];
            } else {
                return $q.reject('Không tìm thấy phim');
            }
        });
    };
    this.getTheater = function (theaterName) {
        return self.getTheaters().then(function (theaters) {
            var result = theaters.filter(function (theater) {
                return theater.name == theaterName;
            });
            if (result.length) {
                // If there is a duplicate id theaters, return the first one
                return result[0];
            } else {
                return $q.reject('Không tìm thấy rạp');
            }
        });
    };
});