const fs = require('fs');
const validator = require('gltf-validator');
 
const asset = fs.readFileSync('/Program Files (x86)/Steam/steamapps/common/Counter-Strike Global Offensive/bomb_shells_2_metal.gltf');
 
validator.validateBytes(new Uint8Array(asset))
    .then((report) => {
        
        for(let msg of report.issues.messages) {
            console.log(msg);
        }

        console.info('Validation succeeded: ', report);
    })
    .catch((error) => console.error('Validation failed: ', error));