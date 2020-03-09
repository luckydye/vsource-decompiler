import { BinaryFile } from './BinaryFile.mjs';
import pex from 'pex-geom';
import { BSP, TextureFlags, LumpTypes } from './BSPStructure.mjs';

export default class BSPFile extends BinaryFile {

    static get decode_lumps() {
        return [
            LumpTypes.MODELS,
            LumpTypes.FACES,
            LumpTypes.PLANES,
            LumpTypes.EDGES,
            LumpTypes.SURFEDGES,
            LumpTypes.VERTEXES,
            LumpTypes.TEXINFO,
            LumpTypes.TEXDATA,
            LumpTypes.TEXDATA_STRING_TABLE,
            LumpTypes.TEXDATA_STRING_DATA,
            LumpTypes.DISPINFO,
            LumpTypes.DISP_VERTS,
            LumpTypes.DISP_TRIS,
            LumpTypes.ENTITIES,
            LumpTypes.PAKFILE,
            LumpTypes.GAME_LUMP,
        ];
    }

    static get known_types() {
        return ["VBSP"];
    }

    static get supported_version() {
        return 21;
    }

    static get STRUCT() {
        return BSP;
    }

    static get FILE_HEADER_BYTE_LENGTH() {
        return 1036;
    }

    static get HEADER_LUMPS() {
        return 64;
    }

    static verifyHeader(header) {
        if(this.known_types.indexOf(header.ident) == -1) {
            throw new Error('Uknown bsp type');
        }
        if(header.version > this.supported_version) {
            console.log(header);
            throw new Error('Unknown bsp version');
        }
    }

    static readLumpData(lumps, dataView) {
        const lumpsData = [];

        for(let lump of lumps.data) {
            const index = lumps.data.indexOf(lump);
            if(this.decode_lumps.indexOf(index) != -1) {
                const lumpLength = lump.filelen.data;
                const lumpOffset = lump.fileofs.data;
                const view = new DataView(dataView.buffer.slice(
                    dataView.byteOffset + lumpOffset, 
                    dataView.byteOffset + lumpOffset + lumpLength
                ));
                lumpsData[index] = view;
            }
        }

        return lumpsData;
    }

    static unserializeTextureDataLump(lumpBuffer, texdatastringtable) {
        const textures = [];

        const lumpByteSize = lumpBuffer.byteLength;

        let byteOffset = 0;

        for(let i = 0; i < texdatastringtable.length; i++) {
            const index = texdatastringtable[i].tex.data;
            const nextIndex = texdatastringtable[i + 1] ? texdatastringtable[i + 1].tex.data -1 : lumpByteSize - 1;
            const byteLength = nextIndex - index;

            const string = String.fromCharCode(...(new Uint8Array(lumpBuffer.buffer.slice(index, index + byteLength))));

            textures.push(string);
        }

        return textures;
    }

    static unserializeGameLumps(lumpBuffer, file) {
        const structData = this.unserialize(lumpBuffer, 0, BSPFile.STRUCT.dgamelumpheader_t);
        const headerBytesize = structData.byteSize;
        const header = structData.data;

        const gamelumps = [];

        for(let l = 0; l < header.lumpCount.data; l++) {
            const gamelumpHeader = header.gamelump.data[l];

            const fileLen = gamelumpHeader.filelen.data;
            const fileOfs = gamelumpHeader.fileofs.data;

            gamelumps.push({
                id: String.fromCharCode(...this.Uint32ToBytes(gamelumpHeader.id.data)),
                version: gamelumpHeader.version.data,
                flags: gamelumpHeader.flags.data,
                buffer: new DataView(file.buffer.slice(fileOfs, fileOfs + fileLen))
            });
        }

        return gamelumps;
    }

