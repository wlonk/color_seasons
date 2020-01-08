const browserSync = require('browser-sync').create();
const chalk = require('chalk');
const del = require('del');
const eslint = require('gulp-eslint');
const fs = require('fs');
const gulp = require('gulp');
const gutil = require('gulp-util');
const KarmaServer = require('karma').Server;
const minimatch = require('minimatch');
const mocha = require('gulp-spawn-mocha');
const path = require('path');
const rename = require('gulp-rename');
const sasslint = require('gulp-sass-lint');
const svg = require('gulp-svg-symbols');
const svgmin = require('gulp-svgmin');
const webpack = require('webpack');
const { exec } = require('child_process');
const { spawn } = require('child_process');

// sanity check Node version
const packageOptions = require('./package.json');
const expectedNodeVersion = `v${packageOptions.engines.node}`;
if (process.version !== expectedNodeVersion) {
  process.stdout.write(
    `You are not running node ${expectedNodeVersion}. ` +
    'Make sure that you\'ve run bin/unpack-node and that ' +
    `your $PATH includes ${path.resolve(__dirname, 'bin')}\n`);
  process.exit(1);  // eslint-disable-line no-process-exit
}

const paths = {
  SRC_TEMPLATES_DIR: 'templates/',
  SRC_JS_DIR: 'static/js/',
  JS_TESTS_DIR: 'test/js/',
  SASS_TESTS_DIR: 'test/sass/',
  SASS_DIR: 'static/sass/',
  SRC_PY_DIR: 'src/',
  PY_TESTS_DIR: 'src/**/tests/',
  ICONS_DIR: 'templates/icons/',
  DIST_DIR: 'static/dist/',
  IGNORE: [
    '!**/.#*',
    '!**/flycheck_*'
  ],
  init () {
    this.SRC_JS = [
      `${this.SRC_JS_DIR}*.js`,
      `${this.SRC_JS_DIR}app/**/*.js`
    ].concat(this.IGNORE);
    this.ALL_JS = [
      `${this.SRC_JS_DIR}*.js`,
      `${this.SRC_JS_DIR}app/**/*.js`,
      `${this.JS_TESTS_DIR}**/*.js`,
      `${this.SASS_TESTS_DIR}**/*.js`,
      '*.js'
    ].concat(this.IGNORE);
    this.SRC_PY = [
      `${this.SRC_PY_DIR}**/*.py`
    ].concat(this.IGNORE);
    this.PY_TESTS = [
      `${this.PY_TESTS_DIR}**/*.py`
    ].concat(this.IGNORE);
    this.SASS = [
      `${this.SASS_DIR}**/*.scss`,
      `${this.SASS_TESTS_DIR}**/*.scss`
    ].concat(this.IGNORE);
    return this;
  }
}.init();

// Try to ensure that all processes are killed on exit
const spawned = [];
process.on('exit', () => {
  spawned.forEach((pcs) => {
    pcs.kill();
  });
});

// Execute a command, logging output live while process runs
const spawnTask = function (command, args, cb) {
  spawned.push(
    spawn(command, args, { stdio: 'inherit' })
      .on('error', (err) => {
        gutil.beep();
        return cb(err);
      })
      .on('exit', cb)
  );
};

// Execute a command, logging output after process completes
const execTask = function (command, cb) {
  if (!cb) { gutil.log('Starting', `'${chalk.cyan(command)}'...`); }
  exec(command, (err, stdout, stderr) => {
    if (stdout) { gutil.log(chalk.blue(stdout)); }
    if (stderr) { gutil.log(chalk.red(stderr)); }
    if (err) { gutil.beep(); }
    if (cb) { return cb(err); }
    if (err) {
      return gutil.log(`'${chalk.cyan(command)}'`, chalk.red(err));
    }
    return gutil.log('Finished', `'${chalk.cyan(command)}'`);
  });
};

const onError = function (err) {
  gutil.log(chalk.red(err.message));
  gutil.beep();
  this.emit('end');
};

