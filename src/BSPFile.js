function Uint32ToBytes(int) {
    const bytes = [0, 0, 0, 0];

    bytes[0] = (int >> 24) & 0xFF;
    bytes[1] = (int >> 16) & 0xFF;
    bytes[2] = (int >> 8) & 0xFF;
    bytes[3] = int & 0xFF;

    return bytes;
}

const Structs = {
    vector: {
        0: 'float',
        1: 'float',
        2: 'float',
    },
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
        firstface_numfaces: 'int, int'
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
        EdgeNeighbors: 'CDispNeighbor[4]',
        CornerNeighbors: 'CDispCornerNeighbors[4]',
        AllowedVerts: 'unsigned int[10]',
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
        name: 'char[dictEntries]'
    },
    StaticPropLeafLump_t: {
        leafEntries: 'int',
        leaf: 'unsigned short[leafEntries]'
    },
    color32: {
        0: 'byte',
        1: 'byte',
        2: 'byte',
        3: 'byte',
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
        Solid: 'unsigned char',
        Flags: 'unsigned char',
        Skin: 'int',
        FadeMinDist: 'float',
        FadeMaxDist: 'float',
        LightingOrigin: 'vector',
        ForcedFadeScale: 'float',
        MinCPULevel: 'unsigned char',
        MaxCPULevel: 'unsigned char',
        MinGPULevel: 'unsigned char',
        MaxGPULevel: 'unsigned char',
        DiffuseModulation: 'color32',
        DisableX360: 'int',
        FlagsEx: 'unsigned int',
        // UniformScale: 'float',
    },
};

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

export default class BSPFile {

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

    static readHeader(headerView, headerBuffer) {
        const headerStruct = this.unserializeStruct(headerBuffer, BSPFile.STRUCT.dheader_t);
        const headerData = headerStruct.data;
        headerData.ident = String.fromCharCode(...headerData.ident);
        return headerData;
    }

    static verifyHeader(header) {
        if(this.known_types.indexOf(header.ident) == -1) {
            throw new Error('Uknown bsp type');
        }
        if(header.version > this.supported_version) {
            throw new Error('Unknown bsp version');
        }
    }

    static readLumpData(lumps, dataArray) {
        const lumpsData = [];

        for(let lump of lumps) {
            const lumpLength = lump.filelen;
            const lumpOffset = lump.fileofs;
            
            lumpsData.push(dataArray.slice(lumpOffset, lumpOffset + lumpLength));
        }

        return lumpsData;
    }

    static unserializeStruct(byteArray, struct) {

        let byteIndex = 0;
        let structData = {};

        const parseBytes = type => {
            type = type.toLocaleLowerCase();

            let data = null;
            let typeByteSize = 0;
            let typeBufferType = null;

            const typeMapping = {
                'int': Int32Array,
                'unsigned int': Uint32Array,
                'float': Float32Array,
                'short': Int16Array,
                'unsigned short': Uint16Array,
                'byte': Uint8Array,
                'bool': Uint8Array,
            }

            switch (type) {
                case 'cdispneighbor': {
                    // skip to return buffer
                    byteIndex += 16;
                    data = byteArray.slice(byteIndex, byteIndex + 16);
                    break;
                }
                case 'cdispcornerneighbors': {
                    // skip to return buffer
                    byteIndex += 16;
                    data = byteArray.slice(byteIndex, byteIndex + 16);
                    break;
                }

                case 'char': {
                    data = [];
                    for(let i = 0; i < 128; i++) {
                        const byte = parseBytes('byte');
                        data[i] = byte;
                    }
                    data = String.fromCharCode(...data);
                    break;
                }

                case 'unsigned char': {
                    data = parseBytes('byte');
                    break;
                }
                
                default: {
                    if(type in typeMapping) {
                        typeBufferType = typeMapping[type];

                    } else if(type in BSPFile.STRUCT) {
                        const bytes = byteArray.slice(byteIndex);
                        const structData = this.unserializeStruct(bytes, BSPFile.STRUCT[type]);
                        byteIndex += structData.byteSize;
                        data = structData.data;

                    } else {
                        throw new Error('Unknown data type "' + type + '"');
                    }
                }
            }

            if(typeBufferType) {
                typeByteSize = typeBufferType.BYTES_PER_ELEMENT;
                data = new typeBufferType(byteArray.slice(byteIndex, byteIndex + typeByteSize))[0];
            }

            byteIndex += typeByteSize;

            return data;
        }

        const parseType = type => {
            const isArray = type[type.length-1] == "]";
            if(isArray) {
                const arrayData = [];
                const arrayIdentifier = type.match(/\[[0-9a-zA-Z_]+\]/g)[0];
                const arrayDataType = type.replace(arrayIdentifier, '');

                let arrayLength = arrayIdentifier.replace(/(\[|\])/g, '');

                if(isNaN(arrayLength)) {
                    if(arrayLength in structData) {
                        arrayLength = structData[arrayLength];
                    } else if(arrayLength in BSPFile) {
                        arrayLength = BSPFile[arrayLength];
                    } else {
                        throw new Error('Invalid type array length');
                    }
                } else {
                    arrayLength = parseInt(arrayLength);
                }

                for(let i = 0; i < arrayLength; i++) {
                    arrayData[i] = parseType(arrayDataType);
                }

                return arrayData;
            } else {
                return parseBytes(type);
            }
        }

        for(let key in struct) {
            let type = struct[key];

            const typeCount = type.split(',').length;

            type = type.split(',')[0];

            for(let i = 0; i < typeCount; i++) {
                if(typeCount > 1) {
                    structData[key + '_' + i] = parseType(type);
                } else {
                    structData[key] = parseType(type);
                }
            }
        }

        return {
            byteSize: byteIndex,
            data: structData
        };
    }