    static unserializeVMFString(vmfString) {

        const lines = vmfString.split('\n');
        const blocks = [];

        let blockIndex = 0;
        let currentClass = null;

        for(let line of lines) {
            if(line.match("{")) {
                // block closed
            } else if(line.match("}")) {
                // new block start
                blockIndex++;
            } else {
                // line in current block
                blocks[blockIndex] = blocks[blockIndex] || {};

                let parts = line.match(/("[^"]+")+/g);

                if(parts) {
                    parts = [...parts].map(p => p.replace(/"/g, ''));

                    const key = parts[0];
                    let value = parts[1];

                    if(value) {
                        value = value.split(" ");

                        value = value.map(v => {
                            if(!isNaN(v)) {
                                return parseFloat(v);
                            }
                            return v;
                        })
        
                        if(value.length > 1) {
                            blocks[blockIndex][key] = value;
                        } else {
                            blocks[blockIndex][key] = value[0];
                        }
                    } else {
                        currentClass = key;
                    }
                }
            }
        }

        return blocks;
    }

    static unserializeStaticProps(gamelump) {
        // static props
        let byteOffset = 0;

        const buffer = gamelump.buffer;

        const dict = this.unserialize(buffer, byteOffset, BSPFile.STRUCT.StaticPropDictLump_t);
        byteOffset = dict.byteOffset;

        const propLeafs = this.unserialize(buffer, byteOffset, BSPFile.STRUCT.StaticPropLeafLump_t);
        byteOffset = propLeafs.byteOffset;
        
        const entries = this.parseBytes(buffer, byteOffset, 'int');
        byteOffset = entries.byteOffset;

        const models = dict.data.name.data.map(str => str.replace(/\W+$/g, ""));

        const props = [];

        const usedGamelumpStruct = BSPFile.STRUCT[`StaticPropLumpV${gamelump.version}_t`];

        for(let p = 0; p < entries.data; p++) {
            const prop = this.unserialize(buffer, byteOffset, usedGamelumpStruct);
            byteOffset = prop.byteOffset;

            prop.data.PropType = models[prop.data.PropType.data];
            props.push(prop.data);
        }

        return props;
    }

    static fromDataArray(dataArray) {
        const bsp = this.createFile(dataArray);

        const headerStruct = this.unserialize(bsp.view, 0, BSPFile.STRUCT.dheader_t);
        headerStruct.data.ident = String.fromCharCode(...headerStruct.data.ident.data);
        bsp.header = headerStruct.data;

        bsp.version = bsp.header.version.valueOf();

        try {
            BSPFile.verifyHeader(bsp.header);
        } catch(err) {
            throw err;
        }

        const lumps = this.readLumpData(bsp.header.lumps, bsp.view);

        log('decode lumps...');

        // models
        bsp.models = this.unserializeArray(lumps[LumpTypes.MODELS], 0, this.STRUCT.dmodel_t);

        // world geometry
        bsp.faces = this.unserializeArray(lumps[LumpTypes.FACES], 0, this.STRUCT.dface_t);
        bsp.planes = this.unserializeArray(lumps[LumpTypes.PLANES], 0, this.STRUCT.dplane_t);
        bsp.edges = this.unserializeArray(lumps[LumpTypes.EDGES], 0, this.STRUCT.dedge_t);
        bsp.surfedges = this.unserializeArray(lumps[LumpTypes.SURFEDGES], 0, { edge: 'int' });
        bsp.vertecies = this.unserializeArray(lumps[LumpTypes.VERTEXES], 0, this.STRUCT.vertex);
        
        // textures
        bsp.texinfo = this.unserializeArray(lumps[LumpTypes.TEXINFO], 0, this.STRUCT.texinfo_t);
        bsp.texdata = this.unserializeArray(lumps[LumpTypes.TEXDATA], 0, this.STRUCT.dtexdata_t);
        bsp.texdatastringtable = this.unserializeArray(lumps[LumpTypes.TEXDATA_STRING_TABLE], 0, { tex: 'int' });
        bsp.textures = this.unserializeTextureDataLump(lumps[LumpTypes.TEXDATA_STRING_DATA], bsp.texdatastringtable);
        
        // brushes
        // bsp.brushes = this.unserializeArray(lumps[LumpTypes.BRUSHES], 0, this.STRUCT.dbrush_t);
        // bsp.brushsides = this.unserializeArray(lumps[LumpTypes.BRUSHSIDES], 0, this.STRUCT.dbrushside_t);
        
        // displacements
        log('Decompile displacements...');

        bsp.displacements = this.unserializeArray(lumps[LumpTypes.DISPINFO], 0, this.STRUCT.ddispinfo_t);
        bsp.displacementverts = this.unserializeArray(lumps[LumpTypes.DISP_VERTS], 0, this.STRUCT.dDispVert);
        // bsp.displacementtris = this.unserializeArray(lumps[LumpTypes.DISP_TRIS], 0, this.STRUCT.dDispTri);

        // entities
        const entitiesString = BSPFile.unserializeASCI(lumps[LumpTypes.ENTITIES]);
        bsp.entities = BSPFile.unserializeVMFString(entitiesString);

        bsp.props = [];

        for(let entity of bsp.entities) {
            switch(entity.classname) {
                case 'prop_dynamic':
                    bsp.props.push(entity);
                    break;
                default:
                    continue;
            }
        }

        // pakfile
        bsp.pakfile = lumps[LumpTypes.PAKFILE];

        log('read gamelumps...');

        // gamelumps
        const gamelumps = BSPFile.unserializeGameLumps(lumps[LumpTypes.GAME_LUMP], bsp.view);

        bsp.gamelumps = {};

        log('decode gamelumps...');

        for(let lump of gamelumps) {
            if(lump.id == "sprp") {
                bsp.gamelumps[lump.id] = BSPFile.unserializeStaticProps(lump);
            }
        }

        return bsp;
    }

    convertToMesh() {
        const planes = this.planes;
        const edges = this.edges;
        const surfedges = this.surfedges;
        const vertecies = this.vertecies;
        const mapFaces = this.faces;
        const texInfos = this.texInfo;
        const models = this.models;
        const entities = this.entities;

        const meshes = [];

        const convertModelToMesh = (model, position) => {

            const origin = [
                model.origin.data[0] + position[0],
                model.origin.data[1] + position[1],
                model.origin.data[2] + position[2]
            ]
    
            const firstFace = model.firstface;
            const faceCount = model.numfaces;
    
            const faces = mapFaces.slice(firstFace, firstFace + faceCount);
    
            for(let face of faces) {
                
                const plane = planes[face.planenum.data];
                
                const textureInfo = this.texinfo[face.texinfo.data];
                const textureData = this.texdata[textureInfo.texdata.data];
                const textureIndex = textureData.nameStringTableID.data;
                const textureFlag = textureInfo.flags.data;
                const dispInfo = this.displacements[face.dispinfo.data];

                let dispPower = 0, dispVerts = [];

                if(dispInfo) {
                    dispPower = dispInfo.power.valueOf();

                    const powerSize = 1 << dispPower;
                    const vertexCount = (powerSize + 1) * (powerSize + 1);

                    const dispStartVert = dispInfo.DispVertStart.valueOf();
                    dispVerts = this.displacementverts.slice(dispStartVert, dispStartVert + vertexCount);
                }

                meshes[textureIndex] = meshes[textureIndex] || {
                    indices: [],
                    vertecies: [],
                    uvs: [],
                    normals: [],
                    material: textureIndex,
                    currentVertexIndex: 0,
                };
    
                switch(textureFlag) {
                    case 0: break;
                    case TextureFlags.SURF_BUMPLIGHT: break;
                    default: continue;
                }
                
                const faces = face.side.data;
                const normal = plane.normal.data;
                const faceSurfedges = surfedges.slice(face.firstedge.data, face.firstedge.data + face.numedges.data);
    
                const faceEdges = faceSurfedges.map(surfEdge => {
                    let edge = edges[Math.abs(surfEdge.edge.data)].v.data;
                    if(surfEdge.edge.data < 0) {
                        edge = edge.reverse();
                    }
                    return edge;
                });
    
                const verts = [];
                const indexes = [];
    
                for(let edge of faceEdges) {
                    let vertindices = edge;
                    verts.push(vertecies[vertindices[0]]);
                }

                let geo;
                
                // apply displacements if exist
                if(dispInfo) {
                    const dispWidth = dispPower * dispPower;
                    const faceWidth = verts[2].x - verts[0].x;
                    const faceHeight = verts[1].y - verts[3].y;
                    const base_vertex = verts[0];

                    const indexes = [];
    
                    for(let i = 0; i < ((verts.length - 2) * 3) / 3; i++) {
                        indexes.push([ 0, 1 + i, 2 + i ]);
                    }

                    geo = new pex.Geometry({
                        vertices: verts.map(v => new pex.Vec3(v.x, v.y, v.z)),
                        faces: indexes
                    });

                } else {

                    const numberOfindices = (verts.length - 2) * 3;
    
                    for(let i = 0; i < numberOfindices / 3; i++) {
                        indexes.push(0);
                        indexes.push(1 + i);
                        indexes.push(2 + i);
                    }

                    geo = {
                        vertices: verts,
                        faces: indexes
                    }
                }

                // vertexes and indexes

                let i = 0;
                for(let v of geo.vertices) {
                    const x = v.x.valueOf();
                    const y = v.y.valueOf();
                    const z = v.z.valueOf();

                    const displace = { x: 0, y: 0, z: 0 };

                    if(dispInfo) {
                        const dist = dispVerts[i].dist.valueOf();
                        const vec = dispVerts[i].vec.valueOf();

                        displace.x = vec[0] * dist;
                        displace.y = vec[1] * dist;
                        displace.z = vec[2] * dist;
                    }

                    meshes[textureIndex].vertecies.push([
                        y + origin[1] + displace.y,
                        z + origin[2] + displace.z, 
                        x + origin[0] + displace.x, 
                    ]);

                    const tv = textureInfo.textureVecs.data;
                
                    meshes[textureIndex].uvs.push([
                        (tv[0][0] * x + tv[0][1] * y + tv[0][2] * z + tv[0][3]) / textureData.width_height_0,
                        (tv[1][0] * x + tv[1][1] * y + tv[1][2] * z + tv[1][3]) / textureData.width_height_1
                    ]);

                    meshes[textureIndex].normals.push([
                        -normal[1].valueOf(),
                        -normal[2].valueOf(), 
                        -normal[0].valueOf()
                    ]);

                    i++;
                }
    
                const currentVertexIndex = meshes[textureIndex].currentVertexIndex;

                for(let index of geo.faces.flat()) {
                    meshes[textureIndex].indices.push(index += currentVertexIndex);
                }

                meshes[textureIndex].currentVertexIndex += geo.vertices.length;
            }
        }

        for(let entity of entities) {
            switch(entity.classname) {
                case 'func_brush':
                    const model = entity.model;
                    const origin = entity.origin || [0, 0, 0];
                    const angles = entity.angles || [0, 0, 0];

                    if(model && model[0] == '*') {
                        const modelIndex = parseInt(model.substring(1));
                        const entityModel = models[modelIndex];

                        models[modelIndex] = null;

                        convertModelToMesh(entityModel, origin);
                    }

                    break;
                default:
                    continue;
            }
        }
        
        for(let model of models) {
            if(model) {
                convertModelToMesh(model, [0, 0, 0]);
            }
        }

        return meshes;
    }

}
