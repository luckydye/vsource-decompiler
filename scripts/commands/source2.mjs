import fs from 'fs';
import path from 'path';
import ValveFile from '../../files/source2/ValveFile.mjs';

export default {

    usage: 'source2 <file_name>',
    description: 'Read source2 files.',

    async execute([ filename ]) {
        if(!filename) {
            return;
        }

        const fileBuffer = fs.readFileSync(path.resolve(filename));
        const vmat = new ValveFile(fileBuffer.buffer);

        return true;
    }
}
