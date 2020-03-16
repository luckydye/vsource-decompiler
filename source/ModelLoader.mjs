import { VVDFile, BSPFile, VPKFile, MDLFile, VMTFile, VTFFile, VTXFile } from '../index.mjs';

import chalk from 'chalk';
import VirtualFileSystem from './VirtualFileSystem.mjs';

const fileSystem = new VirtualFileSystem();
const propTypes = new Map();

function getModelNameFromPath(modelPath) {
    const parts = modelPath.split(/\/|\\/g);
    return parts[parts.length-1].replace(/\\+|\/+/g, "_");
}

export class Model {

    static get resourceRoot() {
        return fileSystem.root;
    }

    static set resourceRoot(val) {
        fileSystem.root = val;
    }

    constructor() {
        this.geometry = {
            map: [],
            lights: [],
            sky_camera: [],
            prop_static: [],
            prop_dynamic: [],
        };
    }

    async loadPakfile(mapName) {
        const mapPath = `maps/${mapName}.bsp`;
        log('Loading map', mapPath);

        const map = await fileSystem.getFile(mapPath);
        const bsp = BSPFile.fromDataArray(await map.arrayBuffer());

        log('Reading pakfile...');
        this.pakfile = Buffer.from(bsp.pakfile.buffer);
        
        return this.pakfile;
    }

