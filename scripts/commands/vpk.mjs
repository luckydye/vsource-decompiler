import fs from 'fs';
import path from 'path';
import VPKFile from '../../files/valve/VPKFile.mjs';
import { VpkLoader } from '../../source/VpkLoader.mjs';

export default {

    usage: 'vpk <file_name>',
    description: 'Extract files from .vpk files.',

    async execute([ filename ]) {
        if(!filename) {
            error('Provide a file.');
            return;
        }

        log(filename, 'loading file.');

        const vpk = VpkLoader.loadVpk(filename);
        const pakName = vpk.name;

        let filesExtracted = 0;

        if(!fs.existsSync(path.resolve(pakName))) {
            fs.mkdirSync(path.resolve(pakName));
        } else {
            warn('Folder ' + pakName + ' already exists.');
        }

        const files = Object.keys(vpk.files);

        for(let file of files) {
            const filePath = path.resolve(pakName, file);

            if(!fs.existsSync(filePath)) {
                
                const fileBuffer = await vpk.getFile(file);

                writeFileRecursive(pakName, file, new Uint8Array(fileBuffer)).then(() => {
                    filesExtracted++;

                    log(filesExtracted, '/', files.length, ' | ', file);

                    if(filesExtracted == files.length) {
                        log('done');
                    }
                }).catch(err => error(err));
            } else {
                filesExtracted++;
                log(filesExtracted, '/', files.length, ' | ', file);

                if(filesExtracted == files.length) {
                    log('done');
                }
            }
        }

        log(filename, 'parsed.');

        return true;
    }
}

async function writeFileRecursive(dir, file, data) {
    return new Promise(resolve => {
        const filePath = path.resolve(dir, file);
        const p = filePath.split('\\');

        let index = 1;

        for(let folder of p.slice(1, p.length)) {
            const folderPath = path.resolve(p.slice(0, index).join('\\'));
            
            if(!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }

            index++;
        }

        const error = fs.writeFileSync(filePath, data, 'binary');

        if(!error) {
            resolve();
        }
    })
}