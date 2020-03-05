import { VVDFile, BSPFile, VPKFile, MDLFile, VMTFile, VTFFile, VTXFile } from '../index.mjs';

import chalk from 'chalk';
import VirtualFileSystem from './VirtualFileSystem.mjs';

const fileSystem = new VirtualFileSystem();
const propTypes = new Map();

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

    async loadMap(mapName) {
        this.name = mapName;

        const mapPath = `maps/${mapName}.bsp`;
        log('Loading map', mapPath);

        const map = await fileSystem.getFile(mapPath);
        const bsp = BSPFile.fromDataArray(await map.arrayBuffer());
        const meshes = bsp.convertToMesh();

        log('Reading pakfile.');
        fileSystem.attatchPakfile(Buffer.from(bsp.pakfile.buffer));

        log('Load map textures...');
        const textures = await this.loadMapTextures(bsp.textures);
        log(`${textures.size} of ${bsp.textures.length} textures loaded.`);
        
        // world
        function getMapTexture(textureIndex) {
            const tex = bsp.textures[textureIndex];
            const vtf = textures.get(tex);

            return vtf;
        }

        for(let mesh of meshes) {
            if(!mesh) continue;

            const material = getMapTexture(mesh.material);
            const objectName = material ? mapName + "__" + mesh.material : mapName;

            this.geometry.add({
                name: objectName,
                vertecies: mesh.vertecies.flat(),
                indices: mesh.indices,
                material: material,
                scale: [1, 1, 1],
                origin: [0, 0, 0],
                position: [0, 0, 0],
                rotation: [0, 0, 0],
            });
        }

        log('Load map props...');
        await this.loadMapProps(bsp.gamelumps.sprp, (type, prop, propData) => {

            const propGeometry = {
                vertecies: propData.vertecies.flat(),
                indices: propData.indices,
                name: type.name.replace(/\\+|\/+/g, "_"),
                material: propData.textures[0],
                scale: [
                    prop.UniformScale.valueOf() || 1, 
                    prop.UniformScale.valueOf() || 1, 
                    prop.UniformScale.valueOf() || 1
                ],
                origin: [0, 0, 0],
                position: [
                    -prop.Origin.data[0].data,
                    prop.Origin.data[2].data,
                    prop.Origin.data[1].data,
                ],
                rotation: [
                    prop.Angles.data[0].data * Math.PI / 180,
                    prop.Angles.data[1].data * Math.PI / 180,
                    prop.Angles.data[2].data * Math.PI / 180,
                ],
            }

            this.geometry.add(propGeometry);
        });
        log('Done loading map props.');
    }

    async loadMapTextures(textureArray) {
        return new Promise(async (resolve, reject) => {
            const textures = new Map();
            
            for(let texture of textureArray) {

                const resPath = `${texture.toLocaleLowerCase()}.vmt`;
                await fileSystem.getFile(resPath).then(async vmtFile => {
                    const vmt = VMTFile.fromDataArray(await vmtFile.arrayBuffer());

                    if(vmt && vmt.data.lightmappedgeneric) {
                        const materialTexture = vmt.data.lightmappedgeneric['$basetexture'];
    
                        if(materialTexture) {
                            const resPath = `${materialTexture.toLocaleLowerCase()}.vtf`;
                            await fileSystem.getFile(resPath).then(async res => {
                                const vtf = VTFFile.fromDataArray(await res.arrayBuffer());
                                vtf.name = materialTexture.toLocaleLowerCase().replace(/\\|\//g, "/");
                                textures.set(texture, vtf);
                            }).catch(err => {
                                error('Missing map texture ' + resPath);
                                log(err);
                                console.log('');
                            });
                        }
                    }
                    if(vmt && vmt.data.worldvertextransition) {
                        const materialTexture = vmt.data.worldvertextransition['$basetexture'];
    
                        if(materialTexture) {
                            const resPath = `${materialTexture.toLocaleLowerCase()}.vtf`;
                            await fileSystem.getFile(resPath).then(async res => {
                                const vtf = VTFFile.fromDataArray(await res.arrayBuffer());
                                vtf.name = materialTexture.toLocaleLowerCase().replace(/\\|\//g, "/");
                                textures.set(texture, vtf);
                            }).catch(err => {
                                error('Missing map texture ' + resPath);
                                log(err);
                                console.log('');
                            });
                        }
                    }

                    // want to check if texture loaded correctly? check with "!textures.has(texture)"
                }).catch(err => {
                    console.error(err);
                })
            }

            resolve(textures);
        })
    }

    async loadMapProps(props, callback) {
        return new Promise((resolve, reject) => {
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

                this.loadProp(propType).then(p => {
                    for(let listener of propType.listeners) listener(p);
                    
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

    async loadProp(propType) {
        const prop = {
            materials: [],
            textures: []
        };

        // mdl
        const mdlFile = await fileSystem.getFile(propType.mdlPath);
        const mdl = MDLFile.fromDataArray(await mdlFile.arrayBuffer());

        // textures and materials
        for(let tex of mdl.textures) {
            const texPath = tex.path;

            if(texPath == undefined) {
                continue;
            }

            const vmtFile = await fileSystem.getFile(`${texPath}.vmt`);

            const vmt = VMTFile.fromDataArray(await vmtFile.arrayBuffer());
            // not used right now:
            // prop.materials.push(vmt);
    
            // TODO: texPath != .vtx path, look harder! in the vmt?

            const vtfFile = await fileSystem.getFile(`${texPath}.vtf`);
            const vtf = VTFFile.fromDataArray(await vtfFile.arrayBuffer());
            vtf.name = texPath;
            prop.textures.push(vtf);
        }

        // geometry info
        const vvdFile = await fileSystem.getFile(propType.vvdPath);
        const vvd = VVDFile.fromDataArray(await vvdFile.arrayBuffer());
        const vertecies = vvd.convertToMesh();

        const vtxFile = await fileSystem.getFile(propType.vvdPath.replace('.vvd', '.dx90.vtx'));
        const vtx = VTXFile.fromDataArray(await vtxFile.arrayBuffer());

        const realVertecies = vtx.vertexindices;
        const realindices = vtx.indices;

        prop.vertecies = realVertecies.map(rv => {
            const vert = vertecies[rv];
            if(!vert) {
                throw new Error('Vertex doesnt exist');
            }
            return vert;
        });

        prop.indices = realindices;

        return prop;
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
