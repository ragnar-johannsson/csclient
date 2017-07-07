'use strict';

class APIError extends Error {
	constructor(code, message) {
		super();
		this.name = 'CloudstackAPIError';
		this.code = code;
		this.message = message;
	}
}

module.exports = APIError;
