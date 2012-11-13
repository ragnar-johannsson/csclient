var events = require('events');
var util= require('util');
var CSClient = require('../lib/client');

var listVMsJSONResponse = 
    '{' +
    '    "listvirtualmachinesresponse": {' +
    '        "virtualmachine": [' +
    '            {' +
    '                "account": "dfc78d20-e33e-11e1-9b23-0800200c9a66", ' +
    '                "cpunumber": 1, ' +
    '                "cpuspeed": 250, ' +
    '                "created": "2012-05-29T17:54:19+0000", ' +
    '                "displayname": "i-abcdefgh", ' +
    '                "domain": "ROOT", ' +
    '                "domainid": 1, ' +
    '                "guestosid": 143, ' +
    '                "haenable": false, ' +
    '                "hypervisor": "KVM", ' +
    '                "id": 207011, ' +
    '                "keypair": "default", ' +
    '                "memory": 256, ' +
    '                "name": "i-abcdefgh", ' +
    '                "nic": [' +
    '                    {' +
    '                        "gateway": "10.1.1.1", ' +
    '                        "id": 195227, ' +
    '                        "ipaddress": "10.1.1.151", ' +
    '                        "isdefault": true, ' +
    '                        "netmask": "255.255.255.0", ' +
    '                        "networkid": 11478, ' +
    '                        "traffictype": "Guest", ' +
    '                        "type": "Virtual"' +
    '                    }' +
    '                ], ' +
    '                "passwordenabled": true, ' +
    '                "rootdeviceid": 0, ' +
    '                "rootdevicetype": "GlusterFS", ' +
    '                "securitygroup": [' +
    '                    {' +
    '                        "description": "Default Security Group", ' +
    '                        "id": 100081, ' +
    '                        "name": "default"' +
    '                    }' +
    '                ], ' +
    '                "serviceofferingid": 9, ' +
    '                "serviceofferingname": "Nano (t1.nano)", ' +
    '                "state": "Stopped", ' +
    '                "staticnatip": "172.16.21.80", ' +
    '                "templatedisplaytext": "Ubuntu Server 11.10 (64-bit)", ' +
    '                "templateid": 123, ' +
    '                "templatename": "Ubuntu Server 11.10", ' +
    '                "vminstancename": "i-abcdefgh", ' +
    '                "vmtype": "regular", ' +
    '                "zoneid": 1, ' +
    '                "zonename": "is-1a"' +
    '            }, ' +
    '            {' +
    '                "account": "dfc78d20-e33e-11e1-9b23-0800200c9a66", ' +
    '                "cpunumber": 1, ' +
    '                "cpuspeed": 250, ' +
    '                "cpuused": "0%", ' +
    '                "created": "2012-07-01T03:54:09+0000", ' +
    '                "displayname": "i-12345678", ' +
    '                "domain": "ROOT", ' +
    '                "domainid": 1, ' +
    '                "guestosid": 133, ' +
    '                "haenable": false, ' +
    '                "hypervisor": "KVM", ' +
    '                "id": 129446, ' +
    '                "keypair": "default", ' +
    '                "memory": 256, ' +
    '                "name": "i-12345678", ' +
    '                "networkkbsread": 422, ' +
    '                "networkkbswrite": 0, ' +
    '                "nic": [' +
    '                    {' +
    '                        "gateway": "10.1.1.1", ' +
    '                        "id": 300187, ' +
    '                        "ipaddress": "10.1.1.231", ' +
    '                        "isdefault": true, ' +
    '                        "netmask": "255.255.255.0", ' +
    '                        "networkid": 11478, ' +
    '                        "traffictype": "Guest", ' +
    '                        "type": "Virtual"' +
    '                    }' +
    '                ], ' +
    '                "passwordenabled": true, ' +
    '                "rootdeviceid": 0, ' +
    '                "rootdevicetype": "GlusterFS", ' +
    '                "securitygroup": [' +
    '                    {' +
    '                        "description": "Default Security Group", ' +
    '                        "id": 100081, ' +
    '                        "name": "default"' +
    '                    }' +
    '                ], ' +
    '                "serviceofferingid": 9, ' +
    '                "serviceofferingname": "Nano (t1.nano)", ' +
    '                "state": "Running", ' +
    '                "staticnatip": "unallocated", ' +
    '                "templatedisplaytext": "Debian 6.0 (64-bit)", ' +
    '                "templateid": 2018, ' +
    '                "templatename": "Debian 6.0", ' +
    '                "vminstancename": "i-12345678", ' +
    '                "vmtype": "regular", ' +
    '                "zoneid": 1, ' +
    '                "zonename": "is-1a"' +
    '            }' +
    '        ]' +
    '    }' +
    '}';

var associateIpJSONRespone =
    '{' +
    '    "associateipaddressresponse": {' +
    '        "id": 1, ' +
    '        "jobid": 1 ' +
    '    }' +
    '}';

var queryAsyncJobResult1 =
    '{' +
    '    "queryasyncjobresultresponse": {' +
    '        "jobid": 247148, ' +
    '        "jobprocstatus": 0, ' +
    '        "jobresultcode": 0, ' +
    '        "jobstatus": 0 ' +
    '    }' +
    '}';

