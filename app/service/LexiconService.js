/**
 * Created by ivar on 15.01.16.
 */

define([
    'angularAMD'
], function (angularAMD) {

    angularAMD.service('service/LexiconService', [ '$rootScope', '$log', '$state', '$sessionStorage', '$q', 'wnwbApi',
        function($rootScope, $log, $state, $sessionStorage, $q, wnwbApi) {
            var self = this;

            var lexicons = null;
            var lexiconMap = {};
            var workingLexicon = null;

            var deferred = $q.defer();

            this.init = function ( callback ) {
                wnwbApi.Lexicon.query(function (data) {
                    deferred.resolve(data);

                    lexicons = data;

                    angular.forEach(lexicons, function (value, key) {
                        lexiconMap[value.id] = value;
                    });

                    workingLexicon = lexiconMap[$sessionStorage.workingLexiconId];

                    $rootScope.$broadcast('workingLexiconChanged', workingLexicon);

                    callback(deferred.promise);
                });
            };

            this.getLexicons = function () {
                return deferred.promise;
            };

            this.getWorkingLexicon = function () {
                return workingLexicon;
            };

            this.setWorkingLexicon = function (lexicon) {
                workingLexicon = lexiconMap[lexicon.id];
                $sessionStorage.workingLexiconId = workingLexicon.id;
                $rootScope.$broadcast('workingLexiconChanged', workingLexicon);
                $state.go('home');
            };

            this.setWorkingLexiconId = function (lexiconId) {
                workingLexicon = lexiconMap[lexiconId];
                $sessionStorage.workingLexiconId = workingLexicon.id;
                $rootScope.$broadcast('workingLexiconChanged', workingLexicon);
            };

        }
    ]);
});