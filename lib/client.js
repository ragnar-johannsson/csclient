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

CloudStackClient.prototype.execute = function (cmd, params, callback) {
    params['command'] = cmd;
    params['response'] = 'json';
    params['apiKey'] = this.apiKey;
    params['signature'] = this.calculateSignature(params);
    callback = callback || function () {};

    this.serverURL.path += querystring.stringify(params).replace('+', '%20');

    var handleResponse = function (res) {
        var data = '';
        res.on('data', function (chunk) { data += chunk; });
        res.once('end', function () { 
            res.removeAllListeners('close');
            if (res.statusCode == 200) {
                try {
                    return callback(null, JSON.parse(data));
                } catch (err) {
                    return callback(err);
                }
            } else {
                var err = new Error();

                err.name = 'APIError';
                err.code = res.statusCode;
                err.message = res.headers['X-Description'] || '';

                return callback(err);
            }
        });
        res.once('close', function (err) {
            return callback(err);
        });
    }; 

    var req = this.http.get(this.serverURL, handleResponse);
    req.once('error', function (err) {
        return callback(err);
    });
};
    
CloudStackClient.prototype.calculateSignature = function (queryDict) {
    var hmac = crypto.createHmac('sha1', this.secretKey);
    var orderedQuery = querystring.stringify(queryDict).split('&').sort().join('&').toLowerCase();
    hmac.update(orderedQuery);
    return hmac.digest('base64');
};

module.exports = CloudStackClient;
