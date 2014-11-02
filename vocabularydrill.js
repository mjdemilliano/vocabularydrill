var vocabularyDrillApp = angular.module('vocabularyDrillApp', ['vocabularyServices', 'ngFitText', 'dangle']);
var DELAY_ADVANCE = 1000;

vocabularyDrillApp.controller('SessionCtrl', ['$scope', 'Feedback',
    function($scope, Feedback) {
        $scope.currentSection = '';
        $scope.words = [];
        $scope.word = undefined;
        $scope.showingAnswer = false;
        $scope.results = undefined;
        
        $scope.setCurrentSection = function(section) {
        	$scope.currentSection = section;
        	$scope.showingAnswer = false;
        };

        // Note: have to use a method here, because in a direct assignment only the local scope gets changed.
        $scope.setWords = function(words) {
            // Assign words array, but add history of each word.
            $scope.words = words.map(function(word) {
                // word is a 2-tuple
                var historyForWord = Feedback.historyForWord(word[0]);
                return {
                    word: word,
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
            $scope.updateProbabilities();
            $scope.updateFacets();
        };

        $scope.updateFacets = function() {
            $scope.results = {
                facets: {
                    SelectionProbability: {
                        _type: 'terms',
                        terms: $scope.words.map(function(word) {
                            return {term: word.word[0], count: word.selectionProbability };
                        })
                    }
                }
            };
        };

        $scope.updateProbabilities = function() {
            // Compute selection probability, which is equal to the ratio of wrong vs correct, but it is 1 if no attempt has been made yet for this word.
            $scope.words.map(function(word) {
                var totalAttempts = word.wrong + word.correct;
                word.selectionProbability = totalAttempts > 3 ? (word.wrong / (word.wrong + word.correct) + 0.1) : 1;   
                        // 3: if not asked 3 times then high chance of selecting, only from that point on do we take into account the number of wrong/correct.
                        // 0.1: always a small chance of selecting this word.
            });
            // Normalize PDF by summing all values...
            var probabilitySum = $scope.words.map(function(word) {
                    return word.selectionProbability;
                }).reduce(function(a, b) {
                    return a + b;
                });
            // then set PDF to selection probability divided by the sum of individual probabilities to normalize the PDF.
            // The CDF is the cumulative sum of the PDF.
            var currentCDF = 0.0;
            $scope.words.map(function(word) {
                word.pdf = word.selectionProbability / probabilitySum;
                word.cdf = currentCDF;
                currentCDF += word.pdf;
            });
        };

        $scope.setWord = function(word) {
            $scope.word = word;
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

vocabularyDrillApp.controller('VocabularyCtrl', ['$scope', 'Vocabulary', 'Feedback', 'VocabularyProgress',
    function($scope, Vocabulary, Feedback, VocabularyProgress) {
        $scope.vocabulary = Vocabulary.query();
        $scope.vocabularyProgress = VocabularyProgress.lessons;
		$scope.expanded = true;
       
        $scope.selectSection = function(section) {
            $scope.setCurrentSection(section);
            // Note: have to use a method here, because in a direct assignment only the local scope gets changed.
            $scope.setWords($scope.vocabulary[section]);
            $scope.expanded = false;
        };
        
        $scope.toggle = function() {
        	$scope.expanded = ! $scope.expanded;
		};
	}
]);

vocabularyDrillApp.controller('FlashCardCtrl', ['$scope', '$timeout',
    function FlashCardCtrl($scope, $timeout) {
        $scope.question = 0;
        $scope.show = 0;
        $scope.showingQuestion = true;

        $scope.hasWord = function() {
            return $scope.word !== undefined && $scope.word.word.length > 0;
        };

        $scope.newQuestion = function() {
            $scope.showingQuestion = true;
            $scope.setShowingAnswer(false);
            // Take a sample of the distribution formed by the word statistics.
            // The sample is taken by taking a random number between 0 and 1, then finding the highest word index for which the CDF is smaller than this value.
            var randomCDF = Math.random();   // Random value between 0 and 1.
            var selectedWord;
            // Find word with highest CDF that is lower than the random CDF.
            $scope.words.map(function(word) {
                if (word.cdf < randomCDF && (!selectedWord || word.cdf > selectedWord.cdf)) {
                    selectedWord = word;
                }
            });
            $scope.setWord(selectedWord);
            $scope.question = Math.random() < 0.5 ? 0 : 1;
            $scope.show = $scope.question;
            $scope.$broadcast('changedword', $scope.word.word[$scope.show]);
        };

        $scope.pressedWord = function() {
            if ($scope.showingQuestion) {
                // Show answer.
                $scope.showingQuestion = false;
                $scope.show = 1 - $scope.show;
                $scope.$emit('changedword', $scope.word.word[$scope.show]);
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

vocabularyDrillApp.controller('FeedbackCtrl', ['$scope', 'Feedback',
    function FeedbackCtrl($scope, Feedback) {
        $scope.enabled = false;
        $scope.feedback = function(wasCorrect) {
            $scope.enabled = false;
            Feedback.recordFeedback($scope.word.word[0], wasCorrect);
            if (wasCorrect) {
                $scope.word.correct += 1;
            } else {
                $scope.word.wrong += 1;
            }
            $scope.updateProbabilities();
            $scope.updateFacets();
            $scope.$emit('feedback-recorded');
        }
        $scope.$watch('showingAnswer', function(showingAnswer) {
            $scope.enabled = showingAnswer;
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

vocabularyServices.factory('VocabularyProgress', ['Vocabulary', 'Feedback',
	function($vocabulary, $feedback) {
		var lessons = [];
		$vocabulary.query(function(vocabulary) {
			angular.forEach(vocabulary, function(words, lesson) {
				// Get history for each lesson.
				// The $resource class has additional properties starting with "$", so we need
				// to ignore those.
				if (lesson[0] === '$') {
					return;
				}
				var runningStatus = {
					numberOfWords: words.length,
					numberCorrect: 0,
					numberWrong: 0,
					numberOfRecords: 0,
					score: 0,
					updateWithResult: function(numberOfTries, timesCorrect) {
						this.numberOfRecords += numberOfTries;
						this.numberCorrect += timesCorrect;
						/*                 /   #correct     #tries   \
						 * score = minimum |  ---------- , --------  |
						 *                 \    #tries      #words   /
						 */
						var score1 = this.numberOfRecords > 0 ? 100.0 * this.numberCorrect / this.numberOfRecords : 0;
						var score2 = this.numberOfWords > 0 ? 100.0 * this.numberOfRecords / this.numberOfWords : 0;
						this.score = Math.min(score1, score2);
						console.log(this);
					}
				};
				angular.forEach(words, function(wordPair) {
					var history = $feedback.historyForWord(wordPair[0]);
					var timesCorrect = history.filter(function(wordHistory) {
						return wordHistory.wasCorrect;
					}).length;
					var numberOfTries = history.length;
					runningStatus.updateWithResult(numberOfTries, timesCorrect);
				});
				lessons[lesson] = {
					name: lesson,
					status: runningStatus
				};				
			});
		});
		return {
			lessons: lessons
		};
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

