import fs from 'fs';
import path from 'path';
import DEMFile from '../../files/source/DEMFile.mjs';

export default {

    usage: 'demo <file_name>',
    description: 'Read .dem files.',

    async execute([ filename ]) {
        if(!filename) {
            error('Provide a file.');
            return;
        }

        log(filename, 'loading file.');

        const file = fs.readFileSync(path.resolve(filename));
        const demo = new DEMFile(file);

        log(filename, 'parsed.');

        return true;
    }
}
