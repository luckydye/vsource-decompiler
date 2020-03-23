import fs from 'fs';
import path from 'path';
import VpkLoader from '../../source/VpkLoader.mjs';

export default {

    usage: 'vpk <file_name>',
    description: 'Read .vpk filed.',

    async execute([ filename ]) {
        if(!filename) {
            error('Provide a file.');
            return;
        }

        log(filename, 'loading file.');

        const vpklloader = new VpkLoader();

        const file = fs.readFileSync(path.resolve(filename));
        const vpk = await vpklloader.loadVPK(file.buffer);

        log(filename, 'parsed.');

        return true;
    }
}
