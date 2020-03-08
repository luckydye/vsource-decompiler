import { VVDFile, BSPFile, VPKFile, MDLFile, VMTFile, VTFFile, VTXFile } from '../index.mjs';

import chalk from 'chalk';
import VirtualFileSystem from './VirtualFileSystem.mjs';

const fileSystem = new VirtualFileSystem();
const propTypes = new Map();

function transformPropGeometry(prop) {
    const propGeometry = {
        name: prop.name,
        vertecies: prop.vertecies.flat(),
        indices: prop.indices,
        material: prop.material,
        scale: [ 1, 1, 1 ],
        origin: [ 0, 0, 0 ],
        position: [
            prop.origin[1],
            prop.origin[2],
            prop.origin[0],
        ],
        rotation: [
            prop.angles[0],
            prop.angles[1],
            prop.angles[2],
        ],
    }
    return propGeometry;
}

export class Model {

    static get resourceRoot() {
        return fileSystem.root;
    }

    static set resourceRoot(val) {
        fileSystem.root = val;
    }

    constructor() {
        this.geometry = new Set();
    }

    async loadMap(mapName) {
        this.name = mapName;

        const mapPath = `maps/${mapName}.bsp`;
        log('Loading map', mapPath);

        const map = await fileSystem.getFile(mapPath);
        const bsp = BSPFile.fromDataArray(await map.arrayBuffer());

        log('Reading pakfile...');
        fileSystem.attatchPakfile(Buffer.from(bsp.pakfile.buffer));

        log('Load prop_dynamic ...');

        // for(let prop of bsp.props) {

        //     const modelMeshes = await this.loadProp(prop.model).catch(err => {
        //         console.log('');
        //         error('Failed loading prop_dynamic: ' + prop.model);
        //         log(err);
        //         console.log('');
        //     });

        //     if(!modelMeshes) continue;

        //     for(let propData of modelMeshes) {
        //         const propGeometry = transformPropGeometry({
        //             name: prop.model.replace(/\\+|\/+/g, "_"),
        //             vertecies: propData.vertecies.flat(),
        //             indices: propData.indices,
        //             material: propData.material,
        //             origin: prop.origin,
        //             angles: prop.angles,
        //         });
    
        //         this.geometry.add(propGeometry);
        //     }
        // }

        log('Load map textures...');

        const textures = new Map();
            
        for(let texture of bsp.textures) {
            const mat = await this.loadMaterial(texture.toLocaleLowerCase()).catch(err => {
                error(err);
            });

            if(mat) {
                textures.set(texture, mat);
            }
        }

        log(`${textures.size} of ${bsp.textures.length} textures loaded.`);
        
        // world
        function getMapTexture(textureIndex) {
            const tex = bsp.textures[textureIndex];
            return textures.get(tex);
        }

        const meshes = bsp.convertToMesh();

        for(let mesh of meshes) {
            if(!mesh) continue;

            const material = getMapTexture(mesh.material);

            this.geometry.add({
                name: mapName + "_" + meshes.indexOf(mesh),
                vertecies: mesh.vertecies.flat(),
                indices: mesh.indices,
                material: material,
                scale: [1, 1, 1],
                origin: [0, 0, 0],
                position: [0, 0, 0],
                rotation: [0, 0, 0],
            });
        }

        return;

        log('Load props_static ...');

        await this.loadMapProps(bsp.gamelumps.sprp, (type, prop, propMeshes) => {

            for(let propData of propMeshes) {

                const propGeometry = transformPropGeometry({
                    name: type.name.replace(/\\+|\/+/g, "_") + '_' + propMeshes.indexOf(propData),
                    vertecies: propData.vertecies.flat(),
                    indices: propData.indices,
                    material: propData.material,
                    scale: [
                        prop.UniformScale ? prop.UniformScale.valueOf() : 1, 
                        prop.UniformScale ? prop.UniformScale.valueOf() : 1, 
                        prop.UniformScale ? prop.UniformScale.valueOf() : 1
                    ],
                    origin: [
                        prop.Origin.data[0].valueOf(),
                        prop.Origin.data[1].valueOf(),
                        prop.Origin.data[2].valueOf(),
                    ],
                    angles: [
                        prop.Angles.data[0].valueOf(),
                        prop.Angles.data[1].valueOf(),
                        prop.Angles.data[2].valueOf(),
                    ]
                });
    
                this.geometry.add(propGeometry);
            }
        }).catch(err => {
            error(err);
        });

        log('Done loading map props.');
    }
    