    static unserializeStructArray(lumpBuffer, struct) {
        const structs = [];

        const lumpByteSize = lumpBuffer.byteLength;

        let lastByteOffset = 0;
        let guessByteSize = 255;

        while(lastByteOffset < lumpByteSize) {
            const byteArray = lumpBuffer.slice(lastByteOffset, lastByteOffset + guessByteSize);

            const structData = this.unserializeStruct(byteArray, struct);

            guessByteSize = structData.byteSize;
            lastByteOffset += structData.byteSize;

            structs.push(structData.data);
        }

        return structs;
    }

    static unserializeTextureDataLump(lumpBuffer, texdatastringtable) {
        const textures = [];

        const lumpByteSize = lumpBuffer.byteLength;

        let byteOffset = 0;

        for(let i = 0; i < texdatastringtable.length; i++) {
            const index = texdatastringtable[i].tex;
            const nextIndex = texdatastringtable[i + 1] ? texdatastringtable[i + 1].tex -1 : lumpByteSize - 1;
            const byteLength = nextIndex - index;

            const byteData = lumpBuffer.slice(index, index + byteLength);
            const string = String.fromCharCode(...(new Uint8Array(byteData)));

            textures.push(string);
        }

        return textures;
    }

    static unserializeGameLumps(lumpBuffer, fileBuffer) {
        const structData = this.unserializeStruct(lumpBuffer, BSPFile.STRUCT.dgamelumpheader_t);
        const headerBytesize = structData.byteSize;
        const header = structData.data;

        const gamelumps = [];

        for(let l = 0; l < header.lumpCount; l++) {
            const gamelumpHeader = header.gamelump[l];

            const fileLen = gamelumpHeader.filelen;
            const fileOfs = gamelumpHeader.fileofs;

            gamelumps.push({
                id: String.fromCharCode(...Uint32ToBytes(gamelumpHeader.id)),
                version: gamelumpHeader.version,
                flags: gamelumpHeader.flags,
                buffer: fileBuffer.slice(fileOfs, fileOfs + fileLen)
            });
        }

        return gamelumps;
    }

    static unserializeASCILump(lumpBuffer) {
        return String.fromCharCode(...new Uint8Array(lumpBuffer));
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

        const dict = this.unserializeStruct(buffer.slice(byteOffset), BSPFile.STRUCT.StaticPropDictLump_t);
        const propLeafs = this.unserializeStruct(buffer.slice(byteOffset += dict.byteSize), BSPFile.STRUCT.StaticPropLeafLump_t);
        
        const entries = new Int32Array(buffer.slice(byteOffset += propLeafs.byteSize, byteOffset += 4))[0];
        const models = dict.data.name.map(str => str.replace(/\W+$/g, ""));

        const props = [];

        for(let p = 0; p < entries; p++) {
            const prop = this.unserializeStruct(buffer.slice(byteOffset), BSPFile.STRUCT.StaticPropLumpV10_t);
            byteOffset +=  prop.byteSize;
            prop.data.PropType = models[prop.data.PropType];
            props.push(prop.data);
        }

        return props;
    }

