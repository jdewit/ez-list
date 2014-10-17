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
