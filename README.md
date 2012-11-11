## CloudStack API client for Node.js


### Installation

```bash
$ npm install csclient
```


### Usage

The client has one method of note: <b>execute(cmd, params, callbacks)</b>, where <b><i>cmd</i></b> is a string with the actual API command, <b><i>params</i></b> is a key-value object with optional parameters and <b><i>callbacks</i></b> the object containing the <i>success, apiError</i> and <i>error</i> callbacks. 

For example:

```javascript
var CloudStackClient = require('csclient').CloudStackClient;

var options = {
    apiKey: 'abcd1234',
    secretKey: 'efgh5678',
    serverURL: 'http://host:port/client/api?'
};

var client = new CloudStackClient(options);

client.execute('listVirtualMachines', {}, {
    success: function (response) {
        for (var i = 0; i < response.listvirtualmachinesresponse.virtualmachine.length; i++) {
            var vm = response.listvirtualmachinesresponse.virtualmachine[i];
            console.log(vm.name + " is in state " + vm.state);
        }
    },
    apiError: function (errorCode, errorMessage) {
        switch (errorCode) {
        case 401:
            console.log('Unauthorized.');
            break;
        case 530:
            console.log('Parameter error: ' + errorMessage);
            break;
        default:
            console.log('API error ' + errorCode + ': ' + errorMessage);
        }
    },
    error: function (err) {
        console.log('Oops, I did it again. ' + err.message);
    }
});
```


### License

This is free software released under the Simplified BSD License. See the LICENSE file for further information.
