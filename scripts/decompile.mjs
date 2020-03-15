#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { command, main } from './cli.mjs';

import { Model } from '../source/ModelLoader.mjs';
import { S3Texture } from '../files/S3Texture.mjs';
import OBJFile from '../files/OBJFile.mjs';
import MTLFile from '../files/MTLFile.mjs';
import GLTFFile from '../files/GLTFFile.mjs';
import GLBFile from '../files/GLBFile.mjs';

command('prop', {
    usage: "prop <prop name> [<resource_path: csgo>] [<ouput_path>]",
    description: "Decompile CS:GO models from mdl to gltf format.",

    async execute(propname, resourcePath = "csgo/", outputFilePath) {
        if(!propname) {
            error('Provide a prop file.');
            return;
        }

        if(resourcePath && fs.existsSync(path.resolve(resourcePath))) {
            Model.resourceRoot = resourcePath;
        } else if(resourcePath) {
            error(`Resource folder "${resourcePath}" not found.`);
            return;
        }

        log('Loading prop.');

        const model = new Model();
        const propMeshes = await model.loadProp(propname + '.mdl');

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

            model.geometry.prop_static.push(propGeometry);
        }

        log('Prop decompiled.');
        
        const exportFileName = outputFilePath ? outputFilePath : propname;
        const gltfFile = GLTFFile.fromGeometry(model.geometry);
        fs.writeFileSync(exportFileName + '.gltf', gltfFile.toString(), 'utf8');

        log('Saved prop to file ' + exportFileName + '.gltf');

        return true;
    }
});

command('map', {
    usage: 'map <map_name> [<resource_path: csgo>] [<ouput_path>]',
    description: 'Decompile CS:GO maps from bsp to gltf format.',

    async execute(mapName, resourcePath = "csgo/", outputFilePath) {
        if(!mapName) {
            error('Provide a map file.');
            return;
        }

        if(resourcePath && fs.existsSync(path.resolve(resourcePath))) {
            Model.resourceRoot = resourcePath;
        } else if(resourcePath) {
            error(`Resource folder "${resourcePath}" not found.`);
            return;
        }

        const model = new Model();
        await model.loadMap(mapName);

        log(mapName, 'decompiled.');

        const exportFileName = outputFilePath ? outputFilePath : mapName;
        
        // GLB file export:
        // const gltfFile = GLBFile.fromGeometry(model.geometry);
        // const arrayBuffer = gltfFile.toBinary();
        // const bin = Buffer.from(arrayBuffer);
        // const test = GLBFile.fromFile(arrayBuffer);
        // console.log(test);
        // fs.writeFileSync(exportFileName + '.glb', bin, 'binary');

        const gltfFile = GLTFFile.fromGeometry(model.geometry);
        fs.writeFileSync(exportFileName + '.gltf', gltfFile.toString(), 'utf8');

        log('Saved map to file ' + exportFileName + '.gltf');

        return true;
    }
});

command('pak', {
    usage: 'pak <map_name> [<resource_path: csgo>] [<ouput_path>]',
    description: 'Extract pakfile from map bsp.',

    async execute(mapName, resourcePath = "csgo/", outputFilePath) {
        if(!mapName) {
            error('Provide a map file.');
            return;
        }

        if(resourcePath && fs.existsSync(path.resolve(resourcePath))) {
            Model.resourceRoot = resourcePath;
        } else if(resourcePath) {
            error(`Resource folder "${resourcePath}" not found.`);
            return;
        }

        const model = new Model();
        const pakfile = await model.loadPakfile(mapName);

        log(mapName, 'pakfile extracted.');

        const exportFileName = outputFilePath ? outputFilePath : mapName;

        fs.writeFileSync(exportFileName + '.zip', pakfile, 'binary');

        log('Saved pakfile to ' + exportFileName + '.zip');

        return true;
    }
});

main();
