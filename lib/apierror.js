var util = require('util');

var APIError = function (code, message) {
    Error.call(this);
    this.name = 'APIError';
    this.code = code;
    this.message = message;
};

util.inherits(APIError, Error);

module.exports = APIError;
