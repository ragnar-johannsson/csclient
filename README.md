## CloudStack API client for Node.js


### Installation

```bash
$ npm install csclient
```


### Usage

The client has three methods of note:

<b>executeSync(cmd, params, callback)</b>, where <b><i>cmd</i></b> is a string with the actual API command and <b><i>params</i></b> is a key-value object with optional parameters.

The other one, <b>executeAsync(cmd, params, callback)</b>, is for CloudStack's async API calls, polling until a result is received, or a timeout reached.

The third method <b>execute</b> is available with two modes:

* <b>Single Executor</b>
In this mode the execute method will be able to execute both sync and async requests.
To enable this mode, set the singleExecutor attribute to true while creating the client instance.
The method is available after the ready event has been emitted.

* <b>Separate Executor</b>
In this mode, the execute method acts as an alias to executeSync. It is immediately available, although the ready event is still emitted.

The <b>execute</b> method with Single Executor mode may be preferable as it takes away the reponsibility of identifying requests as async/sync away from the developer.

```javascript
var CloudStackClient = require('csclient');

var options = {
    apiKey: 'abcd1234',                         // (mandatory)
    secretKey: 'efgh5678',                      // (mandatory)
    baseUrl: 'http://host:port/client/api?',    // (mandatory)
    pollingTime: 500,           // in milliseconds (optional)
    pollingNumber: 5,                           // (optional)
    singleExecutor: true                        // (optional)
};

var client = new CloudStackClient(options);

var handleError = (err) => {
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

client.on ('ready', () => {

    client.execute('listVirtualMachines', {}, (err, response) => {
        if (err) return handleError(err);

        response = response.listvirtualmachinesresponse;
        for (var i = 0; i < response.count; i++) {
            var vm = response.virtualmachine[i];
            console.log(vm.name + " is in state " + vm.state);
        }
    });

    client.execute('associateIpAddress', { zoneid: 1 }, (err, response) => {
        if (err) return handleError(err);

        response = response.associateipaddressresponse;
        console.log('Id of IP address associated: ' + response.id);
    });

});

```


### Deprecation Note:
The <b>serverURL</b> attribute has been deprecated in favour of baseUrl. It will continue to work in this version, but will be removed in the future.

### License

This is free software released under the Simplified BSD License. See the LICENSE file for further information.
