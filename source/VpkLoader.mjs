import fs from 'fs';
import path from 'path';
import VPKFile from '../files/valve/VPKFile.mjs';

export class VpkLoader {

    static loadVpk(filename, resourceFolder = "csgo") {
        const parts = filename.replace('.vpk', '').split('_');

        const pakName = parts[0].split("\\")[parts[0].split("\\").length-1];
        const pakId = parts[1];

        const file = fs.readFileSync(path.resolve(resourceFolder, filename));
        const vpk = VPKFile.fromDataArray(file.buffer);

        vpk.name = pakName;

        const items = fs.readdirSync(path.resolve(resourceFolder));
        
        for(let item of items) {
            const parts = item.replace('\.vpk', '').split('_');

            if(parts[0] == pakName && parts[1] !== "dir") {
                const index = parseInt(parts[1]);

                vpk.addArchive(index, {
                    async arrayBuffer() {
                        return fs.readFileSync(path.resolve(resourceFolder, item)).buffer;
                    }
                });
            }
        }

        return vpk;
    }

}
