#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

import { Model } from '../source/ModelLoader.mjs';
import { S3Texture } from '../files/S3Texture.mjs';
import OBJFile from '../files/OBJFile.mjs';
import MTLFile from '../files/MTLFile.mjs';

function log(...str) {
    console.log('[INFO]', ...str);
}

function error(...str) {
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

            const exportFileName = outputFilePath ? outputFilePath : model.name;
    
            // write obj file
            const objFile = new OBJFile(model.name);
            objFile.openWriteStream(exportFileName + '.obj');
            objFile.fromGeometry(model.geometry);

            const mtlFile = new MTLFile(model.name);
            mtlFile.openWriteStream(exportFileName + '.mtl');
            mtlFile.fromObjFile(objFile);

            // write texture files
            for(let texName in objFile.materials) {
                const tex = objFile.materials[texName];
                const format = tex.format;
                const data = tex.imageData;
                let name = tex.name;

                if(tex.format.type === "NONE") continue;

                const texture = S3Texture.fromDataArray(data, format.type, format.width, format.height);
                const ddsBuffer = texture.toDDS();

                // write texture
                const dirPath = name.split("/");
                if(!fs.existsSync('res/textures/' + dirPath[0])) {
                    fs.mkdirSync('res/textures/' + dirPath[0]);
                }

                const fileBuffer = Buffer.from(ddsBuffer);
                const writeStream = fs.createWriteStream(`res/textures/${name}.dds`);
                
                writeStream.write(fileBuffer, 'binary');
                writeStream.on('finish', () => {
                    console.log(`wrote: res/textures/${name}.dds`, chalk.green('OK'));
                });
                writeStream.end();
            }

            log(model.name, 'decompiled.');
    
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
