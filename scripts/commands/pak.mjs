import fs from 'fs';
import path from 'path';
import PakLoader from '../../source/PakLoader.mjs';
import VirtualFileSystem from '../../source/VirtualFileSystem.mjs';

const fileSystem = new VirtualFileSystem();

export default {

    usage: 'pak <map_name> [<resource_path: csgo>] [<ouput_path>]',
    description: 'Extract pakfile from map bsp.',

    async execute([ mapName, resourcePath = "csgo/", outputFilePath ]) {
        if(!mapName) {
            error('Provide a map file.');
            return;
        }

        if(resourcePath && fs.existsSync(path.resolve(resourcePath))) {
            fileSystem.setRoot(resourcePath);
        } else if(resourcePath) {
            error(`Resource folder "${resourcePath}" not found.`);
            return;
        }

        const pakLoader = new PakLoader(fileSystem);
        const pakfile = await pakLoader.loadPakfile(mapName);

        log(mapName, 'pakfile extracted.');

        const exportFileName = outputFilePath ? outputFilePath : mapName;

        fs.writeFileSync(exportFileName + '.zip', pakfile, 'binary');

        log('Saved pakfile to ' + exportFileName + '.zip');

        return true;
    }
}
