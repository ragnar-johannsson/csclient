var crypto = require('crypto');
var events = require('events');
var querystring = require('querystring');
var url = require('url');

function CloudStackClient (options) {
    this.http = require('http');

    for (attribute in options) {
        this[attribute] = options[attribute];
    }

    if (this.serverURL !== undefined && this.serverURL !== '') {
        this.serverURL = url.parse(this.serverURL);
    }
}

CloudStackClient.prototype.execute = function (cmd, params, callbacks) {
    params['command'] = cmd;
    params['response'] = 'json';
    params['apiKey'] = this.apiKey;
    params['signature'] = this.calculateSignature(params);

    this.serverURL.path += querystring.stringify(params).replace('+', '%20');

    callbacks = callbacks || {};
    callbacks.success = callbacks.success || function () {};
    callbacks.error = callbacks.error || function () {};
    callbacks.apiError = callbacks.apiError || function () {};

    var handleResponse = function (res) {
        var data = '';
        res.on('data', function (chunk) { data += chunk; });
        res.once('end', function () { 
            res.removeAllListeners('close');
            if (res.statusCode == 200) {
                try {
                    callbacks.success(JSON.parse(data)); 
                } catch (err) {
                    callbacks.error(err);
                }
            } else {
                callbacks.apiError(res.statusCode, res.headers['X-Description'] || '');
            }
        });
        res.once('close', function (err) {
            callbacks.error(err);
        });
    }; 

    var req = this.http.get(this.serverURL, handleResponse);
    req.once('error', function (err) {
        callbacks.error(err);
    });
};
    
CloudStackClient.prototype.calculateSignature = function (queryDict) {
    var hmac = crypto.createHmac('sha1', this.secretKey);
    var orderedQuery = querystring.stringify(queryDict).split('&').sort().join('&').toLowerCase();
    hmac.update(orderedQuery);
    return hmac.digest('base64');
};

exports.CloudStackClient = CloudStackClient;
