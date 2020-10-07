import fs from 'fs';
import path from 'path';
import GLTFFile from '../../files/util/GLTFFile.mjs';
import MapLoader from '../../source/MapLoader.mjs';
import VirtualFileSystem from '../../source/VirtualFileSystem.mjs';
import { VpkLoader } from '../../source/VpkLoader.mjs';

const fileSystem = new VirtualFileSystem();

export default {

    usage: 'map <map_name> [<resource_path: csgo>] [<ouput_path>]',
    description: 'Decompile CS:GO maps from bsp to gltf format.',

    async execute([ mapName, resourcePath = "csgo/", outputFilePath, vpkFile = "pak01" ]) {
        if(!mapName) {
            error('Provide a map file.');
            return;
        }

        const exportDirPath = outputFilePath ? outputFilePath : '.';

        if(!fs.existsSync(path.resolve(exportDirPath))) {
            error('Output path does not exist.');
            return;
        }

        if(resourcePath && fs.existsSync(path.resolve(resourcePath))) {
            fileSystem.setRoot(resourcePath);
        } else if(resourcePath) {
            error(`Resource folder "${resourcePath}" not found.`);
            return;
        }

        // load vpk
        const vpk = VpkLoader.loadVpk(path.resolve(resourcePath, vpkFile + "_dir.vpk"), "");
        fileSystem.attatchVPKFile(vpk);

        const mapLoader = new MapLoader(fileSystem);
        const mapGeometry = await mapLoader.loadMap(mapName);

        log(mapName, 'decompiled.');
        
        // GLB file export:
        // const gltfFile = GLBFile.fromGeometry(mapGeometry);
        // const arrayBuffer = gltfFile.toBinary();
        // const bin = Buffer.from(arrayBuffer);
        // const test = GLBFile.fromFile(arrayBuffer);
        // console.log(test);
        // fs.writeFileSync(exportDirPath + '.glb', bin, 'binary');

        const gltfFile = GLTFFile.fromGeometry(mapGeometry);
        const exportDesitination = path.resolve(exportDirPath, mapName + '.gltf');
        fs.writeFileSync(exportDesitination, await gltfFile.toString(), 'utf8');

        log('Saved map to file ' + exportDirPath + '.gltf');

        return true;
    }
}
