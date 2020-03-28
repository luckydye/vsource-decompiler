import fs from 'fs';
import path from 'path';
import GLTFFile from '../../files/util/GLTFFile.mjs';
import PropLoader from '../../source/PropLoader.mjs';
import VirtualFileSystem from '../../source/VirtualFileSystem.mjs';
import { VpkLoader } from '../../source/VpkLoader.mjs';

const fileSystem = new VirtualFileSystem();

export default {

    usage: "prop <prop name> [<resource_path: csgo>] [<ouput_path>]",
    description: "Decompile CS:GO models from mdl to gltf format.",

    async execute([ propname, resourcePath = "csgo/", outputFilePath, vpkFile = "pak01" ]) {
        if(!propname) {
            error('Provide a prop file.');
            return;
        }

        if(resourcePath && fs.existsSync(path.resolve(resourcePath))) {
            fileSystem.setRoot(resourcePath);
        } else if(resourcePath) {
            error(`Resource folder "${resourcePath}" not found.`);
            return;
        }

        // load vpk
        const vpk = VpkLoader.loadVpk(path.resolve(resourcePath, vpkFile + "_dir.vpk"));
        fileSystem.attatchVPKFile(vpk);

        log('Loading prop.');

        const propLoader = new PropLoader(fileSystem);
        const propMeshes = await propLoader.loadProp(propname + '.mdl');

        const geometry = {
            prop_static: []
        }

        for(let propData of propMeshes) {

            const propGeometry = {
                name: propname + '_' + propMeshes.indexOf(propData),
                vertecies: propData.vertecies,
                uvs: propData.uvs,
                normals: propData.normals,
                indices: propData.indices,
                material: propData.material,
                scale: [1, 1, 1],
                origin: [0, 0, 0],
                position: [0, 0, 0],
                rotation: [0, 0, 0],
            }

            geometry.prop_static.push(propGeometry);
        }

        log('Prop decompiled.');
        
        const exportFileName = (outputFilePath ? outputFilePath : propname).replace(/\/|\\/g, '_');
        const gltfFile = GLTFFile.fromGeometry(geometry);
        fs.writeFileSync(exportFileName + '.gltf', await gltfFile.toString(), 'utf8');

        log('Saved prop to file ' + exportFileName + '.gltf');

        return true;
    }
}
