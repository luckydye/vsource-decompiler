import { TextFile } from "./TextFile.mjs";

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#gltf-basics

class ComponentType extends Number {
    
    get byteLength() {
        return this._byteLength;
    }

    constructor(type, n, byteLength) {
        super(n);

        this._type = type;
        this._byteLength = byteLength;
    }
}

class Type extends String {

    get components() {
        return this._components;
    }

    constructor(type, components) {
        super(type);

        this._components = components;
    }
}

// Types

const types = {
    SCALAR: new Type("SCALAR", 1),
    VEC2: new Type("VEC2", 2),
    VEC3: new Type("VEC3", 3),
    VEC4: new Type("VEC4", 4),
    MAT2: new Type("MAT2", 4),
    MAT3: new Type("MAT2", 9),
    MAT4: new Type("MAT4", 16),
}

const componentTypes = {
    BYTE: new ComponentType("BYTE", 5120, 1),
    UNSIGNED_BYTE: new ComponentType("UNSIGNED_BYTE", 5121, 1),
    SHORT: new ComponentType("SHORT", 5122, 2),
    UNSIGNED_SHORT: new ComponentType("UNSIGNED_SHORT", 5123, 2),
    UNSIGNED_INT: new ComponentType("UNSIGNED_INT", 5125, 4),
    FLOAT: new ComponentType("FLOAT", 5126, 4),
}


export default class GLTFFile extends TextFile {

    /*  Format
    
        {
            "asset": {
                "version": "2.0",
                "generator": "collada2gltf@f356b99aef8868f74877c7ca545f2cd206b9d3b7",
                "copyright": "2020 (c) Tim Havlicek"
            },
            "buffers": [
                {
                    "byteLength": 504,
                    "uri": "external.bin"
                }
            ],
            "bufferViews": [
                {
                    "buffer": 0,
                    "byteLength": 76768,
                    "byteOffset": 25272,
                    "byteStride": 32,
                    "target": 34962
                }
            ],
            "accessors": [
                {
                    "bufferView": 1,
                    "byteOffset": 0,
                    "componentType": 5126,
                    "count": 2399,
                    "max": [
                        0.961799,
                        1.6397,
                        0.539252
                    ],
                    "min": [
                        -0.692985,
                        0.0992937,
                        -0.613282
                    ],
                    "type": "VEC3"
                }
            ],
            "nodes": [
                {
                    "name": "Car",
                    "children": [ 1 ]
                    "matrix": [],
                    "scale": [0, 0, 0, 0],
                    "rotation": [0, 0, 0, 0],
                    "translation": [0, 0, 0, 0],
                },
                {
                    "name": "camera",
                    "camera": 1,
                }
            ],
            "skins": [
                {
                    "name": "skin_0",
                    "inverseBindMatrices": 0,
                    "joints": [ 1, 2 ],
                    "skeleton": 1
                }
            ],
            "scenes": [
                {
                    "name": "singleScene",
                    "nodes": [ 0, 1, 2 ]
                }
            ],
            "scene": 0,
            "cameras": [
                {
                    "name": "Camera_A",
                    "type": "perspective",
                    "perspective": {
                        "aspectRatio": 1.5,
                        "yfov": 0.660593,
                        "zfar": 100,
                        "znear": 0.01
                    }      
                }
            ],
            "meshes": [
                {
                    "primitives": [
                        {
                            "attributes": {
                                "NORMAL": 23,
                                "POSITION": 22,
                                "TANGENT": 24,
                                "TEXCOORD_0": 25
                            },
                            "indices": 21,
                            "material": 3,
                            "mode": 0
                        }
                    ]
                }
            ],
            "textures": [
                {
                    "sampler": 0,
                    "source": 2
                }
            ],
            "samplers": [
                {
                    "magFilter": 9729,
                    "minFilter": 9987,
                    "wrapS": 10497,
                    "wrapT": 10497
                }
            ],
            "images": [
                {
                    "uri": "duckCM.png"
                },
                {
                    "bufferView": 14,
                    "mimeType": "image/jpeg" 
                }
            ],
            "materials": [
                {
                    "name": "Material0",
                    "pbrMetallicRoughness": {
                        "baseColorFactor": [ 0.5, 0.5, 0.5, 1.0 ],
                        "baseColorTexture": {
                            "index": 1,
                            "texCoord": 1
                        },
                        "metallicFactor": 1,
                        "roughnessFactor": 1,
                        "metallicRoughnessTexture": {
                            "index": 2,
                            "texCoord": 1
                        }
                    },
                    "normalTexture": {
                        "scale": 2,
                        "index": 3,
                        "texCoord": 1
                    },
                    "emissiveFactor": [ 0.2, 0.1, 0.0 ]
                }
            ]
        }
    */

