'use strict';


module.exports = function(grunt) {
    // Load task
    grunt.loadNpmTasks('grunt-node-webkit-builder');

    // Options
    return {
        build : {
          options: {
              version : 'v0.12.3',
              platforms: ['win','osx','linux'],
              buildDir: './webkitbuilds', // Where the build version of my node-webkit app is saved
          },
          src: ['./app/**/*'] // Your node-webkit app
      }
    }
};
