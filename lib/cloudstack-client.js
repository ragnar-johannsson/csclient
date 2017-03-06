'use strict';

const crypto = require('crypto');
const EventEmitter = require('events');
const qs = require('qs');
const url = require('url');
const APIError = require('./apierror');

/**
 * Class CloudStackClient
 * 
 * @class CloudStackClient
 * @extends {EventEmitter}
 */
class CloudStackClient extends EventEmitter {
	constructor(options) {
		super();
		this.baseUrl = options.baseUrl ? options.baseUrl : options.serverURL;
		this.__apiKey = options.apiKey;
		this.__secretKey = options.secretKey;
		this.__http = options.http;

		if (!this.__http) {
			if (this.baseUrl && this.baseUrl.indexOf('https') === 0) {
				this.__http = require('https');
			} else {
				this.__http = require('http');
			}
		}

		// Single executor mode allows developers to use the execute method for both sync and async 
		// CloudStack API calls.
		// If enabled, the client will make a listApis call to the server, and build a map of async
		// commands. Once this map is complete, ready event is emitted and the execute method will be 
		// available.
		// If disabled or not explicitly enabled, the execute method will work as an alias to executeSync
		// The ready event is still immediately emitted in this case, and developers needn't handle it
		if (options.singleExecutor === true) {
			this.__buildAsyncMap();
			this.execute = this.__execute;
		} else {
			setImmediate(() => {
				this.emit('ready')
			});
			this.execute = this.executeSync;
		}

		// Default pollingTime will be 2000 (2 seconds)
		this.__pollingTime = options.pollingTime || 2000;

		// If a polling number is explicitly defined and is greater than 0, the executeAsync method
		// will poll only upto pollingNumber times
		if (!Number.isNaN(options.pollingNumber && options.pollingNumber > 0)) {
			this.__pollingNumber = options.pollingNumber;
		}
	}

	/**
	 * Private method that calls the listApis CloudStack API, and builds
	 * a map for async commands
	 * 
	 * 
	 * @memberOf CloudStackClient
	 */
	__buildAsyncMap() {
		// making a call to listApis API with listall true and filtering only required attributes to save on time
		this.executeSync('listApis', { listall: true , filter: 'name,isasync'}, (err, response) => {
			if (err) {
				this.emit('error');
			} else {
				this.__apiList = response['listapisresponse'].api;
				this.__apiCount = response['listapisresponse'].count;
				this.__asyncCommands = response['listapisresponse'].api.reduce((result, v, k) => {
					if (v.isasync === true) {
						result[v.name] = true;
					} else {
						result[v.name] = false;
					}
					return result;
				}, {});

				this.emit('ready');
			}
		});
	}

	/**
	 * Provides today's date in ISO form, ignoring zone timezone offset
	 * 
	 * @returns {string} date
	 * 
	 * @memberOf CloudStackClient
	 */
	__isoDate() {
		let d = new Date();
		d.setMinutes(d.getMinutes() + 5);
		return d.toISOString().replace(/\.\d+Z/g, '+0000');
	}

	/**
	 * Public method to call async CloudStack APIs in separate executor mode
	 * 
	 * @param {any} cmd 
	 * @param {any} params 
	 * @param {any} callback 
	 * 
	 * @memberOf CloudStackClient
	 */
	executeSync(cmd, params, callback) {
		if (typeof params === 'function') {
			callback = params;
			params = {};
		} else if (params === null || typeof params === 'undefined') {
			params = {};
		}

		params['command'] = cmd;
		params['response'] = 'json';
		params['apiKey'] = this.__apiKey;
		params['signatureversion'] = 3;
		params['expires'] = this.__isoDate();
		params['signature'] = this.__calculateSignature(params);
		callback = callback || function () { };

		let apiURL = url.parse(this.baseUrl)
		apiURL.path += qs.stringify(params, { encode: true }).replace(/\%5B(\D*?)\%5D/g, '.$1');

		let handleResponse = function (res) {
			var data = '';
			res.on('data', (chunk) => { data += chunk; });
			res.once('end', () => {
				res.removeAllListeners('close');
				if (res.statusCode == 200) {
					try {
						return callback(null, JSON.parse(data));
					} catch (err) {
						return callback(err);
					}
				} else {
					//CS 2.2 returns X-Description header
					if (res.headers['X-Description']) {
						return callback(new APIError(res.statusCode, res.headers['X-Description']));
					}

					//CS 4.2 uses JSON response.
					if (data) {
						try {
							var json = JSON.parse(data);
							var message = '';
							var respName = cmd.toLowerCase() + 'response';

							if (json[respName] && json[respName].errortext) {
								message = json[respName].errortext;
							}
						}
						catch (e) {
							console.warn(e.message);
						}
					}

					return callback(new APIError(res.statusCode, message));
				}
			});
			res.once('close', (err) => {
				return callback(err);
			});
		};

		var req = this.__http.get(apiURL, handleResponse);
		req.once('error', (err) => {
			return callback(err);
		});
	}

	/**
	 * Public method to call async CloudStack APIs in separate executor mode
	 * 
	 * @param {any} cmd 
	 * @param {any} params 
	 * @param {any} callback 
	 * 
	 * @memberOf CloudStackClient
	 */
	executeAsync(cmd, params, callback) {
		let pollingTime = this.__pollingTime;

		this.executeSync(cmd, params, (err, response) => {
			if (err) {
				return callback(err);
			}

			let jobid = response[Object.keys(response)[0]].jobid;
			let queryJobResult = (polled) => {
				this.executeSync('queryAsyncJobResult', { jobid: jobid }, (error, jobresult) => {
					if (error) {
						return callback(error);
					}

					jobresult = jobresult.queryasyncjobresultresponse;

					// Checking for completion; 0 stands for pending; 1 for successful completion; 2 for error
					if (jobresult.jobstatus === 1 || jobresult.jobstatus === 2) {
						if (jobresult.jobstatus === 1) {
							return callback(null, jobresult);
						}
						return callback(new APIError(jobresult.jobresultcode));
					}

					// if polling number is undefined or if polling number is reached, respond with timeout
					if (!Number.isNaN(this.__pollingNumber) && polled >= this.__pollingNumber) {
						return callback(new Error('Timeout'));
					}

					setTimeout(queryJobResult, this.__pollingTime, ++polled);
				});
			};

			setTimeout(queryJobResult, this.__pollingTime, 0);
		});
	}


	/**
	 * Private method that acts as a transparent relay agent for executeSync and executeAsync
	 * in single executor mode
	 * 
	 * @param {any} cmd 
	 * @param {any} params 
	 * @param {any} callback 
	 * 
	 * @memberOf CloudStackClient
	 */
	__execute(cmd, params, callback) {
		if (this.__asyncCommands[cmd] === true) {
			this.executeAsync(cmd, params, callback);
		} else {
			this.executeSync(cmd, params, callback);
		}
	}

	/**
	 * Private method that calculates the request signature for CloudStack API calls
	 * http://docs.cloudstack.apache.org/en/latest/dev.html#signing-api-requests
	 * 
	 * @param {any} queryDict 
	 * @returns 
	 * 
	 * @memberOf CloudStackClient
	 */
	__calculateSignature(queryDict) {
		let hmac = crypto.createHmac('sha1', this.__secretKey);
		let orderedQuery = qs.stringify(queryDict, { encode: true }).replace(/\%5B(\D*?)\%5D/g, '.$1').replace(/\%5B(\d*?)\%5D/g, '[$1]').split('&').sort().join('&').toLowerCase();
		hmac.update(orderedQuery);
		return hmac.digest('base64');
	}
}

module.exports = CloudStackClient;
