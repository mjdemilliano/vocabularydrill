var vocabularyDrillApp = angular.module('vocabularyDrillApp', ['vocabularyServices']);
var DELAY_ADVANCE = 1000;

vocabularyDrillApp.controller('VocabularyCtrl', ['$rootScope', '$scope', 'Vocabulary',
    function($rootScope, $scope, Vocabulary) {
        $scope.vocabulary = Vocabulary.query();
        $scope.currentSection = '';

        $scope.selectSection = function(section, words) {
            $scope.currentSection = section;
            $rootScope.$broadcast('selectedSection', section, words);
        };
    }
]);

vocabularyDrillApp.controller('FlashCardCtrl', ['$rootScope', '$scope', '$timeout',
    function FlashCardCtrl($rootScope, $scope, $timeout) {
        $scope.section = '';
        $scope.words = [];
        $scope.word = [];
        $scope.question = 0;
        $scope.show = 0;
        $scope.showingQuestion = true;

        $scope.newQuestion = function() {
            var index = Math.floor(Math.random() * $scope.words.length);
            $scope.showingQuestion = true;
            $scope.word = $scope.words[index];
            $scope.question = Math.random() < 0.5 ? 0 : 1;
        };

        $scope.pressedWord = function() {
            if ($scope.showingQuestion) {
                // Show answer.
                $scope.showingQuestion = false;
                $scope.show = 1 - $scope.show;
                $timeout(function() {
                    $scope.newQuestion();
                }, DELAY_ADVANCE);
            }
        };

        $rootScope.$on('selectedSection', function(event, section, words) {
            $scope.section = section;
            $scope.words = words;
            $scope.newQuestion();
        });
    }
]);

var vocabularyServices = angular.module('vocabularyServices', ['ngResource']);

vocabularyServices.factory('Vocabulary', ['$resource',
    function($resource) {
        return $resource('woordenlijst.json', {}, {
            query: {method: 'GET'}
        });
    }
]);

