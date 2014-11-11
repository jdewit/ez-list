(function() {
'use strict';

angular.module('ez.list', []);

})();

(function() {
  'use strict';

  angular.module('ez.list').constant('EzListConfig', {
    acceptClass: 'ez-dragging', // item class to accept in dropzones
    listChildrenField: 'items',
    childrenField: 'items',
    collapsedField: 'collapsed',
    showPlaceholder: true, // show placeholder where item will drop
    collapsed: true, // initially item collapsed state
    allowDrag: true, // allow items to be draggable
    allowNesting: true, // allow items to be nested inside one another
    allowInsertion: true, // allow items to be inserted next to one another
    openOnSlide: true, // open an item when a drag item is slid under and to the right
    dropOnly: false, // only allow dragged items to be dropped on 1st level items
    xThreshold: 25, // Amount of drag (in px) required for left - right movement
    yThreshold: 5, // Amount of drag (in px) required for up - down movement
  });

})();

(function() {
  'use strict';

  angular.module('ez.list').directive('ezList', ['EzListConfig', 'Draggable', '$compile', '$templateCache', function(EzListConfig, Draggable, $compile, $templateCache) {
    return {
      restrict: 'A',
      replace: true,
      transclude: true,
      scope: {
        item: '=?ezList',
        config: '=?ezConfig'
      },
      template: '<div class="ez-list" ng-class="{\'ez-list-draggable\': options.allowDrag, \'ez-no-placeholder\': !options.showPlaceholder, \'ez-droponly\': options.dropOnly, \'ez-list-empty\': !hasItems}">' +
        '<ul class="ez-list-items">' +
          '<li class="ez-list-item" ng-repeat="item in item[options.childrenField]" ng-include="\'ez-list-tpl.html\'"></li>' +
        '</ul>' +
        '</div>',
      link: function(scope, $element, attrs, ctrl, transclude) {
        scope.options = angular.extend({}, EzListConfig, scope.config);

        // give child items access to the transclude
        scope.options.transclude = transclude;

        var hasItems;
        var element = $element[0];

        if (scope.options.dropOnly) {
          scope.options.allowInsertion = false;
          scope.options.allowNesting = false;
          scope.options.openOnSlide = false;
          scope.options.showPlaceholder = false;
        }

        if (!scope.item) {
          scope.item = {};
          scope.hasItems = false;

          Draggable.setDropzone(element, scope.options);
        } else {
          scope.$watchCollection('item.' + scope.options.childrenField, function(newVal, oldVal) {
            scope.hasItems = newVal && newVal.length;

            if (oldVal && oldVal.length === 0 && newVal.length > 0) {
              Draggable.unsetDropzone(element);
            }

            if (oldVal && newVal.length === 0) {
              Draggable.setDropzone(element, scope.options);
            }
          });

        }
      }
    };
  }]);

})();

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

        $element.on(interact.supportsTouch() ? 'touchstart' : 'mousedown', function(e) {
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

(function() {
  'use strict';

  /**
   * This service stores references the active dropzone item
   */
  angular.module('ez.list').factory('Draggable', [function() {
    var dragItem,
        dragItemEl,
        $dragItemEl,
        dragList,
        dragListScope,
        dragItemIndex,
        dragContainerEl = angular.element('<ul class="ez-drag-container"></ul>')[0], // drag container element
        placeholderEl = angular.element('<li class="ez-placeholder"></li>')[0], // placeholder element
        dragX = 0, // x coordinate of drag element
        dragY = 0, // y coordinate of drag element
        dragDx = 0,
        dragDy = 0,
        dragMoveX = 0, // number of moves in the x direction
        dragMoveY = 0, // number of moves in the y direction
        dragDirectionX,
        dragDirectionY,
        dropItemEl,
        $dropItemEl,
        dropItem,
        dropList,
        dropInteracts,
        prevDragDirectionX, // which way the item is being dragged ['left', 'right']
        listContainerEl,
        $listContainerEl,
        listContainerScope,
        newListContainerEl,
        hasDragged,
        dragOptions = {};

    return {

      /**
       * Initialize a draggable item
       */
      init: function(e, scope) {
        var self = this;

        if (
          !e.target.hasAttribute('ez-drag-handle') ||
          (typeof e.button !== 'undefined' && e.button !== 0) // disable right click
        ) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        $(document).one(interact.supportsTouch() ? 'touchend' : 'mouseup', function() {
          // allow drag events to finish first
          setTimeout(function() {
            self.destroy();
          });
        });

        $dragItemEl = angular.element(e.target).closest('.ez-list-item');
        dragItemEl = $dragItemEl[0];
        $listContainerEl = $(e.target).closest('.ez-list');
        listContainerEl = $listContainerEl[0];
        listContainerScope = $listContainerEl.isolateScope();

        this.setDropzones();

        dragOptions = listContainerScope.options;
        dragItem = scope.item;
        dragListScope = scope.$parent.$parent;
        dragList = dragListScope.item;
        dragItemIndex = dragList[listContainerScope.options.childrenField].indexOf(dragItem);

        this.initDragContainer();

        // prevent nested items within the dragged item from being accepted by a dropzone
        dragItemEl.classList.add(listContainerScope.options.acceptClass);

        dragItemEl.parentNode.insertBefore(placeholderEl, dragItemEl);

        if (dragContainerEl.parentNode !== listContainerEl) {
          listContainerEl.appendChild(dragContainerEl);
        }

        dragContainerEl.appendChild(dragItemEl);

        listContainerEl.classList.add('ez-drag-origin');
        listContainerEl.classList.add('ez-list-target');

        interact.dynamicDrop(true);

        // make clicked item draggable
        interact(dragItemEl).draggable({
          onstart: self.start.bind(this),
          onmove: self.move.bind(this),
          onend: self.end.bind(this)
        }).actionChecker(function(e, action) {
          if (typeof e.button !== 'undefined') {
            return e.button === 0 ? action : null; // disable right click
          }

          return action;
        });

        // get the drag started
        interact.simulate('drag', dragItemEl, e);

        dragItemEl.classList.add('ez-dragging');

      },

      setDropzones: function() {
        $dragItemEl.find('.ez-list-item-content').removeClass('ez-dropzone');

        dropInteracts = interact('.ez-dropzone').dropzone({
          //accept: '.ez-draggable',
          ondragenter: this.enter.bind(this),
          ondragleave: this.leave.bind(this),
          ondrop: this.drop.bind(this)
        });
      },

      setDropzone: function(el, options) {
        interact(el).dropzone({
          accept: options.accept,
          ondragenter: this.enter.bind(this),
          ondragleave: this.leave.bind(this),
          ondrop: this.drop.bind(this)
        });

      },

      unsetDropzone: function(el) {
        interact(el).dropzone(false);
      },

      unsetDropzones: function() {
        dropInteracts.unset();

        $dragItemEl.find('.ez-list-item-content').addClass('ez-dropzone');
      },

      /**
       * Fires once when an item enters another
       */
      enter: function(e) {
        if (!e.target.hasAttribute('ez-drag-handle')) {
          return;
        }

        if (angular.element(e.target).hasClass('ez-list')) {
          // drop target is an empty list
          newListContainerEl = e.target;
        } else {
          // drop target is a list item
          dropItemEl = e.target.parentNode.parentNode;
          $dropItemEl = angular.element(dropItemEl);
          dropItemEl.classList.add('ez-dragover');

          newListContainerEl = $dropItemEl.closest('.ez-list')[0];
        }

        newListContainerEl.classList.add('ez-list-target');

        if (newListContainerEl === listContainerEl) {
          return;
        }

        // item has been dragged to a new tree
        listContainerEl.classList.remove('ez-list-target');

        listContainerEl = newListContainerEl;
        $listContainerEl = angular.element(listContainerEl);
        listContainerScope = $listContainerEl.isolateScope();

        newListContainerEl = null;
      },

      /**
       * Fires once when an item leaves another
       */
      leave: function(e) {
        if (!e.target.hasAttribute('ez-drag-handle')) {
          return;
        }

        dropItemEl.classList.remove('ez-dragover');

        if ($dropItemEl.hasClass('ez-list')) {
          // drop target was an empty list
          listContainerEl.classList.remove('ez-list-target');
        } else {
          // drop target was a list item

          if (listContainerScope.options.allowInsertion) {
            if (dragDirectionY === 'up') {
              this.moveUp();
            } else {
              this.moveDown();
            }
          }
        }

        dropItemEl = $dropItemEl = null;
      },

      /**
       * Fires when an item is dropped on a dropzone item
       */
      drop: function(e) {
        if (dropItemEl) {
          dropItemEl.classList.remove('ez-dragover');
        }

        if (listContainerScope.options.hasOwnProperty('onDrop')) {
          listContainerScope.options.onDrop(dragItem, angular.element(dropItemEl).scope().item);
        }
      },

      start: function() {
        hasDragged = true;
      },

      move: function(e) {
        dragDx = dragDx + e.dx;
        dragDy = dragDy + e.dy;

        this.setDragContainerElPosition();

        if (!listContainerScope.options.allowInsertion) {
          return;
        }

        if (listContainerScope.options.allowNesting && e.dx !== 0 && e.dy === 0) {
          if (e.dx > 0) {
            dragDirectionX = 'right';
          } else {
            dragDirectionX = 'left';
          }

          if (prevDragDirectionX !== dragDirectionX) {
            dragMoveX = 0;
            prevDragDirectionX = dragDirectionX;
          }

          dragMoveX = dragMoveX + Math.abs(e.dx);

          // reduce jumping by requiring min drag movement for a direction change
          if (dragMoveX > listContainerScope.options.xThreshold) {
            dragMoveX = 0;

            if (dragDirectionX === 'right') {
              this.moveRight();
            } else {
              this.moveLeft();
            }

            return;
          }
        }

        // disable y movement if movement is significant in x direction
        if (!dropItemEl || Math.abs(e.dx) > 5 || e.dy === 0) {
          return;
        }

        if (e.dy > 0) {
          dragDirectionY = 'down';
        } else {
          dragDirectionY = 'up';
        }
      },

      /**
       * Drag end handler
       */
      end: function() {
        if (!dropItemEl) {
          // no longer over an item so use the placeholder to find the drop list

          if (!placeholderEl.parentNode) {
            return;
          }

          dropList = angular.element(placeholderEl.parentNode).scope().item;
        } else {
          if ($dropItemEl.hasClass('ez-list')) {
            dropList = $dropItemEl.isolateScope().item;
          } else {
            dropList = $dropItemEl.parent().scope().item;
          }
        }

        dragItemEl.classList.remove(listContainerScope.options.acceptClass);

        dragContainerEl.removeChild(dragItemEl);

        dragList[dragOptions.childrenField].splice(dragItemIndex, 1);

        dragListScope.$apply();

        if (listContainerScope.options.allowInsertion) {
          // add drag item to target items array

          if (dropList && dropList.hasOwnProperty(listContainerScope.options.childrenField)) {
            if (placeholderEl.parentNode) {
              dropList[listContainerScope.options.childrenField].splice(this.getPlaceholderIndex(), 0, dragItem);
            }
          } else {
            dropList[listContainerScope.options.childrenField] = [dragItem];
          }
        } else {
          if (!dropItemEl) {
            // return item back to origin
            dragList[dragListScope.options.childrenField].splice(dragItemIndex, 0, dragItem);
          }
        }

        dragListScope.$apply();

        interact.dynamicDrop(false);
      },

      /**
       * Initialize the drag container position
       */
      initDragContainer: function() {
        var listContainerPosition = listContainerEl.getBoundingClientRect();
        var dragPosition = dragItemEl.getBoundingClientRect();

        dragDx = 0;
        dragDy = 0;
        dragX = dragPosition.left - listContainerPosition.left;
        dragY = dragPosition.top - listContainerPosition.top;

        dragContainerEl.style.top = (dragY + 2) + 'px';
        dragContainerEl.style.left = (dragX + 2) + 'px';
        dragContainerEl.style.width = (dragPosition.right - dragPosition.left - 1) + 'px';
        this.setDragContainerElPosition();
      },

      /**
       * Set transform style on drag container element
       */
      setDragContainerElPosition: function() {
        dragContainerEl.style.webkitTransform = dragContainerEl.style.transform = 'translate(' + dragDx + 'px, ' + dragDy + 'px)';
      },

      resetDragContainerElPosition: function() {
        dragContainerEl.style.webkitTransform = dragContainerEl.style.transform = 'translate(0px, 0px)';
      },

      moveLeft: function() {
        var prevItemEl = placeholderEl.parentNode.parentNode.parentNode;
        var prevListEl = prevItemEl.parentNode;

        if (!prevListEl || prevListEl.tagName !== 'UL') {
          return;
        }

        prevListEl.insertBefore(placeholderEl, prevItemEl.nextSibling);

        prevItemEl = prevListEl = null;
      },

      getPlaceholderIndex: function() {
        return Array.prototype.indexOf.call(placeholderEl.parentNode.children, placeholderEl);
      },

      /**
       * Move placeholder to the right
       */
      moveRight: function() {
        var prevItemEl = placeholderEl.previousElementSibling;
        var $prevItemEl = angular.element(prevItemEl);
        var scope = $prevItemEl.scope();

        if (!prevItemEl || prevItemEl.tagName !== 'LI') {
          return;
        }

        if (scope.options.openOnSlide && scope.item[scope.options.collapsedField] === true) {
          scope.item[scope.options.collapsedField] = false;

          scope.$apply();

          prevItemEl.children[0].children[1].insertBefore(placeholderEl, prevItemEl.children[0].children[1].children[0]);
        } else {
          prevItemEl.children[0].children[1].appendChild(placeholderEl);
        }

        prevItemEl = $prevItemEl = null;
      },

      moveUp: function() {
          dropItemEl.parentNode.insertBefore(placeholderEl, dropItemEl);
      },

      moveDown: function() {
          var innerList = dropItemEl.children[0].children[1];

          if (innerList && innerList.children[0]) {
            // move in if list is not collapsed
            innerList.insertBefore(placeholderEl, innerList.children[0]);
          } else {
            dropItemEl.parentNode.insertBefore(placeholderEl, dropItemEl.nextElementSibling);
          }
      },

      /**
       * Clean up
       */
      destroy: function() {
        if (!hasDragged) {
           //put the drag element back in the list since angular aint gonna do it
          placeholderEl.parentNode.insertBefore(dragItemEl, placeholderEl);
        }

        if (placeholderEl.parentNode) {
          placeholderEl.parentNode.removeChild(placeholderEl);
        }

        dragItemEl.classList.remove('ez-dragging');
        listContainerEl.classList.remove('ez-drag-origin');
        listContainerEl.classList.remove('ez-list-target');

        this.unsetDropzones();

        listContainerEl = $dragItemEl = dragItemEl = dragList = dragItem = dragItemIndex = hasDragged = null;
      }

    };

  }]);

})();
