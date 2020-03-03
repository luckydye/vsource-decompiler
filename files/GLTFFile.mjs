import { TextFile } from "./TextFile.mjs";

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#gltf-basics
// https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_005_BuffersBufferViewsAccessors.md

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

// type

const type = {
    BYTE: new ComponentType("BYTE", 5120, 1),
    UNSIGNED_BYTE: new ComponentType("UNSIGNED_BYTE", 5121, 1),
    SHORT: new ComponentType("SHORT", 5122, 2),
    UNSIGNED_SHORT: new ComponentType("UNSIGNED_SHORT", 5123, 2),
    UNSIGNED_INT: new ComponentType("UNSIGNED_INT", 5125, 4),
    FLOAT: new ComponentType("FLOAT", 5126, 4),
    SCALAR: new Type("SCALAR", 1),
    VEC2: new Type("VEC2", 2),
    VEC3: new Type("VEC3", 3),
    VEC4: new Type("VEC4", 4),
    MAT2: new Type("MAT2", 4),
    MAT3: new Type("MAT2", 9),
    MAT4: new Type("MAT4", 16),
}

export default class GLTFFile extends TextFile {

    static fromGeometry(geometry = []) {
        const gltf = new GLTFFile();

        for(let geo of geometry) {

            /* geometry structure:
                vertecies: [0, 0, 0],
                indecies: [0, 0, 0],
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [0, 0, 0],
                materials: [ ... ]
            */
    
            /* material structure (vtf file):
                width: 1024,
                height: 1024,
                reflectivity: 0.512,
                imageData: [ ... ]
            */

            gltf.addObject(geo);
        }

        return gltf.toString();
    }

    static fromFile(GLTFFile) {
        // read gltf file and create instance
    }

    constructor() {
        super();
        
        this.asset = {
            asset: {
                copyright: "2020 (c) Valve Software",
                generator: "Khronos glTF @uncut/file-format-lib v1.0.0",
                version: "2.0"
            },
            scene: 0,
            scenes: [
                {
                    name: "Scene",
                    nodes: []
                }
            ],
            nodes: [],
            meshes: [],
            cameras: [],
            materials: [],
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
            accessors: [],
            bufferViews: [],
            buffers: [],
        };
    }

    get activeScene() {
        return this.asset.scenes[this.asset.scene];
    }

    createBuffer(bufferArray) {
        const buffer = Buffer.from(bufferArray.buffer);
        const gltfBuffer = {
            byteLength: buffer.byteLength,
            uri: "data:application/octet-stream;base64," + buffer.toString('base64')
        }
        return this.asset.buffers.push(gltfBuffer) - 1;
    }

    createBufferView(options) {
        const bufferView = options;
        return this.asset.bufferViews.push(bufferView) - 1;
    }

    createAccessor(options) {
        const accessors = options;
        return this.asset.accessors.push(accessors) - 1;
    }

    createMesh(options) {
        const mesh = options;
        return this.asset.meshes.push(mesh) - 1;
    }

    createNode(options) {
        const node = options;
        const nodeIndex = this.asset.nodes.push(node) - 1;
        this.activeScene.nodes.push(nodeIndex);
        return nodeIndex;
    }

    createPrimitive(vertecies, indices) {

        const indexCount = indices.length;
        const vertexCount = vertecies.length / 8;

        // asset buffers
        const indexBuffer = new Uint32Array(indices);
        const vertexBuffer = new Float32Array(vertecies);

        const indexBufferIndex = this.createBuffer(indexBuffer);
        const vertexBufferIndex = this.createBuffer(vertexBuffer);

        // buffer views
        const byteStride =  type.VEC3.components * type.FLOAT.byteLength +
                            type.VEC2.components * type.FLOAT.byteLength +
                            type.VEC3.components * type.FLOAT.byteLength;

        const indexBufferViewIndex = this.createBufferView({
            buffer: indexBufferIndex, 
            byteOffset: 0, 
            byteLength: indexBuffer.byteLength
        });

        const posBufferViewIndex = this.createBufferView({
            buffer: vertexBufferIndex, 
            byteOffset: 0, 
            byteLength: vertexBuffer.byteLength,
            byteStride: byteStride,
        });

        const texBufferViewIndex = this.createBufferView({
            buffer: vertexBufferIndex, 
            byteOffset: type.VEC3.components * type.FLOAT.byteLength, 
            byteLength: vertexBuffer.byteLength,
            byteStride: byteStride,
        });

        const normBufferViewIndex = this.createBufferView({
            buffer: vertexBufferIndex, 
            byteOffset: type.VEC3.components * type.FLOAT.byteLength + type.VEC2.components * type.FLOAT.byteLength,
            byteLength: vertexBuffer.byteLength,
            byteStride: byteStride,
        });

        // accessors
        const indexAccessor = this.createAccessor({
            bufferView: indexBufferViewIndex,
            componentType: type.UNSIGNED_INT,
            count: indexCount,
            type: type.SCALAR,
        });

        const positionAccessor = this.createAccessor({
            bufferView: posBufferViewIndex,
            componentType: type.FLOAT,
            count: vertexCount,
            type: type.VEC3,
        });

        const textureAccessor = this.createAccessor({
            bufferView: texBufferViewIndex,
            componentType: type.FLOAT,
            count: vertexCount,
            type: type.VEC2,
        });

        const normalAccessor = this.createAccessor({
            bufferView: normBufferViewIndex,
            componentType: type.FLOAT,
            count: vertexCount,
            max: [ 1, 1, 1 ],
            min: [ -1, -1, -1 ],
            type: type.VEC3,
        });

        return {
            attributes: {
                "POSITION": positionAccessor,
                "TEXCOORD_0": textureAccessor,
                "NORMAL": normalAccessor,
            },
            indices: indexAccessor,
        }
    }

    createObjectMesh(object) {
        // geometry buffer
        const indices = object.indecies;
        const vertecies = object.vertecies.filter((v, i) => ((i + 4) % 9));
        
        const primitive = this.createPrimitive(vertecies, indices);

        // materials
        // for(let mat of geo.materials) {
        //     const material = {
        //         name: "Material0",
        //         pbrMetallicRoughness: {
        //             baseColorTexture: {
        //                 index: 1,
        //                 texCoord: 1
        //             },
        //             metallicFactor: mat.reflectivity,
        //             roughnessFactor: 1,
        //             metallicRoughnessTexture: {
        //                 index: 2,
        //                 texCoord: 1
        //             }
        //         }
        //     }

        //     const texture = {
        //         sampler: 0,
        //         source: 2
        //     }

        //     const image = {
        //         uri: "duckCM.png"
        //     }
        // }

        // mesh
        return this.createMesh({
            name: object.name,
            primitives: [
                {
                    attributes: primitive.attributes,
                    indices: primitive.indices,
                    // material: asset.materials.length,
                }
            ]
        });
    }

    addObject(object) {
        let mesh = null;

        // find existing mesh with same name
        for(let assetMesh of this.asset.meshes) {
            if(object.name == assetMesh.name) {
                mesh = this.asset.meshes.indexOf(assetMesh);
            }
        }

        mesh = mesh || this.createObjectMesh(object);

        // node
        this.createNode({
            name: object.name,
            mesh: mesh,
            scale: object.scale,
            rotation: [
                object.rotation[0],
                object.rotation[1],
                object.rotation[2],
                0
            ],
            translation: object.position,
        });
    }

    toString() {
        return JSON.stringify(this.asset, null, '\t');
    }
}
