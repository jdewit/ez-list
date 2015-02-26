(function() {
  'use strict';

  angular.module('ez.list').constant('EzListConfig', {
    mode: 'insert', // [insert, drop, disabled]
    acceptClass: 'ez-dragging', // item class to accept in dropzones
    idField: 'id',
    listChildrenField: 'items',
    childrenField: 'items',
    collapsedField: 'collapsed',
    showPlaceholder: true, // show placeholder where item will drop
    collapsed: true, // initial item collapsed state
    allowDrag: true, // allow items to be draggable
    allowNesting: true, // allow items to be nested inside one another, only applicable when mode = insert
    openOnSlide: true, // open an item when a drag item is slid under and to the right
    closeOnDrag: false, // close item on drag init
    dropOnly: false, // only allow dragged items to be dropped on 1st level items
    xThreshold: 15, // Amount of drag (in px) required for left - right movement
    yThreshold: 5, // Amount of drag (in px) required for up - down movement
    api: { // allow user to add callbacks to significant events
      onMove: null, // called when an item is moved
      onDrop: null // called when an item is dropped onto another
    },
    transcludeMethods: {} // allow for binding methods to the transcluded scope
  });

})();
