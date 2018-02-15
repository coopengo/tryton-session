exports.server = process.env.TRYTON_SESSION_TEST_SERVER || 'http://localhost:8000'
exports.database = process.env.TRYTON_SESSION_TEST_DATABASE || 'tryton'
exports.username = process.env.TRYTON_SESSION_TEST_USERNAME || 'admin'
exports.password = process.env.TRYTON_SESSION_TEST_PASSWORD || 'admin'
exports.token = process.env.TRYTON_SESSION_TEST_TOKEN