const eslintTask = (src, failOnError, log) => {
  if (log) {
    const cmd = `eslint ${src}`;
    gutil.log('Running', `'${chalk.cyan(cmd)}'...`);
  }
  const stream = gulp.src(src)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
  if (!failOnError) {
    stream.on('error', onError);
  }
  return stream;
};

const sasslintTask = (src, failOnError, log) => {
  if (log) {
    const cmd = `sasslint ${src}`;
    gutil.log('Running', `'${chalk.cyan(cmd)}'...`);
  }
  const stream = gulp.src(src)
    .pipe(sasslint())
    .pipe(sasslint.format())
    .pipe(sasslint.failOnError());
  if (!failOnError) {
    stream.on('error', onError);
  }
  return stream;
};

// Convert .py filepath to relevant pytest filepath; run test file (if exists)
const pytestTask = (filepath) => {
  let testpath;
  filepath = path.relative(__dirname, filepath);
  if (minimatch(filepath, `${paths.PY_TESTS_DIR}**/*.py`)) {
    testpath = filepath;
  } else if (minimatch(filepath, `${paths.SRC_PY_DIR}**/*.py`)) {
    const pieces = filepath.split('/');
    pieces.splice(-1, 0, 'tests');
    testpath = pieces.join('/');
  }
  if (testpath) {
    fs.exists(testpath, (exists) => {
      if (exists) {
        execTask(`py.test ${testpath} --no-cov`);
      }
    });
  }
};

gulp.task('default', [
  'eslint',
  'sasslint',
  'flake8',
  'webpack',
  'test'
]);

// Same as default task, but also watches for changes
// (tasks are listed individually because "watch" already runs tests once)
gulp.task('dev', [
  'eslint',
  'sasslint',
  'flake8',
  'sasstest',
  'pytest',
  'watch'
]);

gulp.task('test', [ 'jstest', 'sasstest', 'pytest' ]);

gulp.task('watch', [ 'jstest-watch', 'webpack-watch' ], () => {
  // lint js on changes
  gulp.watch(paths.ALL_JS, (ev) => {
    if (ev.type === 'added' || ev.type === 'changed') {
      eslintTask(ev.path, false, true);
    }
  });

  // lint all js when rules change
  gulp.watch('**/.eslintrc.yml', ['eslint-nofail']);

  // lint scss on changes
  gulp.watch(paths.SASS, (ev) => {
    if (ev.type === 'added' || ev.type === 'changed') {
      sasslintTask(ev.path, false, true);
    }
  });

  // lint all scss when rules change
  gulp.watch('**/.sass-lint.yml', ['sasslint-nofail']);

  // run sass tests on changes
  gulp.watch(paths.SASS, ['sasstest']);

  // run webpack to compile static assets
  gulp.watch([
    `${paths.ICONS_DIR}**/*.svg`,
    `${paths.SRC_TEMPLATES_DIR}_icon_template.lodash`,
    './STYLEGUIDE.md'
  ], ['webpack']);

  // lint python on changes
  gulp.watch(paths.SRC_PY, ['flake8']);

  // run pytests on changes
  gulp.watch(paths.SRC_PY, (ev) => {
    if (ev.type === 'added' || ev.type === 'changed') {
      pytestTask(ev.path);
    }
  });
});

gulp.task('eslint', () => eslintTask(paths.ALL_JS, true));

gulp.task('eslint-nofail', () => eslintTask(paths.ALL_JS));

gulp.task('sasslint', () => sasslintTask(paths.SASS, true));

gulp.task('sasslint-nofail', () => sasslintTask(paths.SASS));

gulp.task('sasstest', () =>
  gulp.src([`${paths.SASS_TESTS_DIR}test_sass.js`], { read: false })
    .pipe(mocha({ reporter: 'dot' }))
);

const karmaOnBuild = (done) => (exitCode) => {
  if (exitCode) {
    gutil.beep();
    done(new gutil.PluginError(
      'karma',
      { name: 'KarmaError', message: `Failed with exit code: ${exitCode}` }
    ));
  } else {
    done();
  }
  process.exit(exitCode); // eslint-disable-line no-process-exit
};

