var gulp = require('gulp');
var sass = require('gulp-sass');
var connect = require('gulp-connect');
var open = require('gulp-open');
var del = require('del');
var runSequence = require('run-sequence');
var minifyCSS = require('gulp-csso');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
const rev = require('gulp-rev');
var replace = require('gulp-replace');
var revReplace = require('gulp-rev-replace');
var gutil = require('gulp-util');
let uglify = require('gulp-uglify-es').default;

const arg = (argList => {

    let arg = {}, a, opt, thisOpt, curOpt;
    for (a = 0; a < argList.length; a++) {

        thisOpt = argList[a].trim();
        opt = thisOpt.replace(/^\-+/, '');

        if (opt === thisOpt) {

            // argument value
            if (curOpt) arg[curOpt] = opt;
            curOpt = null;

        }
        else {

            // argument name
            curOpt = opt;
            arg[curOpt] = true;

        }

    }

    return arg;

})(process.argv);

var env = arg.env || 'dev';
var conf = {
    version: arg.num || '1.0',
    lang: arg.lang || 'v52',
    dev: {
        shouldMinifyCSS: true,
        shouldRev: true,
        shouldUglify: true,
        shouldMaps: true,
        shouldUpload: arg.upload === 'true' || false,
        s3: {
            accessKeyId: "",
            secretAccessKey: "",
            s3url: 'dev.whereWe.co.il'
        }
    },
    pre: {
        shouldMinifyCSS: true,
        shouldRev: true,
        shouldUglify: true,
        shouldMaps: true,
        shouldUpload: arg.upload === 'true' || false,
        s3: {
            accessKeyId: "",
            secretAccessKey: "",
            s3url: 'pre.whereWe.co.il'
        }
    },
    prod: {
        shouldMinifyCSS: true,
        shouldRev: true,
        shouldUglify: true,
        shouldMaps: true,
        shouldUpload: arg.upload === 'true' || false,
        s3: {
            accessKeyId: "",
            secretAccessKey: "",
            s3url: 'prod.whereWe.co.il'
        }
    }
};

gulp.task('upload:dist', function () {
    gutil.log(gutil.colors.blue('Start uploading.....'));
    gutil.log(gutil.colors.blue('ENV = ' + env));
    gutil.log(gutil.colors.blue('shouldUpload = ' + conf[env].shouldUpload));
    gutil.log(gutil.colors.blue('Bucket = ' + conf[env].s3.s3url));

    if (conf[env].shouldUpload) {

        if (env === 'prod') {
            if (arg.sure) {
                var s3 = require('gulp-s3-upload')(conf[env].s3);
                gulp.src("./dist/**/*")
                    .pipe(s3({
                        Bucket: conf[env].s3.s3url,
                    }, {
                            maxRetries: 3
                        }));
            } else {
                gutil.log(gutil.colors.blue('sure param has to be true to upload to prod'));
            }
        } else {
            var s3 = require('gulp-s3-upload')(conf[env].s3);
            gulp.src("./dist/**/*")
                .pipe(s3({
                    Bucket: conf[env].s3.s3url,
                }, {
                        maxRetries: 3
                    }));
        }


    }
});

gulp.task('connect', function () {
    connect.server({
        root: 'src',
        livereload: true,
        port: 3000
    });
});


gulp.task('js:dist', function () {
    return gulp.src('./src/js/*.js')
        .pipe(gulpif(conf[env].shouldMaps, sourcemaps.init()))
        .pipe(gulpif(conf[env].shouldUglify, uglify()))
        // .pipe(rev.manifest())
        // .pipe(concat('app.min.js'))
        .pipe(rev())
        .pipe(gulpif(conf[env].shouldMaps, sourcemaps.write('')))
        .pipe(gulp.dest('dist/js'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('dist/js'))
        .on('error', function (err) {
            console.error('Error in compress task', err.toString());
        })
});

// keeps gulp from crashing for scss errors
gulp.task('sass', function () {
    return gulp.src('./src/scss/*.scss')
        .pipe(sass({ errLogToConsole: true }))
        // .pipe(gulpif(conf[env].shouldMinifyCSS, minifyCSS()))
        .pipe(gulp.dest('./src/css'));
});

gulp.task('scss:dist', function () {
    return gulp.src('./src/scss/*.scss')
        .pipe(sass({ errLogToConsole: true }))
        .pipe(gulpif(conf[env].shouldMinifyCSS, minifyCSS()))
        .pipe(rev())
        .pipe(gulp.dest('./dist/css'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('livereload', function () {
    gulp.src('./src/**/*')
        .pipe(connect.reload());
});

gulp.task('watch', function () {
    gulp.watch('./src/**/*.scss', ['sass']);
    gulp.watch('./src/**/*', ['livereload']);
});

gulp.task('open', function () {
    var options = {
        uri: 'localhost:3000',
        app: 'chrome'
    };
    return gulp.src('./src')
        .pipe(open(options));
});

gulp.task('default', ['connect', 'watch', 'sass']);

gulp.task('copy:root', function () {
    return gulp.src(['./src/*.html'])
        .pipe(gulp.dest('dist'))
});

gulp.task('copy:fonts', function () {
    return gulp.src(['./src/fonts/**/*'])
        .pipe(gulp.dest('dist/fonts'))
});

gulp.task('copy:images', function () {
    return gulp.src(['./src/images/**/*'])
        .pipe(gulp.dest('dist/images'))
});


gulp.task('copy:dist', [
    'copy:root',
    'copy:fonts',
    'copy:images'
]);

gulp.task('clean:dist', function () {
    return del([
        'dist',
    ]);
});

//gulp version --num 1.0.04
gulp.task('version', function () {
    gulp.src(['./src/version.html'])
        .pipe(replace('VERSION', conf.version))
        .pipe(gulp.dest('dist/'));
});

gulp.task('revreplace:jsroot', function () {
    var manifest = gulp.src('dist/js/rev-manifest.json');

    return gulp.src(['dist/*.html'])
        .pipe(revReplace({ manifest: manifest }))
        .pipe(gulp.dest('dist'));
});

gulp.task('revreplace:jsloading', function () {
    var manifest = gulp.src('dist/js/rev-manifest.json');

    return gulp.src(['dist/js/loading*.js'])
        .pipe(revReplace({ manifest: manifest }))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('revreplace:cssroot', function () {
    var manifest = gulp.src('dist/css/rev-manifest.json');

    return gulp.src(['dist/*.html'])
        .pipe(revReplace({ manifest: manifest }))
        .pipe(gulp.dest('dist'));
});

// gulp dist --num 1.0 --env dev --upload true --lang v53
// gulp dist --num 1.0 --env pre --upload true --lang v53
// gulp dist --num 1.0 --env prod --upload false --lang v56 --sure
gulp.task('dist', function (callback) {
    gutil.log(gutil.colors.blue('Start dist.....'));
    gutil.log(gutil.colors.blue('ENV = ' + env));
    gutil.log(gutil.colors.blue('Version = ' + conf.version));
    gutil.log(gutil.colors.blue('LANG = ' + conf.lang));

    runSequence(
        'clean:dist',
        'copy:dist',
        'version',
        'scss:dist',
        'js:dist',
        'revreplace:jsloading',
        'revreplace:jsroot',
        'revreplace:cssroot',
        'upload:dist'
    )
});
