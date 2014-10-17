describe('ez-tree', function() {
  var _scope, $el, getItem, $1, $2, $1a, $1b, $1c, $pl;

  beforeEach(module('ez.list'));

  beforeEach(inject(function($rootScope, $compile) {
    _scope = $rootScope.$new();

    _scope.list = {
      items: [
        {
          text: '1',
          items: [
            {
              text: '1a'
            },
            {
              text: '1b'
            },
            {
              text: '1c'
            }
          ]
        },
        {
          text: '2',
          items: []
        }
      ]
    };

    $el = angular.element(
      '<div ez-list="list"></div>'
    );

		$('body').append($el);

    $compile($el)(_scope);

		_scope.$digest();

  }));


  beforeEach(function() {

    getItem = function(text) {
      var el = null;
      $('.ez-list-item-content').each(function() {
        if ($(this).text().trim() === text) {
          el = $(this).closest('.ez-list-item');
          return;
        }
      });

      return el;
    };

    $1 = getItem('1');
    $2 = getItem('2');
    $1a = getItem('1a');
    $1b = getItem('1b');
    $1c = getItem('1c');

    $pl = function() {
      return $('.ez-list-placeholder');
    };
  });

  afterEach(function() {
		$('.ez-list').remove();
  });

  it('should add list items to DOM', function() {
    assert.equal($el.find('.ez-list-item').length, 2);
  });
});