    static fromDataArray(dataArray) {
        const bsp = new BSPFile();

        const headerBuffer = dataArray.slice(0, BSPFile.FILE_HEADER_BYTE_LENGTH);
        const headerView = new Uint32Array(headerBuffer);

        bsp.header = BSPFile.readHeader(headerView, headerBuffer);

        try {
            BSPFile.verifyHeader(bsp.header);
        } catch(err) {
            throw err;
        }

        const lumps = BSPFile.readLumpData(bsp.header.lumps, dataArray);

        bsp.faces = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.FACES], BSPFile.STRUCT.dface_t);
        bsp.planes = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.PLANES], BSPFile.STRUCT.dplane_t);
        bsp.edges = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.EDGES], BSPFile.STRUCT.dedge_t);
        bsp.surfedges = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.SURFEDGES], { edge: 'int' });
        bsp.vertecies = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.VERTEXES], BSPFile.STRUCT.vertex);
        bsp.texinfo = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.TEXINFO], BSPFile.STRUCT.texinfo_t);
        bsp.texdata = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.TEXDATA], BSPFile.STRUCT.dtexdata_t);
        bsp.texdatastringtable = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.TEXDATA_STRING_TABLE], { tex: 'int' });
        bsp.textures = BSPFile.unserializeTextureDataLump(lumps[BSPFile.LUMP.TEXDATA_STRING_DATA], bsp.texdatastringtable);
        bsp.displacements = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.DISPINFO], BSPFile.STRUCT.ddispinfo_t);
        bsp.displacementverts = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.DISP_VERTS], BSPFile.STRUCT.dDispVert);
        bsp.displacementtris = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.DISP_TRIS], BSPFile.STRUCT.dDispTri);
        bsp.models = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.MODELS], BSPFile.STRUCT.dmodel_t);

        const entitiesString = BSPFile.unserializeASCILump(lumps[BSPFile.LUMP.ENTITIES]);
        bsp.entities = BSPFile.unserializeVMFString(entitiesString);

        bsp.pakfile = lumps[BSPFile.LUMP.PAKFILE];

        const gamelumps = BSPFile.unserializeGameLumps(lumps[BSPFile.LUMP.GAME_LUMP], dataArray);

        bsp.gamelumps = {};

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
        const faces = this.faces;

        const vertexResultArray = [];
        const indexResultArray = [];

        let currentVertexIndex = 0;

        for(let face of faces) {
            const plane = planes[face.planenum];

            const faces = face.side;
            const normal = plane.normal;

            const faceSurfedges = surfedges.slice(face.firstedge, face.firstedge + face.numedges);

            const faceEdges = faceSurfedges.map(surfEdge => {
                let edge = edges[Math.abs(surfEdge.edge)].v;
                if(surfEdge.edge < 0) {
                    edge = edge.reverse();
                }
                return edge;
            });

            const verts = [];
            const indexes = [];

            for(let edge of faceEdges) {
                let vertIndecies = edge;
                verts.push(vertecies[vertIndecies[0]]);
            }

            const numberOfIndecies = (verts.length - 2) * 3;

            for(let i = 0; i < numberOfIndecies / 3; i++) {
                indexes.push(currentVertexIndex + 0);
                indexes.push(currentVertexIndex + 1 + i);
                indexes.push(currentVertexIndex + 2 + i);
            }

            currentVertexIndex += verts.length;

            const parsedVertecies = verts.map(v => ({
                vertex: [v.x, v.z, v.y], 
                uv: [0, 1, 0],
                normal: [normal[0], normal[2], normal[1]],
            }));

            vertexResultArray.push(...parsedVertecies);
            indexResultArray.push(...indexes);
        }

        return {
            indecies: indexResultArray,
            vertecies: vertexResultArray
        };
    }

}
