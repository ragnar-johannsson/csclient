## CloudStack API client for Node.js


### Installation

```bash
$ npm install csclient
```


### Usage

The client has two methods of note: <b>execute(cmd, params, callback)</b>, where <b><i>cmd</i></b> is a string with the actual API command and <b><i>params</i></b> is a key-value object with optional parameters. The other one, <b>executeAsync(cmd, params, callback)</b>, is for CloudStack's async API calls, polling until a result is received, or a timeout reached.

```javascript
var CloudStackClient = require('csclient');

var options = {
    apiKey: 'abcd1234',
    secretKey: 'efgh5678',
    serverURL: 'http://host:port/client/api?'
};

var client = new CloudStackClient(options);

var handleError = function (err) {
    if (err.name === 'APIError') {
        switch (err.code) {
        case 401:
            return console.log('Unauthorized.');
        case 530:
            return console.log('Parameter error: ' + err.message);
        default:
            return console.log('API error ' + err.code + ': ' + err.message);
        }
    } else {
        return console.log('Oops, I did it again. ' + err.message);
    }
}

client.execute('listVirtualMachines', {}, function (err, response) {
    if (err) return handleError(err);

    response = response.listvirtualmachinesresponse;
    for (var i = 0; i < response.virtualmachine.length; i++) {
        var vm = response.virtualmachine[i];
        console.log(vm.name + " is in state " + vm.state);
    }
});

client.executeAsync('associateIpAddress', { zoneid: 1 }, function (err, response) {
    if (err) return handleError(err);

    response = response.associateipaddressresponse;
    console.log('Id of IP address associated: ' + response.id);
});
```


### License

This is free software released under the Simplified BSD License. See the LICENSE file for further information.