    async loadMap(mapName) {
        this.name = mapName;

        const mapPath = `maps/${mapName}.bsp`;
        log('Loading map', mapPath);

        const map = await fileSystem.getFile(mapPath);
        const bsp = BSPFile.fromDataArray(await map.arrayBuffer());

        log('Reading pakfile...');
        this.pakfile = Buffer.from(bsp.pakfile.buffer);
        fileSystem.attatchPakfile(this.pakfile);

        log('Load map textures...');

        const textures = new Map();
            
        for(let texture of bsp.textures) {
            const mat = await this.loadMaterial(texture.toLocaleLowerCase()).catch(err => {
                error(err);
                log(texture);
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

        log('Load map geometry...');

        // sky_camera
        if(bsp.skyCamera) {
            this.geometry.sky_camera.scale = [
                bsp.skyCamera.scale,
                bsp.skyCamera.scale,
                bsp.skyCamera.scale,
            ];
            this.geometry.sky_camera.position = [
                bsp.skyCamera.origin[1],
                bsp.skyCamera.origin[2],
                bsp.skyCamera.origin[0],
            ];
            this.geometry.sky_camera.rotation = [
                bsp.skyCamera.angles[0],
                -bsp.skyCamera.angles[2],
                bsp.skyCamera.angles[1],
            ];
        }

        // lights
        for(let light of bsp.lights) {
            this.geometry.lights.push(transformPropGeometry({
                name: bsp.lights.indexOf(light) + "_light",
                scale: [1, 1, 1],
                origin: light.origin,
                angles: [0, 0, 0],
            }));
        }

        // brushes
        const meshes = bsp.convertToMesh();

        for(let mesh of meshes) {
            if(!mesh) continue;

            const material = getMapTexture(mesh.material);

            this.geometry.map.push({
                name: meshes.indexOf(mesh) + "_" + mapName,
                color: mesh.color,
                vertecies: mesh.vertecies,
                uvs: mesh.uvs,
                normals: mesh.normals,
                indices: mesh.indices,
                material: material,
                scale: [1, 1, 1],
                origin: [0, 0, 0],
                position: [0, 0, 0],
                rotation: mesh.angles,
            });
        }

        log('Load prop_dynamic ...');

        for(let prop of bsp.props) {
            const modelMeshes = await this.loadProp(prop.model).catch(err => {
                console.log('');
                error('Failed loading prop_dynamic: ' + prop.model);
                log(err);
                console.log('');
            });

            if(!modelMeshes) continue;

            for(let propData of modelMeshes) {
                const propGeometry = transformPropGeometry({
                    name: getModelNameFromPath(prop.model) + '_' + modelMeshes.indexOf(propData),
                    vertecies: propData.vertecies,
                    uvs: propData.uvs,
                    normals: propData.normals,
                    indices: propData.indices,
                    material: propData.material,
                    origin: prop.origin,
                    angles: prop.angles,
                });
    
                this.geometry.prop_dynamic.push(propGeometry);
            }
        }

        log('Load prop_static ...');
        
        await this.loadMapProps(bsp.gamelumps.sprp, (type, prop, propMeshes) => {
            for(let propData of propMeshes) {
                const propGeometry = transformPropGeometry({
                    name: getModelNameFromPath(type.name) + '_' + propMeshes.indexOf(propData),
                    vertecies: propData.vertecies,
                    uvs: propData.uvs,
                    normals: propData.normals,
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
    
                this.geometry.prop_static.push(propGeometry);
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
        const water = vmt.data.water;
        const refract = vmt.data.refract;
        const lightmapped_4wayblend = vmt.data.lightmapped_4wayblend;
        const unlittwotexture = vmt.data.unlittwotexture;
        const splinerope = vmt.data.splinerope;
        const modulate = vmt.data.modulate;
        const decalmodulate = vmt.data.decalmodulate;
        const sprite = vmt.data.sprite;

        const shader =  vertexlit || 
                        lightmapped || 
                        unlit || 
                        world || 
                        water ||
                        refract || 
                        lightmapped_4wayblend || 
                        unlittwotexture || 
                        splinerope || 
                        modulate || 
                        decalmodulate || 
                        sprite

        if(!shader) {
            console.log(vmt.data);
            throw new Error('Unknown material.');
        }

        const texture = shader['$basetexture'];
        const surface = shader['$surfaceprop'];

        let vtf = null;

        if(texture) {
            const vtfFile = await fileSystem.getFile(texture.replace('.vtf', '') + '.vtf');
            vtf = VTFFile.fromDataArray(await vtfFile.arrayBuffer());
            vtf.name = texture;
        }

        return {
            name: materialName,
            translucent: shader['$translucent'] || shader['$alphatest'],
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
            const path = mdl.texturePaths[0].replace(/\\|\//g, '/');
            const materialName = path + tex.name.toString().replace(path, '');
            const mat = await this.loadMaterial(materialName);
            prop.materials.push(mat);
        }

        // geometry info
        const vtxFile = await fileSystem.getFile(vtxPath);
        const vtx = VTXFile.fromDataArray(await vtxFile.arrayBuffer());

        const vvdFile = await fileSystem.getFile(vddPath);
        const vvd = VVDFile.fromDataArray(await vvdFile.arrayBuffer());
        const geometry = vvd.convertToMesh();

        const propMeshes = [];
        let meshIndex = 0;

        for(let mesh of vtx.meshes) {
            propMeshes.push({
                material: prop.materials[meshIndex],
                indices: mesh.indices,
                vertecies: mesh.vertexindices.map(rv => {
                    const vert = geometry.vertecies[rv];
                    if(!vert) throw new Error('Vertex doesnt exist');
                    return vert;
                }),
                uvs: mesh.vertexindices.map(rv => {
                    const vert = geometry.uvs[rv];
                    if(!vert) throw new Error('UV doesnt exist');
                    return vert;
                }),
                normals: mesh.vertexindices.map(rv => {
                    const vert = geometry.normals[rv];
                    if(!vert) throw new Error('Normal doesnt exist');
                    return vert;
                }),
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

function transformPropGeometry(prop) {

    // coord conversion: y ; z ; x
    
    // prop.angles: y(0) ; z(1) ; x(2)
    const anglesXYZ = [
        prop.angles[0],
        -prop.angles[2],
        prop.angles[1],
    ];

    const originXYZ = [
        prop.origin[1],
        prop.origin[2],
        prop.origin[0],
    ];

    const propGeometry = {
        name: prop.name,
        vertecies: prop.vertecies,
        uvs: prop.uvs,
        normals: prop.normals,
        indices: prop.indices,
        material: prop.material,
        scale: [ 1, 1, 1 ],
        origin: [ 0, 0, 0 ],
        position: originXYZ,
        rotation: anglesXYZ,
    }
    return propGeometry;
}