var queryAsyncJobResult2 =
    '{' +
    '    "queryasyncjobresultresponse": {' +
    '        "jobid": 247148, ' +
    '        "jobprocstatus": 0, ' +
    '        "jobresultcode": 0, ' +
    '        "jobstatus": 1 ' +
    '    }' +
    '}';

exports.testSignature = function (test) {
    var client = new CSClient({secretKey : '2222' });
    var signature = client.calculateSignature({command: 'test', param: 'test-param'});
    test.ok(signature === 'K1u7VA0YQ729tNdGWsXuTZhnAB0=', 'Computed signature is incorrect');
    test.done();
};

exports.testEncoding = function (test) {
    var http = getMockHttp(200);
    var client = new CSClient({apiKey: '1111', secretKey : '2222', serverURL: 'http://the.host/indeed?', http: http});
    http.get = function (options, callback) {
        test.ok(options.path.indexOf('+') === -1, 'Incorrect URL encoding: "+" found in path string.');
        return http.mockRequest;
    };

    test.expect(1);
    client.execute('listSomething', {param: 'sp ace'});
    test.done();
};

exports.testData = function(test) {
    var http = getMockHttp(200);
    var client = new CSClient({apiKey: '1111', secretKey : '2222', serverURL: 'http://the.host/indeed?', http: http});
    http.get = function (options, callback) {
        var path = '/indeed?command=listVirtualMachines&response=json&apiKey=1111&signature=bpsSS03m%2FSFtNeJAx6fufCSRNbQ%3D';
        test.ok(options.path === path, 'Incorrect parameter path generated');
        callback(http.mockResponse);
        return http.mockRequest;
    };

    test.expect(5)
    client.execute('listVirtualMachines', {}, function (err, data) {
        if (err) return test.ok(false, 'Should not be called');

        test.ok(data['listvirtualmachinesresponse'] !== undefined, "Invalid response");
        test.ok(data['listvirtualmachinesresponse']['virtualmachine'] !== undefined, "Invalid response");
        test.ok(data['listvirtualmachinesresponse']['virtualmachine'].length === 2, "Invalid response");
        test.ok(data['listvirtualmachinesresponse']['virtualmachine'][0].name === 'i-abcdefgh', "Invalid response");
    });

    http.mockResponse.emit('data', listVMsJSONResponse);
    http.mockResponse.emit('end');

    test.done();
};


exports.testIncompleteData = function (test) {
    var http = getMockHttp(200);
    var client = new CSClient({apiKey: '1111', secretKey : '2222', serverURL: 'http://the.host/indeed?', http: http});

    test.expect(2);
    client.execute('listVirtualMachines', {}, function (err) {
        if (!err) return test.ok(false, 'No error raised');

        test.ok(err.name == 'SyntaxError', 'Incorrect error');
        test.ok(err.message == 'Unexpected end of input', 'Incorrect error');
    });

    http.mockResponse.emit('data', listVMsJSONResponse.slice(0, listVMsJSONResponse.length/2));
    http.mockResponse.emit('end');

    test.done();
};

exports.testApiErrors = function (test) {
    var http = getMockHttp(401);
    var client = new CSClient({apiKey: '1111', secretKey : '2222', serverURL: 'http://the.host/indeed?', http: http});

    test.expect(2);
    client.execute('listVirtualMachines', {}, function (err) {
        if (!err) return test.ok(false, 'No error raised');

        test.ok(err.name == 'APIError', 'Incorrect error');
        test.ok(err.code == 401, 'Incorrect error code');
    });

    http.mockResponse.emit('data', listVMsJSONResponse);
    http.mockResponse.emit('end');

    test.done();
};

exports.testAsync = function (test) {
    var http = getMockHttp(200);
    var client = new CSClient({apiKey: '1111', secretKey : '2222', serverURL: 'http://the.host/indeed?', http: http});

    test.expect(1);
    client.executeAsync('associateIpAddress', { zoneId: '1' }, function (err, response) {
        if (err) test.ok(false, err);
        test.ok(response.associateipaddressresponse.id === 1, 'Incorrect response');
    });

    http.mockResponse.emit('data', associateIpJSONRespone);
    http.mockResponse.emit('end');

    setTimeout(function () {
        http.mockResponse.emit('data', queryAsyncJobResult1);
        http.mockResponse.emit('end');
        setTimeout(function () {
            http.mockResponse.emit('data', queryAsyncJobResult2);
            http.mockResponse.emit('end');
        }, 1100);
    }, 1100);

    setTimeout(function () { test.done(); }, 3000);
}

function getMockHttp (statusCode) {
    function HttpResponse () { 
        this.statusCode = statusCode; 
        this.headers = {}; 
    }

    function HttpRequest () {

    }

    function Http () {
        this.mockResponse = new HttpResponse();
        this.mockRequest = new HttpRequest();
        this.get = function (options, callback) {
            callback(this.mockResponse);
            return this.mockRequest;
        };
    }

    util.inherits(HttpResponse, events.EventEmitter);
    util.inherits(HttpRequest, events.EventEmitter);

    return new Http();
}
