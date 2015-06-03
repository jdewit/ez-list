(function() {
  'use strict';

  angular.module('ez.list').directive('ezListItemContent', ['EzListDraggable', function(Draggable) {
    return {
      restrict: 'C',
      link: function (scope, $element) {
        var element = $element[0];

        $element.parent().parent().data('scope', scope);

        if (scope.options.allowDrag === true || (typeof scope.options.allowDrag === 'function' && scope.options.allowDrag(scope.item))) {
          Draggable.initDragItem(element, scope);
        }

        scope.item._parentItem = scope.$parent.$parent.item;

        if (scope.options.transclude) {
          // add transcluded item content
          scope.options.transclude(scope, function(clone) {
            $element.append(clone);
          });
        }

        var recurseParents = function(item) {
          if (item.hasOwnProperty('_parentItem')) {
            recurseParents(item._parentItem);
          }

          item._active = true;
        };

        var setSelected = function() {
          if (!scope.selectedItems) {
            return;
          }

          if (Array.isArray(scope.selectedItems)) {
            if ($.grep(scope.selectedItems, function(item) {
              if (typeof item === 'string') {
                return scope.item[scope.options.idField] === item ? true : false;
              } else {
                return !!item && item[scope.options.idField] === scope.item[scope.options.idField] ? true : false;
              }
            }).length) {
              scope.item._selected = true;
              recurseParents(scope.item, true);
            }
          } else if (typeof scope.selectedItems === 'string' && scope.selectedItems === scope.item[scope.options.idField]) {
              scope.item._selected = true;
              recurseParents(scope.item, true);
          } else if (scope.selectedItems[scope.options.idField] === scope.item[scope.options.idField]) {
              scope.item._selected = true;
              recurseParents(scope.item, true);
          }
        };

        if (!scope.item.hasOwnProperty('collapsed')) {
          scope.item[scope.options.collapsedField] = scope.options.collapsed;
        }

        scope.$watchCollection('item.' + scope.options.childrenField, function(newVal) {
          scope.hasItems = newVal && newVal.length;
        });

        scope.remove = function() {
          scope.$parent.$parent.item[scope.options.childrenField].splice(scope.$parent.$parent.item[scope.options.childrenField].indexOf(scope.item), 1);
        };

        scope.$on('ez_list.selected_changed', function() {
          delete scope.item._active;
          delete scope.item._selected;
          setSelected();
        });

        // init
        setSelected();
      }
    };
  }]);

})();
