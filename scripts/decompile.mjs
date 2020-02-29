#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

import { Model } from '../source/ModelLoader.mjs';
import OBJFile from '../files/OBJFile.mjs';

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

        async execute(mapName, resourcePath = "res/", outputFilePath) {
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
    
            const obj = OBJFile.fromGeometry(model.geometry);

            console.log(obj.textures);
    
            log(model.name, 'decompiled.');
    
            fs.writeFileSync(outputFilePath ? outputFilePath : model.name + '.obj', obj);
    
            return model;
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
