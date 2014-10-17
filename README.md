EZ-LIST
=======

Another angular tree directive with tasty adjectives like draggable, droppable, connected, recursive, etc.

###Dependencies

Requires <a href="http://interactjs.io/">Interact.js</a>

###Usage

```js
angular.module('yourApp', ['ez.list'])

.controller('YourCtrl', function($scope) {
  $scope.list = {
    items: [
      {text: 'Bert'},
      {text: 'Ernie'}
    ]
  }:
});

```

```html
  <div ez-list="list"></div>
```

###Demo

View <a href="http://cdn.rawgit.com/jdewit/ez-list/master/index.html">DEMO</a>.
