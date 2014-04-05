var vocabularyDrillApp = angular.module('vocabularyDrillApp', ['vocabularyServices', 'ngFitText']);
var DELAY_ADVANCE = 1000;

vocabularyDrillApp.controller('SessionCtrl', ['$scope',
    function($scope) {
        $scope.currentSection = '';
        $scope.words = [];
        $scope.selectedWord = '';   // Selected word in the foreign language.
        $scope.showingAnswer = false;

        // Note: have to use a method here, because in a direct assignment only the local scope gets changed.
        $scope.setWords = function(words) {
            $scope.words = words;
        }

        $scope.setSelectedWord = function(word) {
            $scope.selectedWord = word;
        };

        $scope.needNewQuestion = function() {
            $scope.$broadcast('need-new-question');
        };

        $scope.setShowingAnswer = function(showingAnswer) {
            $scope.showingAnswer = showingAnswer;
        };

        $scope.$on('feedback-recorded', function() {
            $scope.$broadcast('need-new-question');
        });
    }
]);

vocabularyDrillApp.controller('VocabularyCtrl', ['$scope', 'Vocabulary',
    function($scope, Vocabulary) {
        $scope.vocabulary = Vocabulary.query();

        $scope.selectSection = function(section) {
            $scope.currentSection = section;
            // Note: have to use a method here, because in a direct assignment only the local scope gets changed.
            $scope.setWords($scope.vocabulary[section]);
        };
    }
]);

vocabularyDrillApp.controller('FlashCardCtrl', ['$rootScope', '$scope', '$timeout',
    function FlashCardCtrl($rootScope, $scope, $timeout) {
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
            $scope.setShowingAnswer(false);
            $scope.word = $scope.words[index];
            $scope.question = Math.random() < 0.5 ? 0 : 1;
            $scope.show = $scope.question;
            $scope.setSelectedWord($scope.word[0]); // 0: foreign language.
            $scope.$broadcast('changedword', $scope.word[$scope.show]);
        };

        $scope.pressedWord = function() {
            if ($scope.showingQuestion) {
                // Show answer.
                $scope.showingQuestion = false;
                $scope.show = 1 - $scope.show;
                $scope.$emit('changedword', $scope.word[$scope.show]);
                $scope.setShowingAnswer(true);
            }
        };

        $scope.$watch('words', function() {
            if ($scope.words.length > 0) {
                $scope.newQuestion();
            }
        });

        $scope.$on('need-new-question', function(event) {
            $scope.newQuestion();
        });
    }
]);

vocabularyDrillApp.controller('FeedbackCtrl', ['$rootScope', '$scope', 'Feedback',
    function FeedbackCtrl($rootScope, $scope, Feedback) {
        $scope.enabled = false;
        $scope.feedback = function(wasCorrect) {
            $scope.enabled = false;
            $scope.$emit('feedback-recorded');
            Feedback.recordFeedback($scope.selectedWord, wasCorrect);
        }
        $scope.$watch('showingAnswer', function(showingAnswer) {
            if (showingAnswer) {
                $scope.enabled = true;
            }
        });
    }
]);

vocabularyDrillApp.controller('WordStatusCtrl', ['$scope', 'Feedback',
    function WordStatusCtrl($scope, Feedback) {
        $scope.wordStatus = [];

        $scope.$watch('words', function() {
            $scope.wordStatus = $scope.words.map(function(word) {
                // word is a 2-tuple
                var historyForWord = Feedback.historyForWord(word[0]);
                return {
                    word: word[0],
                    correct: historyForWord.filter(
                        function(item) {
                            return item.wasCorrect;
                        }).length,
                    wrong: historyForWord.filter(
                        function(item) {
                            return !item.wasCorrect;
                        }).length
                }
            });
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

vocabularyServices.factory('Feedback',
    function() {
        var history = (function() {
            var historyItems = [];
            return {
                get: function() {
                    if (historyItems.length === 0) {
                        // Read history from localstorage.
                        for (item in localStorage) {
                            if (/^vocabulary\.feedback\./.test(item)) {
                                historyItems.push(JSON.parse(localStorage[item]));
                            }
                        }
                    }
                    return historyItems;
                }
            };
        })();
        var historyForWord = function(word) {
            return history.get().filter(function(item) {
                return item.word === word;
            });
        };
        return {
            recordFeedback: function(word, wasCorrect) {
                var now = new Date();
                localStorage.setItem('vocabulary.feedback.' + now.getTime(), JSON.stringify({time: now, word: word, wasCorrect: wasCorrect}));
            },
            historyForWord: historyForWord
        };
    }
);

