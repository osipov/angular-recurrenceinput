module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        library: grunt.file.readJSON('bower.json'),
        concat: {
            options: {
                separator: ''
            },
            library: {
                src: [
                    'src/<%= library.name %>/<%= library.name %>.prefix',
					'tmp/*.js',
                    'src/<%= library.name %>/<%= library.name %>.i18n.js',
                    'src/<%= library.name %>/<%= library.name %>.en_us.js',
                    'src/<%= library.name %>/<%= library.name %>.js',
                    'src/<%= library.name %>/<%= library.name %>.suffix'
                ],
                dest: 'dist/<%= library.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            jid: {
                files: {
                    'dist/<%= library.name %>.min.js': ['<%= concat.library.dest %>']
                }
            }
        },
        jshint: {
            beforeConcat: {
                src: ['gruntfile.js', '<%= library.name %>/**/*.js']
            },
            afterConcat: {
                src: [
                    '<%= concat.library.dest %>'
                ]
            },
            options: {
                // options here to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true,
                    angular: true
                },
                globalstrict: false
            }
        },
        watch: {
            options: {
                livereload: true
            },
            files: [
                'Gruntfile.js',
                'src/**/*'
            ],
            tasks: ['default']
        },
		htmlConvert: {
			options: {
				base: 'src/angular-recurrenceinput',
				indentString: '    '
			},
			riTemplate: {
				src: ['src/**/*.html'],
				dest: 'tmp/template.js'
			}
		}
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-html-convert');

    grunt.registerTask('default', ['htmlConvert', 'jshint:beforeConcat', 'concat', 'jshint:afterConcat', 'uglify']);
	grunt.registerTask('tmpl', ['htmlConvert']);
    grunt.registerTask('livereload', ['default', 'watch']);

};