(function() {
  'use strict';

  angular.module('ez.list').directive('ezListItem', ['Draggable', '$compile', function(Draggable, $compile) {
    return {
      restrict: 'C',
      link: function (scope, $element) {
        var element = $element[0];

        if (scope.options.transclude) {
          // add transcluded item content
          scope.options.transclude(scope, function(clone) {
            angular.element(element.children[0].children[0]).append(clone);
          });
        }

        $element.on(interact.supportsTouch ? 'touchstart' : 'mousedown', function(e) {
          if (scope.options.allowDrag === true || (typeof scope.options.allowDrag === 'function' && scope.options.allowDrag(e, scope.item))) {
            Draggable.init(e, scope);
          }
        });

        if (!scope.item.hasOwnProperty('collapsed')) {
          scope.item[scope.options.collapsedField] = scope.options.collapsed;
        }

        scope.$watchCollection('item.' + scope.options.childrenField, function(newVal) {
          scope.hasItems = newVal && newVal.length;
        });

        scope.remove = function() {
          scope.$parent.$parent.item[scope.options.childrenField].splice(scope.$parent.$parent.item[scope.options.childrenField].indexOf(scope.item), 1);
        };

        scope.$on('$destroy', function() {
          Draggable.unsetDropzone($element[0]);
        });

      }
    };
  }]);

})();
