import customPaths from './utils/custom-paths'
customPaths.register({ prefixes: ['#server', '#shared', '#modules', '#custom-modules'] })

require('./server')
