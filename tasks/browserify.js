'use strict';

module.exports = function browserify(grunt) {
	// Load task
	grunt.loadNpmTasks('grunt-browserify');

	var files = {
		'app/js/lib.js': ['lib/index.js']
	};
	var browserifyOptions = {
		debug : true, // include source maps
		standalone : 'Vault',
		'no-builtins' : true // we want to use default node modules
	};

	// Options
	return {
		build: {
			files: files,
			options: {
				browserifyOptions : browserifyOptions
			}
		},
		watch : {
			files: files,
			options: {
				browserifyOptions : browserifyOptions,
				keepAlive : true,
				watch : true
			}
		}
	};
};
