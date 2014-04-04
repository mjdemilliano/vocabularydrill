/* ng-FitText.js v1.0.2
 * https://github.com/patrickmarabeas/ng-FitText.js
 *
 * Original jQuery project: https://github.com/davatron5000/FitText.js
 *
 * Copyright 2013, Patrick Marabeas http://pulse-dev.com
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 *
 * Date: 18/11/2013
 */

String.prototype.width = function(font) {
  var f = font || '12px arial',
      o = $('<div>' + this + '</div>')
            .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
            .appendTo($('body')),
      w = o.width();

  o.remove();

  return w;
}

angular.module( 'ngFitText', [] )
.directive( 'fittext', [ function() {
	return {
		restrict: 'A',
		scope: true,
		transclude: true,
		replace: true,
		template: function( element, attrs ) {
			var tag = element[0].nodeName;
			return "<"+tag+" data-ng-transclude data-ng-style='{fontSize:fontSize}'></"+tag+">";
		},
		link: function( scope, element, attrs ) {
			scope.compressor = attrs.fittext || 1;
			scope.minFontSize = attrs.fittextMin || Number.NEGATIVE_INFINITY;
			scope.maxFontSize = attrs.fittextMax || Number.POSITIVE_INFINITY;

			var resizer = function(text) {
                var blockContents = text || element[0].innerText;
                scope.fontSize = Math.max(
                    Math.min(
                        scope.compressor * 12 * window.innerWidth / blockContents.width(),
                        parseFloat(scope.maxFontSize)
                    ),
                    parseFloat(scope.minFontSize)
                ) + 'px';
                console.log(blockContents, blockContents.width(), scope.fontSize, scope.minFontSize, scope.maxFontSize);
			};

			angular.element( document ).ready( function() {
				resizer();
                scope.$on('changedword', function(event, text) { resizer(text); });
			});

			angular.element( window ).bind( 'resize', function() {
				scope.$apply(resizer);
			});

		}
	}
}]);
