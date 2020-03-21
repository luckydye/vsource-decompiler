const fs = require('fs');
const validator = require('gltf-validator');
 
const asset = fs.readFileSync(process.argv.slice(2)[0]);
 
validator.validateBytes(new Uint8Array(asset)).then((report) => {
        
    for(let msg of report.issues.messages) {
        console.log(msg);
    }

    console.info('Validation succeeded: ', report);

}).catch((error) => console.error('Validation failed: ', error));
