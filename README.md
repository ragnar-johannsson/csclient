## CloudStack API client for Node.js


### Installation

```bash
$ npm install csclient
```


### Usage

The client has one method of note: <b>execute(cmd, params, callback)</b>, where <b><i>cmd</i></b> is a string with the actual API command and <b><i>params</i></b> is a key-value object with optional parameters. 

For example:

```javascript
var CloudStackClient = require('csclient');

var options = {
    apiKey: 'abcd1234',
    secretKey: 'efgh5678',
    serverURL: 'http://host:port/client/api?'
};

var client = new CloudStackClient(options);

client.execute('listVirtualMachines', {}, function (err, response) {
    if (err) {
        if (err.name === 'APIError') {
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

    for (var i = 0; i < response.listvirtualmachinesresponse.virtualmachine.length; i++) {
        var vm = response.listvirtualmachinesresponse.virtualmachine[i];
        console.log(vm.name + " is in state " + vm.state);
    }
});
```


### License

This is free software released under the Simplified BSD License. See the LICENSE file for further information.