gulp.task('jstest', (cb) => {
  const karmaConf = require('./karma.common.conf.js');
  new KarmaServer(karmaConf, karmaOnBuild(cb)).start();
});

gulp.task('jstest-debug', (cb) => {
  const karmaConf = require('./karma.common.conf.js');
  const conf = Object.assign({}, karmaConf, {
    singleRun: false,
    browsers: ['Chrome']
  });
  new KarmaServer(conf, karmaOnBuild(cb)).start();
});

// Use karma watcher instead of gulp watcher for tests
gulp.task('jstest-watch', () => {
  const karmaConf = require('./karma.common.conf.js');
  const conf = Object.assign({}, karmaConf, {
    autoWatch: true,
    singleRun: false
  });
  conf.coverageReporter.reporters = [
    { type: 'html', dir: 'jscov/' },
    { type: 'text-summary' }
  ];
  new KarmaServer(conf).start();
});

gulp.task('sprites-clean', (cb) => {
  del(`${paths.SRC_TEMPLATES_DIR}_icons.svg`).then(() => {
    cb();
  });
});

gulp.task('sprites', ['sprites-clean'], () =>
  gulp.src(`${paths.ICONS_DIR}**/*.svg`)
    .pipe(svgmin())
    .pipe(svg({
      id: 'icon-%f',
      title: '%f icon',
      templates: [
        path.join(__dirname, paths.SRC_TEMPLATES_DIR, '_icon_template.lodash')
      ]
    }))
    .pipe(rename('_icons.svg'))
    .pipe(gulp.dest(paths.SRC_TEMPLATES_DIR))
);

const webpackOnBuild = (done) => (err, stats) => {
  if (err) {
    gutil.log(chalk.red(err.stack || err));
    if (err.details) {
      gutil.log(chalk.red(err.details));
    }
  }

  if (err || stats.hasErrors() || stats.hasWarnings()) {
    gutil.beep();
  }

  gutil.log(stats.toString({
    colors: true,
    chunks: false
  }));

  if (done) { done(err); }
};

gulp.task('webpack', ['sprites'], (cb) => {
  const webpackConfig = require('./webpack.config');
  webpack(webpackConfig).run(webpackOnBuild(cb));
});

gulp.task('webpack-watch', ['sprites'], () => {
  const webpackConfig = require('./webpack.config');
  webpack(webpackConfig).watch(300, webpackOnBuild());
});

gulp.task('webpack-prod', ['sprites'], (cb) => {
  const webpackProdConfig = require('./webpack.prod.config');
  webpack(webpackProdConfig).run(webpackOnBuild(cb));
});

gulp.task('pytest', ['sprites'], (cb) => {
  execTask('py.test', cb);
});

gulp.task('flake8', (cb) => {
  execTask(`flake8 ${paths.SRC_PY_DIR}`, cb);
});

gulp.task('serve', [ 'watch', 'browser-sync' ], (cb) => {
  spawnTask(`${paths.SRC_PY_DIR}manage.py`, ['runserver'], cb);
});

gulp.task('browser-sync', (cb) => {
  browserSync.init({
    proxy: {
      target: 'localhost:8000',
      middleware (req, res, next) {
        req.headers['X-Forwarded-Host'] = req.headers.host;
        next();
      }
    },
    open: false,
    logLevel: 'info',
    logPrefix: 'color_seasons',
    notify: false,
    ghostMode: false,
    files: [
      `${paths.DIST_DIR}**/*`,
      `${paths.SRC_PY_DIR}**/*.py`
    ],
    reloadDelay: 300,
    reloadThrottle: 500,
    // Because we're debouncing, we always want to reload the page to prevent
    // a case where the CSS change is detected first (and injected), and
    // subsequent JS/HTML changes are ignored.
    injectChanges: false
  }, cb);
});
