import { BinaryFile } from './BinaryFile.mjs';
import pex from 'pex-geom';

const MAX_DISP_CORNER_NEIGHBORS = 4;

const Structs = {
    dheader_t: {
        ident: 'byte[4]',
        version: 'int',
        lumps: 'lump_t[HEADER_LUMPS]',
        mapRevision: 'int',
    },
    lump_t: {
        fileofs: 'int',
        filelen: 'int',
        version: 'int',
        fourCC: 'byte[4]',
    },
    dplane_t: {
        normal: 'vector',
        dist: 'float',
        type: 'int'
    },
    dface_t: {
        planenum: 'unsigned short',
        side: 'byte',
        onNode: 'byte',
        firstedge: 'int',
        numedges: 'short',
        texinfo: 'short',
        dispinfo: 'short',
        surfaceFogVolumeID: 'short',
        styles: 'byte[4]',
        lightofs: 'int',
        area: 'float',
        LightmapTextureMinsInLuxels: 'int[2]',
        LightmapTextureSizeInLuxels: 'int[2]',
        origFace: 'int',
        numPrims: 'unsigned short',
        firstPrimID: 'unsigned short',
        smoothingGroups: 'unsigned int',
    },
    vertex: {
        x: 'float',
        y: 'float',
        z: 'float',
    },
    dedge_t: {
        v: 'unsigned short[2]'
    },
    surfedge: {
        v: 'int'
    },
    dbrush_t: {
        firstside: 'int',
        numsides: 'int',
        contents: 'int',
    },
    dbrushside_t: {
        planenum:'unsigned short',
        texinfo: 'short',
        dispinfo: 'short',
        bevel: 'short',
    },
    dnode_t: {
        planenum: 'int',
        children: 'int',
        mins: 'short',
        maxs: 'short',
        firstface: 'unsigned short',
        numfaces: 'unsigned short',
        area: 'short',
        paddding: 'short',
    },
    dleaf_t: {
        contents: 'int',
        cluster: 'short',
        area: 'short:9',
        flags: 'short:7',
        mins: 'int[3]',
        maxs: 'int[3]',
        firstleafface: 'unsigned short',
        numleaffaces: 'unsigned short',
        firstleafbrush: 'unsigned short',
        numleafbrushes: 'unsigned short',
        leafWaterDataID: 'short',
    },
    texinfo_t: {
        textureVecs: 'float[2][4]',
        lightmapVecs: 'float[2][4]',
        flags: 'int',
        texdata: 'int',
    },
    dtexdata_t: {
        reflectivity: 'vector',
        nameStringTableID: 'int',
        width_height: 'int, int',
        view_width_view_height: 'int, int'
    },
    dmodel_t: {
        mins_maxs: 'vector, vector',
        origin: 'vector',
        headnode: 'int',
        firstface: 'int',
        numfaces: 'int'
    },
    ddispinfo_t: {
        startPosition: 'vector',
        DispVertStart: 'int',
        DispTriStart: 'int',
        power: 'int',
        minTess: 'int',
        smoothingAngle: 'float',
        contents: 'int',
        MapFace: 'unsigned short',
        LightmapAlphaStart: 'int',
        LightmapSamplePositionStart: 'int',
        neighbors: 'byte[90]',
        AllowedVerts: 'unsigned int[10]',
    },
    CDispNeighbor: {
        m_SubNeighbors: 'CDispSubNeighbor[2]',
    },
    CDispSubNeighbor: {
        m_iNeighbor: 'unsigned short',
        m_NeighborOrientation: 'byte',
        m_Span: 'byte',
        m_NeighborSpan: 'byte',
    },
    CDispCornerNeighbors: {
        m_Neighbors: `unsigned short[${MAX_DISP_CORNER_NEIGHBORS}]`,
        m_nNeighbors: 'byte',
    },
    dDispVert: {
        vec: 'vector',
        dist: 'float',
        alpha: 'float',
    },
    dDispTri: {
        Tags: 'unsigned short'
    },
    dgamelumpheader_t: {
        lumpCount: 'int',
        gamelump: 'dgamelump_t[lumpCount]',
    },
    dgamelump_t: {
        id: 'int',
        flags: 'unsigned short',
        version: 'unsigned short',
        fileofs: 'int',
        filelen: 'int',
    },
    StaticPropDictLump_t: {
        dictEntries: 'int',
        name: 'char[dictEntries][128]'
    },
    StaticPropLeafLump_t: {
        leafEntries: 'int',
        leaf: 'unsigned short[leafEntries]'
    },
    qangle: {
        0: 'float',
        1: 'float',
        2: 'float',
    },
    StaticPropLumpV10_t: {
        Origin: 'vector',
        Angles: 'qangle',
        PropType: 'unsigned short',
        FirstLeaf: 'unsigned short',
        LeafCount: 'unsigned short',
        Solid: 'byte',
        Flags: 'byte',
        Skin: 'int',
        FadeMinDist: 'float',
        FadeMaxDist: 'float',
        LightingOrigin: 'vector',
        ForcedFadeScale: 'float',
        
        not_used: 'byte[16]',
    },
    StaticPropLumpV11_t: {
        Origin: 'vector',
        Angles: 'qangle',
        PropType: 'unsigned short',
        FirstLeaf: 'unsigned short',
        LeafCount: 'unsigned short',
        Solid: 'byte',
        Flags: 'byte',
        Skin: 'int',
        FadeMinDist: 'float',
        FadeMaxDist: 'float',
        LightingOrigin: 'vector',
        ForcedFadeScale: 'float',
        
        not_used: 'byte[16]',
        // match:

        // MinCPULevel: 'byte',
        // MaxCPULevel: 'byte',
        // MinGPULevel: 'byte',
        // MaxGPULevel: 'byte',
        // DiffuseModulation: 'color32',
        // DisableX360: 'int',
        // FlagsEx: 'unsigned int',

        UniformScale: 'float',
    }
};

