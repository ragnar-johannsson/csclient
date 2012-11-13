var crypto = require('crypto');
var events = require('events');
var querystring = require('querystring');
var url = require('url');
var APIError = require('./apierror');

function CloudStackClient (options) {
    this.http = require('http');

    for (attribute in options) {
        this[attribute] = options[attribute];
    }
}

CloudStackClient.prototype.execute = function (cmd, params, callback) {
    params['command'] = cmd;
    params['response'] = 'json';
    params['apiKey'] = this.apiKey;
    params['signature'] = this.calculateSignature(params);
    callback = callback || function () {};

    var apiURL = url.parse(this.serverURL)
    apiURL.path += querystring.stringify(params).replace('+', '%20');

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
                return callback(new APIError(res.statusCode, res.headers['X-Description'] || ''));
            }
        });
        res.once('close', function (err) {
            return callback(err);
        });
    }; 

    var req = this.http.get(apiURL, handleResponse);
    req.once('error', function (err) {
        return callback(err);
    });
};

CloudStackClient.prototype.executeAsync = function (cmd, params, callback) {
    var that = this;
    var pollingTime = this.pollingTime || 1000;
    var pollingNumber = this.pollingNumber || 180;

    this.execute(cmd, params, function (err, response) {
        if (err) return callback(err);

        var jobid = response[Object.keys(response)[0]].jobid;
        var queryJobResult = function (polled) {
            that.execute('queryAsyncJobResult', { jobid: jobid }, function (error, jobresult) {
                if (error) return callback(error);

                jobresult = jobresult.queryasyncjobresultresponse;
                if (jobresult.jobstatus === 1 || jobresult.jobstatus === 2) {
                    if (jobresult.jobstatus === 1) return callback(null, response);
                    return callback(new APIError(jobresult.jobresultcode));
                }

                if (polled >= pollingNumber) return callback(new Error('Timeout'));

                setTimeout(queryJobResult, pollingTime, ++polled);
            });
        };

        setTimeout(queryJobResult, pollingTime, 0);
    });
}
    
CloudStackClient.prototype.calculateSignature = function (queryDict) {
    var hmac = crypto.createHmac('sha1', this.secretKey);
    var orderedQuery = querystring.stringify(queryDict).split('&').sort().join('&').toLowerCase();
    hmac.update(orderedQuery);
    return hmac.digest('base64');
};

module.exports = CloudStackClient;
