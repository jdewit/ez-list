(function() {
  'use strict';

  angular.module('ez.list').factory('EzListDraggable', [function() {
    var dragItem,
        dragItemEl,
        $dragItemEl,
        dragItemList,
        dragItemListEl,
        dragItemListScope,
        dragItemIndex,
        dragContainerEl = angular.element('<ul class="ez-drag-container"></ul>')[0], // drag container element
        placeholderEl = angular.element('<li class="ez-placeholder"></li>')[0], // placeholder element
        dragX = 0, // x coordinate of drag element
        dragY = 0, // y coordinate of drag element
        dragDx = 0,
        dragDy = 0,
        dragMoveX = 0, // number of moves in the x direction
        dragDirectionX,
        dragDirectionY,
        dropItemEl,
        $dropItemEl,
        dropItem,
        dropInteracts,
        prevDragDirectionX, // which way the item is being dragged ['left', 'right']
        listContainerEl,
        $listContainerEl,
        listContainerScope,
        prevListContainerEl,
        $prevListContainerEl,
        prevListContainerScope,
        dragOptions = {};

    return {

      setDropzones: function() {
        $dragItemEl.find('.ez-list-item-content').removeClass('ez-dropzone');

        dropInteracts = interact('.ez-dropzone').dropzone({
          ondragenter: this.enter.bind(this),
          ondragleave: this.leave.bind(this),
        });
      },

      setDropzone: function(el, options) {
        interact(el).dropzone({
          accept: options.accept,
          ondragenter: this.enter.bind(this),
          ondragleave: this.leave.bind(this),
        });

      },

      unsetDropzone: function(el) {
        interact(el).dropzone(false);
      },

      unsetDropzones: function() {
        dropInteracts.unset();

        $dragItemEl.find('.ez-list-item-content').addClass('ez-dropzone');
      },
      triggerDrag: function(e) {
        var interaction = e.interaction;

        if (
          !e.target.hasAttribute('ez-drag-handle') || // must have drag-handle attribute
          (typeof e.button !== 'undefined' && e.button !== 0) || // disable right click
          interaction.interacting() // must not already be interacting
        ) {
          return;
        }

        interaction.start({
          name: 'drag'
        }, e.interactable, e.currentTarget);
      },
      initDragItem: function(element, scope) {
        var self = this;
        interact(element).draggable({
          manualStart: true,
          onstart: function(e) {
            self.start(e, scope);
          },
          onmove: function(e) {
            self.move(e);
          },
          onend: function(e) {
            self.end(e);
          }
        })
        .on('hold', function(e) {
          // require tablets to use tab hold to begin interaction
          if (!interact.supportsTouch()) {
            return;
          }

          self.triggerDrag(e);
        })
        .on('down', function (e) {
          if (interact.supportsTouch()) {
            return;
          }

          self.triggerDrag(e);
        });
      },

      /**
       * Fires once when an item enters another
       */
      enter: function(e) {
        var _listContainerEl;

        if (angular.element(e.target).hasClass('ez-list')) {
          // drop target is an empty list
          _listContainerEl = e.target;

          this.setDropItem(e.target);
        } else {
          this.setDropItem(e.target.parentNode.parentNode);

          dropItemEl.children[0].children[0].classList.add('ez-dragover');

          _listContainerEl = $dropItemEl.closest('.ez-list')[0];
        }

        if (_listContainerEl !== listContainerEl) {
          if (listContainerEl) {
            prevListContainerEl = listContainerEl;
            $prevListContainerEl = $listContainerEl;
            prevListContainerScope = listContainerScope;

            prevListContainerEl.classList.remove('ez-list-target');
          }

          listContainerEl = _listContainerEl;
          $listContainerEl = angular.element(listContainerEl);
          listContainerScope = $listContainerEl.data('scope');

          listContainerEl.classList.add('ez-list-target');

          _listContainerEl = null;

          if (listContainerScope.options.mode !== 'drop') {
            if (dragDirectionY === 'up') {
              this.moveUp();
            } else {
              this.moveDown();
            }
          }
        }
      },

      /**
       * Fires once when an item leaves another
       */
      leave: function() {
        if ($dropItemEl.hasClass('ez-list-item')) {
          dropItemEl.children[0].children[0].classList.remove('ez-dragover');
        }

        if ($dropItemEl.hasClass('ez-list')) {
          // drop target was an empty list
          listContainerEl.classList.remove('ez-list-target');
        } else {
          // drop target was a list item

          if (listContainerScope.options.mode === 'insert') {
            if (dragDirectionY === 'up') {
              this.moveUp();
            } else {
              this.moveDown();
            }
          }
        }

        dropItem = dropItemEl = $dropItemEl = null;

        if (listContainerScope.options.dropOnly) {
          listContainerEl.classList.remove('ez-list-target');
          listContainerEl = $listContainerEl =listContainerScope = null;
        }
      },

      getListRootScope: function(itemScope) {
        if (!!itemScope.__listRoot) {
          return itemScope;
        }

        if (!!itemScope.$parent) {
          return this.getListRootScope(itemScope.$parent);
        }
      },

      start: function(e, scope) {
        e.preventDefault();
        e.stopPropagation();

        $dragItemEl = angular.element(e.target).closest('.ez-list-item');
        dragItemEl = $dragItemEl[0];
        dragItemListEl = $dragItemEl[0].parentNode;
        $listContainerEl = $(e.target).closest('.ez-list');
        listContainerEl = $listContainerEl[0];

        listContainerScope = $listContainerEl.data('scope');

        this.setDropzones();

        dragOptions = listContainerScope.options;
        dragItem = scope.item;
        dragItemListScope = scope.$parent.$parent;
        dragItemList = dragItemListScope.item;
        dragItemIndex = dragItemList[listContainerScope.options.childrenField].indexOf(dragItem);

        this.initDragContainer();

        if (dragOptions.closeOnDrag) {
          dragItem[dragOptions.collapsedField] = true;
          dragItemListScope.$apply();
        } else {
          placeholderEl.style.height = $dragItemEl.height() + 'px';
        }

        // prevent nested items within the dragged item from being accepted by a dropzone
        $dragItemEl.addClass(listContainerScope.options.acceptClass);

        dragItemListEl.insertBefore(placeholderEl, dragItemEl);

        if (dragContainerEl.parentNode !== listContainerEl) {
          listContainerEl.appendChild(dragContainerEl);
        }

        dragContainerEl.appendChild(dragItemEl);

        $listContainerEl.addClass('ez-drag-origin');
        $listContainerEl.addClass('ez-list-target');

        interact.dynamicDrop(true);

        $dragItemEl.addClass('ez-dragging');

      },

      move: function(e) {
        dragDx = dragDx + e.dx;
        dragDy = dragDy + e.dy;

        this.setDragContainerElPosition();

        if (listContainerEl === null || listContainerScope.options.mode !== 'insert') {
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
        var self = this;
        interact.dynamicDrop(false);

        if (!!dropItemEl && $dropItemEl.hasClass('ez-list-item')) {
          dropItemEl.children[0].children[0].classList.remove('ez-dragover');
        }

        // remove dragItem from model
        dragItemList[dragOptions.childrenField].splice(dragItemIndex, 1);
        dragItemListScope.$apply();

        this.removeDragElement();

        if (!listContainerEl) {

          this.returnItem(true);

        } else if (listContainerScope.options.mode === 'insert' && !!placeholderEl.parentNode) {

          this.setDropItem(placeholderEl.parentNode);

          if (typeof listContainerScope.options.api.onMove === 'function') {
            listContainerScope.options.api.onMove(dragItem, dropItem).then(function(cb) {
              self.moveItem();

              if (typeof cb === 'function') {
                cb();
              }
            }, function() {
              self.returnItem();
            });
          } else {
            self.moveItem(true);
          }

        } else if (listContainerScope.options.mode === 'drop') {
          if (typeof listContainerScope.options.api.onDrop === 'function') {
            listContainerScope.options.api.onDrop(dragItem, dropItem).then(function() {
              self.destroy();
            }, function() {
              self.returnItem();
            });
          }

        } else {
          this.returnItem(true);
        }
      },

      /**
       * Move an item on the list model
       */
      moveItem: function(useApply) {
        var self = this;

        // add drag item to target items array
        if (dropItem.hasOwnProperty(listContainerScope.options.childrenField)) {
          var index = Array.prototype.indexOf.call(placeholderEl.parentNode.children, placeholderEl);

          dropItem[listContainerScope.options.childrenField].splice(index, 0, dragItem);
        } else {
          dropItem[listContainerScope.options.childrenField] = [dragItem];
        }

        if (useApply) {
          dragItemListScope.$apply();
        }

        self.destroy();
      },

      /**
       * Remove the drag item from the drag container
       */
      removeDragElement: function() {
        dragContainerEl.removeChild(dragItemEl);
      },

      /**
       * Remove placeholder
       */
      removePlaceholder: function() {
        if (placeholderEl.parentNode) {
          placeholderEl.parentNode.removeChild(placeholderEl);
        }
      },

      /**
       * Return item back to origin
       */
      returnItem: function(useApply) {
        dragItemList[dragOptions.childrenField].splice(dragItemIndex, 0, dragItem);

        if (useApply) {
          dragItemListScope.$apply();
        }

        this.destroy();
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

      setDropItem: function(el) {
        dropItemEl = el;
        $dropItemEl = angular.element(el);

        var scope = $dropItemEl.data('scope');

        if (!scope) {
          scope = $dropItemEl.parent().data('scope');

          if (!scope) {
            scope = $dropItemEl.parent().parent().data('scope');

            if (!scope) {
              scope = $dropItemEl.parent().parent().parent().data('scope');
            }
          }
        }

        if (scope) {
          dropItem = scope.item;
        }
      },

      /**
       * Set transform style on drag container element
       */
      setDragContainerElPosition: function() {
        dragContainerEl.style.webkitTransform = dragContainerEl.style.transform = 'translate3D(' + dragDx + 'px, ' + dragDy + 'px, 0px)';
      },

      /**
       * Move placeholder to the left
       */
      moveLeft: function() {
        if (placeholderEl.nextElementSibling) { // only allow left if placeholder is last
          return;
        }

        this.setDropItem(placeholderEl.parentNode.parentNode.parentNode);

        if (!dropItem || !dropItemEl || !dropItemEl.nextSibling) {
          return;
        }

        dropItemEl.parentNode.insertBefore(placeholderEl, dropItemEl.nextSibling);
      },

      /**
       * Move placeholder to the right
       */
      moveRight: function() {
        if (!placeholderEl.previousElementSibling) {
          return;
        }

        this.setDropItem(placeholderEl.previousElementSibling);

        if (listContainerScope.options.openOnSlide && dropItem[listContainerScope.options.collapsedField] === true) {
          dropItem[listContainerScope.options.collapsedField] = false;

          listContainerScope.$emit('ez_list.item_opened', dropItem);

          listContainerScope.$apply();

          dropItemEl.children[0].children[1].insertBefore(placeholderEl, dropItemEl.children[0].children[1].children[0]);
        } else {
          dropItemEl.children[0].children[1].appendChild(placeholderEl);
        }
      },

      /**
       * Move placeholder up
       */
      moveUp: function() {
        dropItemEl.parentNode.insertBefore(placeholderEl, dropItemEl);
      },

      /**
       * Move placeholder down
       */
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
        this.removePlaceholder();

        $dragItemEl.removeClass(dragOptions.acceptClass);

        if (listContainerEl) {
          listContainerEl.classList.remove('ez-drag-origin');
          listContainerEl.classList.remove('ez-list-target');
        }

        if (prevListContainerEl) {
          prevListContainerEl.classList.remove('ez-drag-origin');
          prevListContainerEl.classList.remove('ez-list-target');
        }

        this.unsetDropzones();

        prevListContainerEl = $prevListContainerEl = prevListContainerScope = listContainerEl = $listContainerEl = listContainerScope = $dragItemEl = dragItemEl = dragItemList = dragItemListEl = dragItem = dragItemIndex = null;
      }

    };

  }]);

})();
