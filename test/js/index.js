import 'core-js/shim';

import './utils';

// require all test modules
const testsContext = require.context('./app/', true, /test_.*\.js$/);
testsContext.keys().forEach(testsContext);

// require all source js modules (to ensure full code coverage)
const srcContext = require.context('./../../static/js/app/', true, /.*\.js$/);
srcContext.keys().forEach(srcContext);
