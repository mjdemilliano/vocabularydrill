var vocabularyDrillApp = angular.module('vocabularyDrillApp', ['vocabularyServices', 'ngFitText']);
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

        $scope.hasWord = function() {
            return $scope.word !== undefined && $scope.word.length > 0;
        };
        $scope.newQuestion = function() {
            var index = Math.floor(Math.random() * $scope.words.length);
            $scope.showingQuestion = true;
            $scope.word = $scope.words[index];
            $scope.question = Math.random() < 0.5 ? 0 : 1;
            $scope.show = $scope.question;
            $scope.$broadcast('changedword', $scope.word[$scope.show]);
        };

        $scope.pressedWord = function() {
            if ($scope.showingQuestion) {
                // Show answer.
                $scope.showingQuestion = false;
                $scope.show = 1 - $scope.show;
                $rootScope.$broadcast('changedword', $scope.word[$scope.show]);
                $rootScope.$broadcast('showinganswer', $scope.word[$scope.show]);
            }
        };

        $rootScope.$on('selectedSection', function(event, section, words) {
            $scope.section = section;
            $scope.words = words;
            $scope.newQuestion();
        });

        $rootScope.$on('need-new-question', function(event) {
            $scope.newQuestion();
        });
    }
]);

vocabularyDrillApp.controller('FeedbackCtrl', ['$rootScope', '$scope',
    function FeedbackCtrl($rootScope, $scope) {
        $scope.word = undefined;
        $scope.enabled = false;
        $scope.feedback = function(wasCorrect) {
            $scope.enabled = false;
            $rootScope.$broadcast('need-new-question');
            $scope.recordFeedback($scope.word, wasCorrect);
        }
        $scope.recordFeedback = function(word, wasCorrect) {
            var now = new Date();
            localStorage.setItem('vocabulary.feedback.' + now.getTime(), JSON.stringify({word: word, wasCorrect: wasCorrect}));
        };
        $rootScope.$on('showinganswer', function(event, word) {
            $scope.word = word;
            $scope.enabled = true;
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
