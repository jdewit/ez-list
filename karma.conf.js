module.exports = function(config) {
  config.set({
    basePath: '',

    frameworks: ['jasmine', 'chai'],

    files: [
      // libraries
      'bower_components/jquery/dist/jquery.js',
      'bower_components/angular/angular.js',
      'bower_components/interact/interact.js',
      'bower_components/angular-mocks/angular-mocks.js',

      // our app
      'dist/ez-list.js',
      'dist/ez-list-tpl.js',
      'dist/ez-list.min.css',

      // tests
      'test/**/*Spec.js',
    ],

    port: 1244,

    browsers: ['Chrome']
  });
};