const TextureFlags = {
    SURF_LIGHT: 0x1,
    SURF_SKY2D: 0x2,
    SURF_SKY: 0x4,
    SURF_WARP: 0x8,
    SURF_TRANS: 0x10,
    SURF_NOPORTAL: 0x20,
    SURF_TRIGGER: 0x40,
    SURF_NODRAW: 0x80,
    SURF_HINT: 0x100,
    SURF_SKIP: 0x200,
    SURF_NOLIGHT: 0x400,
    SURF_BUMPLIGHT: 0x800,
    SURF_NOSHADOWS: 0x1000,
    SURF_NODECALS: 0x2000,
    SURF_NOCHOP: 0x4000,
    SURF_HITBOX: 0x8000,
}

const LumpTypes = {
    ENTITIES: 0,
    PLANES: 1,
    TEXDATA: 2,
    VERTEXES: 3,
    VISIBILITY: 4,
    NODES: 5,
    TEXINFO: 6,
    FACES: 7,
    LIGHTING: 8,
    OCCLUSION: 9,
    LEAFS: 10,
    FACEIDS: 11,
    EDGES: 12,
    SURFEDGES: 13,
    MODELS: 14,
    WORLDLIGHTS: 15,
    LEAFFACES: 16,
    LEAFBRUSHES: 17,
    BRUSHES: 18,
    BRUSHSIDES: 19,
    AREAS: 20,
    AREAPORTALS: 21,
    PORTALS: 22,
    UNUSED0: 22,
    PROPCOLLISION: 22,
    CLUSTERS: 23,
    UNUSED26: 23,
    PROPHULLS: 23,
    PORTALVERTS: 24,
    UNUSED2: 24,
    PROPHULLVERTS: 24,
    CLUSTERPORTALS: 25,
    UNUSED3: 25,
    PROPTRIS: 25,
    DISPINFO: 26,
    ORIGINALFACES: 27,
    PHYSDISP: 28,
    PHYSCOLLIDE: 29,
    VERTNORMALS: 30,
    VERTNORMALINDICES: 31,
    DISP_LIGHTMAP_ALPHAS: 32,
    DISP_VERTS: 33,
    DISP_LIGHTMAP_SAMPLE_POSITIONS: 34,
    GAME_LUMP: 35,
    LEAFWATERDATA: 36,
    PRIMITIVES: 37,
    PRIMVERTS: 38,
    PRIMINDICES: 39,
    PAKFILE: 40,
    CLIPPORTALVERTS: 41,
    CUBEMAPS: 42,
    TEXDATA_STRING_DATA: 43,
    TEXDATA_STRING_TABLE: 44,
    OVERLAYS: 45,
    LEAFMINDISTTOWATER: 46,
    FACE_MACRO_TEXTURE_INFO: 47,
    DISP_TRIS: 48,
    PHYSCOLLIDESURFACE: 49,
    PROP_BLOB: 49,
    WATEROVERLAYS: 50,
    LIGHTMAPPAGES: 51,
    LEAF_AMBIENT_INDEX_HDR: 51,
    LIGHTMAPPAGEINFOS: 52,
    LEAF_AMBIENT_INDEX: 52,
    LIGHTING_HDR: 53,
    WORLDLIGHTS_HDR: 54,
    LEAF_AMBIENT_LIGHTING_HDR: 55,
    LEAF_AMBIENT_LIGHTING: 56,
    XZIPPAKFILE: 57,
    FACES_HDR: 58,
    MAP_FLAGS: 59,
    OVERLAY_FADES: 60,
    OVERLAY_SYSTEM_LEVELS: 61,
    PHYSLEVEL: 62,
    DISP_MULTIBLEND: 63,
};

export default class BSPFile extends BinaryFile {

    static get decode_lumps() {
        return [
            BSPFile.LUMP.MODELS,
            BSPFile.LUMP.FACES,
            BSPFile.LUMP.PLANES,
            BSPFile.LUMP.EDGES,
            BSPFile.LUMP.SURFEDGES,
            BSPFile.LUMP.VERTEXES,
            BSPFile.LUMP.TEXINFO,
            BSPFile.LUMP.TEXDATA,
            BSPFile.LUMP.TEXDATA_STRING_TABLE,
            BSPFile.LUMP.TEXDATA_STRING_DATA,
            BSPFile.LUMP.DISPINFO,
            BSPFile.LUMP.DISP_VERTS,
            BSPFile.LUMP.DISP_TRIS,
            BSPFile.LUMP.ENTITIES,
            BSPFile.LUMP.PAKFILE,
            BSPFile.LUMP.GAME_LUMP,
        ];
    }