    registerProp(prop) {
        if(!propTypes.has(prop.PropType)) {
            propTypes.set(prop.PropType, {
                name: prop.PropType,
                mdlPath: prop.PropType,
                vvdPath: prop.PropType.replace('.mdl', '.vvd'),
                listeners: [],
            });
        }
    }

    async loadMapProps(props, callback) {
        return new Promise((resolve, reject) => {

            if(props.length == 0) {
                resolve();
                return;
            }

            // collect all different types of props
            for(let prop of props) {

                if(!prop.PropType) {
                    throw new Error('Error decompiling prop gamelump.');
                    continue;
                }

                this.registerProp(prop);
                const type = propTypes.get(prop.PropType);

                type.listeners.push(propData => callback(type, prop, propData));
            }

            // load all different types once
            let propCounter = 0;

            for(let [_, propType] of propTypes) {

                this.loadProp(propType.mdlPath).then(meshes => {
                    for(let listener of propType.listeners) listener(meshes);
                    
                }).catch(err => {
                    console.log('');
                    error(chalk.red('Failed to load prop: ' + propType.mdlPath));
                    log(err);
                    console.log('');
                    
                }).finally(() => {
                    propCounter++;

                    process.stdout.cursorTo(0);
                    process.stdout.write(`[INFO] Loading props ${propCounter.toString()} / ${propTypes.size.toString()}`);
                    
                    if(propCounter == propTypes.size) {
                        resolve();
                        process.stdout.write(`\n`);
                    }
                })
            }
        })
    }

    async loadMaterial(materialName) {

        if(materialName == undefined) {
            throw new Error('Material name undefined.');
        }

        const vmtFile = await fileSystem.getFile(`${materialName}.vmt`);
        let vmt = VMTFile.fromDataArray(await vmtFile.arrayBuffer());

        const patch = vmt.data.patch;
        
        if(patch && patch.include) {
            const vmtFile = await fileSystem.getFile(patch.include);
            vmt = VMTFile.fromDataArray(await vmtFile.arrayBuffer());
        }
        
        const vertexlit = vmt.data.vertexlitgeneric;
        const lightmapped = vmt.data.lightmappedgeneric;
        const unlit = vmt.data.unlitgeneric;
        const world = vmt.data.worldvertextransition;

        const shader = vertexlit || lightmapped || unlit || world;
        if(!shader) {
            throw new Error('Unknown material.');
        }

        const texture = shader['$basetexture'];

        if(!texture) {
            throw new Error('Missing texture.');
        }

        const vtfFile = await fileSystem.getFile(texture.replace('.vtf', '') + '.vtf');
        const vtf = VTFFile.fromDataArray(await vtfFile.arrayBuffer());
        vtf.name = texture;

        return {
            name: materialName,
            translucent: shader['$translucent'],
            texture: vtf,
            material: vmt,
        }
    }

    async loadProp(propType) {
        
        const mdlPath = propType;
        const vddPath = propType.replace('.mdl', '.vvd');
        const vtxPath = propType.replace('.mdl', '.dx90.vtx');

        const prop = {
            materials: [],
        };

        // mdl
        const mdlFile = await fileSystem.getFile(mdlPath);
        const mdl = MDLFile.fromDataArray(await mdlFile.arrayBuffer());

        // textures and materials
        for(let tex of mdl.textures) {
            const materialName = tex.name.toString();
            const mat = await this.loadMaterial(materialName);
            prop.materials.push(mat);
        }

        // geometry info
        const vvdFile = await fileSystem.getFile(vddPath);
        const vvd = VVDFile.fromDataArray(await vvdFile.arrayBuffer());
        const vertecies = vvd.convertToMesh();

        const vtxFile = await fileSystem.getFile(vtxPath);
        const vtx = VTXFile.fromDataArray(await vtxFile.arrayBuffer());

        const propMeshes = [];
        let meshIndex = 0;

        for(let mesh of vtx.meshes) {
            propMeshes.push({
                material: prop.materials[meshIndex],
                indices: mesh.indices,
                vertecies: mesh.vertexindices.map(rv => {
                    const vert = vertecies[rv];
                    if(!vert) {
                        throw new Error('Vertex doesnt exist');
                    }
                    return vert;
                })
            });

            meshIndex++;
        }

        return propMeshes;
    }

    static loadVPK(vpkPath) {
        const load = async () => {
            const vpkFetch = await fileSystem.getFile(vpkPath);
            const vpkData = await vpkFetch.arrayBuffer();
            const vpk = VPKFile.fromDataArray(vpkData);
            return vpk;
        }
        return load();
    }
}
