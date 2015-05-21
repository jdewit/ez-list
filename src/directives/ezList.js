(function() {
  'use strict';

  angular.module('ez.list').directive('ezList', ['EzListConfig', 'Draggable', function(EzListConfig, Draggable) {
    return {
      restrict: 'A',
      replace: true,
      transclude: true,
      scope: {
        item: '=?ezList',
        config: '=?',
        api: '=?',
        selectedItems: '=?'
      },
      template: '<div class="ez-list" ng-class="{\'ez-list-draggable\': options.allowDrag, \'ez-list-dropable\': options.mode == \'drop\', \'ez-no-placeholder\': !options.showPlaceholder, \'ez-droponly\': options.dropOnly, \'ez-list-empty\': !hasItems}">' +
        '<ul class="ez-list-items">' +
          '<li class="ez-list-item" ng-repeat="item in item[options.childrenField]" ng-include="\'ez-list-tpl.html\'"></li>' +
        '</ul>' +
        '</div>',
      link: function(scope, $element, attrs, ctrl, transclude) {
        scope.options = angular.extend({}, EzListConfig, scope.config);

        // give child items access to the transclude
        scope.options.transclude = transclude;

        scope.depth = 0;

        for (var k in scope.options.transcludeMethods) {
          scope[k] = scope.options.transcludeMethods[k];
        }

        var element = $element[0];

        if (scope.options.mode === 'drop') {
          scope.options.allowNesting = false;
          scope.options.openOnSlide = false;
          scope.options.showPlaceholder = false;
        }

        scope.$watch('selectedItems', function(newVal, oldVal) {
          if (newVal !== oldVal) {
            scope.$broadcast('ez_list.selected_changed');
          }
        });

        if (!scope.item) {
          scope.item = {};
          scope.hasItems = false;

          $element.addClass('has-dropzone');
          Draggable.setDropzone(element, scope.options);
        } else {
          scope.$watchCollection('item.' + scope.options.childrenField, function(newVal) {
            scope.hasItems = newVal && newVal.length;

            if (newVal && newVal.length > 0 && $element.hasClass('has-dropzone')) {
              $element.removeClass('has-dropzone');
              Draggable.unsetDropzone(element);
            }

            if (!newVal && !$element.hasClass('has-dropzone')) {
              $element.addClass('has-dropzone');
              Draggable.setDropzone(element, scope.options);
            }
          });
        }

        var getChildren = function(item) {
          var data = [];
          var _child;

          if (!!item[scope.options.childrenField]) {
            item[scope.options.childrenField].forEach(function(child) {
              _child = angular.copy(child);
              delete _child._parentItem;
              delete _child._selected;
              delete _child._active;
              delete _child[scope.options.collapsedField];

              if (!!_child[scope.options.childrenField]) {
                _child[scope.options.childrenField] = getChildren(_child);
              }

              data.push(_child);
            });
          }

          return data;
        };

        if (!!scope.api) {
          scope.api.getChildren = function() {
            return getChildren(scope.item);
          };
        }

      }
    };
  }]);

})();
