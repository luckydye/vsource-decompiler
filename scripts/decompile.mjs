#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

import { Model } from '../source/ModelLoader.mjs';
import { S3Texture } from '../files/S3Texture.mjs';
import OBJFile from '../files/OBJFile.mjs';
import MTLFile from '../files/MTLFile.mjs';
import GLTFFile from '../files/GLTFFile.mjs';
import GLBFile from '../files/GLBFile.mjs';

global.log = (...str) => {
    console.log('[INFO]', ...str);
}

global.error = (...str) => {
    console.log(chalk.red('[ERROR]', ...str));
}

const Commands = {

    decompile: {
        usage: 'decompile <map_name> [<ouput_path>] [<resource_path>]',
        description: 'Decompile CS:GO maps from bsp format.',

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

            function writeGltfFile(exportFileName) {
                // GLB file export:
                // const gltfFile = GLBFile.fromGeometry(model.geometry);
                // const arrayBuffer = gltfFile.toBinary();
                // const bin = Buffer.from(arrayBuffer);
                // const test = GLBFile.fromFile(arrayBuffer);
                // console.log(test);
                // fs.writeFileSync(exportFileName + '.glb', bin, 'binary');

                const gltfFile = GLTFFile.fromGeometry(model.geometry);
                fs.writeFileSync(exportFileName + '.gltf', gltfFile.toString(), 'utf8');
            }

            const exportFileName = outputFilePath ? outputFilePath : mapName;
            writeGltfFile(exportFileName);

            function writeObjResources(exportFileName) {
                // write obj file
                const objFile = new OBJFile(mapName);
                objFile.openWriteStream(exportFileName + '.obj');
                objFile.fromGeometry(model.geometry);

                const mtlFile = new MTLFile(mapName);
                mtlFile.openWriteStream(exportFileName + '.mtl');
                mtlFile.fromObjFile(objFile);


                log('Writing textures...');
                // write texture files
                for(let texName of materials.keys()) {
                    const tex = materials.get(texName);
                    const format = tex.format;
                    const data = tex.imageData;
    
                    if(tex.format.type === "NONE") continue;
    
                    const texture = S3Texture.fromDataArray(data, format.type, format.width, format.height);
                    const ddsBuffer = texture.toDDS();
    
                    // write texture
                    if(!fs.existsSync(`textures`)) {
                        fs.mkdirSync(`textures`);
                    }
    
                    const fileBuffer = Buffer.from(ddsBuffer);
                    const writeStream = fs.createWriteStream(`textures/${texName}.dds`);
                    
                    writeStream.write(fileBuffer, 'binary');
                    writeStream.on('finish', () => {});
                    writeStream.on('error', err => {
                        console.log(err);
                        error(`Error writing texture: textures/${texName}.dds`);
                    });
                    writeStream.end();
                }
                log('Textures written.');
            }

            log(mapName, 'decompiled.');
    
            return true;
        }
    }

}

async function main(command, args) {
    if(Commands[command]) {
        const result = await Commands[command].execute(...args);
        if(!result && Commands[command].usage) {
            log(Commands[command].description);
            log(`Usage: ${chalk.green(Commands[command].usage)}`);
        }
    } else {
        log('Commands:', chalk.green(Object.keys(Commands).join(", ")));
    }
}

const command = process.argv.slice(2)[0];
const args = process.argv.slice(3);

main(command, args);

export default Commands;