    static get known_types() {
        return ["VBSP"];
    }

    static get supported_version() {
        return 21;
    }

    static get STRUCT() {
        return Structs;
    }

    static get LUMP() {
        return LumpTypes;
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
        bsp.models = this.unserializeArray(lumps[this.LUMP.MODELS], 0, this.STRUCT.dmodel_t);

        // world geometry
        bsp.faces = this.unserializeArray(lumps[this.LUMP.FACES], 0, this.STRUCT.dface_t);
        bsp.planes = this.unserializeArray(lumps[this.LUMP.PLANES], 0, this.STRUCT.dplane_t);
        bsp.edges = this.unserializeArray(lumps[this.LUMP.EDGES], 0, this.STRUCT.dedge_t);
        bsp.surfedges = this.unserializeArray(lumps[this.LUMP.SURFEDGES], 0, { edge: 'int' });
        bsp.vertecies = this.unserializeArray(lumps[this.LUMP.VERTEXES], 0, this.STRUCT.vertex);
        
        // textures
        bsp.texinfo = this.unserializeArray(lumps[this.LUMP.TEXINFO], 0, this.STRUCT.texinfo_t);
        bsp.texdata = this.unserializeArray(lumps[this.LUMP.TEXDATA], 0, this.STRUCT.dtexdata_t);
        bsp.texdatastringtable = this.unserializeArray(lumps[this.LUMP.TEXDATA_STRING_TABLE], 0, { tex: 'int' });
        bsp.textures = this.unserializeTextureDataLump(lumps[this.LUMP.TEXDATA_STRING_DATA], bsp.texdatastringtable);
        
        // brushes
        // bsp.brushes = this.unserializeArray(lumps[this.LUMP.BRUSHES], 0, this.STRUCT.dbrush_t);
        // bsp.brushsides = this.unserializeArray(lumps[this.LUMP.BRUSHSIDES], 0, this.STRUCT.dbrushside_t);
        
        // displacements
        log('Decompile displacements...');

        bsp.displacements = this.unserializeArray(lumps[this.LUMP.DISPINFO], 0, this.STRUCT.ddispinfo_t);
        bsp.displacementverts = this.unserializeArray(lumps[this.LUMP.DISP_VERTS], 0, this.STRUCT.dDispVert);
        // bsp.displacementtris = this.unserializeArray(lumps[this.LUMP.DISP_TRIS], 0, this.STRUCT.dDispTri);

        // entities
        const entitiesString = BSPFile.unserializeASCI(lumps[BSPFile.LUMP.ENTITIES]);
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
        bsp.pakfile = lumps[BSPFile.LUMP.PAKFILE];

        log('read gamelumps...');

        // gamelumps
        const gamelumps = BSPFile.unserializeGameLumps(lumps[BSPFile.LUMP.GAME_LUMP], bsp.view);

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
                    material: textureIndex,
                    currentVertexIndex: 0,
                };
    
                const currentVertexIndex = meshes[textureIndex].currentVertexIndex;
    
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
                    
                    let geom = new pex.Geometry({
                        vertices: [
                            new pex.Vec3(0, 1, 0),
                            new pex.Vec3(0, 0, 0),
                            new pex.Vec3(1, 1, 0),
                        ],
                        faces: [
                            [ 0, 1, 2 ]
                        ]
                    });
    
                    try {
                        geom.computeNormals();
                        geom.computeEdges();
                        geom.triangulate();
                        geom.computeHalfEdges();

                        geom = geom.triangulate();

                        geom.catmullClark(0.5, 0.1);

                        console.log(geom);
                        
                        return;
                    } catch(err) {
                        error(err);
                        return;
                    }

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

                // transform geo data
                // get uvs
                const tv = textureInfo.textureVecs.data;
    
                // vertexes
                const parsedVertecies = geo.vertices.map((v, i) => {
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

                    const vertex = [
                        y + origin[1] + displace.y,
                        z + origin[2] + displace.z, 
                        x + origin[0] + displace.x, 
        
                        (tv[0][0] * x + tv[0][1] * y + tv[0][2] * z + tv[0][3]) / textureData.width_height_0,
                        (tv[1][0] * x + tv[1][1] * y + tv[1][2] * z + tv[1][3]) / textureData.width_height_1,
        
                        -normal[1].valueOf(),
                        -normal[2].valueOf(), 
                        -normal[0].valueOf(), 
                    ];

                    return vertex;
                }).flat();

                // indexes
                const parsedIndices = geo.faces.flat().map(index => index += currentVertexIndex);

                meshes[textureIndex].currentVertexIndex += geo.vertices.length;
    
                meshes[textureIndex].vertecies.push(...parsedVertecies);
                meshes[textureIndex].indices.push(...parsedIndices);
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