    static fromGeometry(geometry = []) {
        const gltf = new GLTFFile();

        for(let geo of geometry) {

            /* geometry structure
    
                vertecies: [0, 0, 0],
                indecies: [0, 0, 0],
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [0, 0, 0],
                materials: [ ... ]
            */
    
            /* material structure (vtf file)
    
                width: 1024,
                height: 1024,
                reflectivity: 0.512,
                imageData: [ ... ]
            */

            gltf.addObject(geo);
        }
    }

    static fromFile(GLTFFile) {
        // read gltf file and create instance
    }

    constructor() {
        super();
        
        this.asset = {
            asset: {
                version: "2.0",
                copyright: "2020 (c) Tim Havlicek"
            },
            scene: 0,
            scenes: [
                {
                    name: "defaultScene",
                    nodes: []
                }
            ],
            nodes: [],
            meshes: [],
            cameras: [],
            textures: [],
            images: [],
            samplers: [
                {
                    "magFilter": 9729,
                    "minFilter": 9987,
                    "wrapS": 10497,
                    "wrapT": 10497
                }
            ],
            materials: [],
            buffers: [],
            bufferViews: [],
            accessors: [],
        };
    }

    get activeScene() {
        return this.asset.scenes[this.asset.scene];
    }

    addObject(object) {

        const geometryBuffer = {
            byteLength: 0,
            uri: "data:"
            // all position
            // all texture
            // all normal
        }
        const indexBuffer = {
            byteLength: 0,
            uri: "data:"
            // all indices
        }

        const geometryBufferView = {
            buffer: 0,
            byteLength: 4,
            byteStride: type.VEC3.components * componentTypes.FLOAT.byteLength,
        }
        const indexBufferView = {
            buffer: 1,
            byteLength: 4,
        }

        const accessor = {
            bufferView: 0,
            byteOffset: 0,
            componentType: componentTypes.FLOAT,
            count: 1,   // buffer view count
            type: type.VEC3,
            sparse: {
                count: 2,  // indexed elements count
                indices: {
                    bufferView: 1,
                    byteOffset: 0,
                    componentType: componentTypes.UNSIGNED_INT
                },
                values: {
                    bufferView: 0,
                    byteOffset: 0
                }
            }
        }
        
        const node = {
            name: object.name,
            children: []
            scale: [
                object.scale[0], 
                object.scale[1], 
                object.scale[2], 
                0
            ],
            rotation: [
                object.rotation[0], 
                object.rotation[1], 
                object.rotation[2], 
                0
            ],
            translation: [
                object.position[0], 
                object.position[1], 
                object.position[2], 
                0
            ],
        }

        const mesh = {
            primitives: [
                {
                    attributes: {
                        "POSITION": 22,
                        "TEXCOORD_0": 25
                        "NORMAL": 23,
                    },
                    indices: 0,
                    material: 3,
                    mode: 0
                }
            ]
        }

        for(let mat of geo.materials) {
            const material = {
                name: "Material0",
                pbrMetallicRoughness: {
                    baseColorTexture: {
                        index: 1,
                        texCoord: 1
                    },
                    metallicFactor: mat.reflectivity,
                    roughnessFactor: 1,
                    metallicRoughnessTexture: {
                        index: 2,
                        texCoord: 1
                    }
                }
            }

            const texture = {
                sampler: 0,
                source: 2
            }

            const image = {
                uri: "duckCM.png"
            }
        }

    }

    addMaterial(object) {
        
    }

    addTexture(object) {

    }

    toString() {
        return JSON.stringify(this.asset);
    }
}
