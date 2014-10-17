'use_strict';

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        updateConfigs: [],
        commit: true,
        push: false,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json', 'bower.json']
      }
    },
    concat: {
      build: {
        src: [
          'src/boot.js',
          'src/constants/*.js',
          'src/controllers/*.js',
          'src/directives/*.js',
          'src/services/*.js',
        ],
        dest: 'dist/ez-list.js'
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      src: {
        files: {
          src: ['src/**/*.js', 'test/**/*.js']
        },
      }
    },
    less: {
      dist: {
        options: {
          yuicompress: true
        },
        files: {
          'dist/ez-list.min.css': 'src/less/*.less'
        }
      },
      demo: {
        files: {
          'demo/css/style.css': 'demo/less/*.less'
        }
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        background: true,
        singleRun: false
      },
      singleRun: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },
    ngtemplates: {
      ezList: {
        src:      'src/templates/*.html',
        dest:     'dist/ez-list-tpl.js',
        options: {
          module: 'ez.list',
          url: function(url) { return url.replace('src/templates/', ''); },
          htmlmin: {
            collapseBooleanAttributes:      true,
            collapseWhitespace:             true,
            removeAttributeQuotes:          true,
            removeComments:                 true,
            removeEmptyAttributes:          true,
            removeRedundantAttributes:      true,
            removeScriptTypeAttributes:     true,
            removeStyleLinkTypeAttributes:  true
          }
        }
      }
    },
    replace: {
      dist: {
        options: {
          patterns: [
            {
              match: /\n\}\)\(\)\;\n\n\(function\(\) \{\n  'use strict';\n\n  angular\.module\('ez\.list'\)/g,
              replacement: ''
            },
            {
              match: /  \}\);\n\n\}\)\(\);/g,
              replacement: '})\n})();'
            },
            {
              match: /  \}\]\);/g,
              replacement: '}])'
            },
            {
              match: /\[\]\);/,
              replacement: '[])'
            }
          ]
        },
        files: [
          {
            src: ['dist/ez-list.js'],
            dest: 'dist/ez-list.js'
          }
        ]
      }
    },
    uglify: {
      options: {
        //mangle: false,
        //compress: true
      },
      dist: {
        files: {
          'dist/ez-list.min.js': ['dist/ez-list.js'],
          'dist/ez-list-tpl.js': ['dist/ez-list-tpl.js']
        }
      }
    },
    watch: {
      dev: {
        files: ['src/**/*', 'demo/**/*'],
        tasks: ['default']
      },
      test: {
        files: ['dist/*', 'test/**/*'],
        tasks: ['karma:unit:run']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-concat');
 // grunt.loadNpmTasks('grunt-bump');
//  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-angular-templates');

  grunt.registerTask('default', ['jshint', 'concat', 'ngtemplates', 'less', 'uglify']);

  grunt.registerTask('dev', ['default', 'karma:unit:start', 'watch']);

  grunt.registerTask('test', ['karma:singleRun']);

};
