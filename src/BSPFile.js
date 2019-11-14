function Uint32ToBytes(int) {
    const bytes = [0, 0, 0, 0];

    bytes[0] = (int >> 24) & 0xFF;
    bytes[1] = (int >> 16) & 0xFF;
    bytes[2] = (int >> 8) & 0xFF;
    bytes[3] = int & 0xFF;

    return bytes.reverse();
}

export default class BSPFile {

    static get LUMP() {
        return {
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
        }
    }

    static get FILE_HEADER_BYTE_LENGTH() {
        return 1036;
    }

    static get HEADER_LUMPS() {
        return 64;
    }

    static readHeader(headerView) {

        const dheader_t = {
            indent: null,
            version: null,
            lumps: null,
            mapRevision: null,
        }

        const indentBytes = Uint32ToBytes(headerView[0]);
        const indentString = String.fromCharCode(...indentBytes);

        dheader_t.indent = indentString;
        dheader_t.version = headerView[1];
        dheader_t.lumps = [];

        const lumpsStartIndex = 2;
        const lumpByteSize = 16;

        for(let i = 0; i < BSPFile.HEADER_LUMPS; i++) {

            const sliceOffset = lumpsStartIndex + (i * (lumpByteSize / 4));

            const lump = headerView.slice(sliceOffset, sliceOffset + 4);

            const lump_t = {
                fileofs: lump[0],
                filelen: lump[1],
                version : lump[2],
                fourCC: Uint32ToBytes(lump[3]),
            }

            dheader_t.lumps.push(lump_t);
        }

        const revisionStartIndex = lumpsStartIndex + BSPFile.HEADER_LUMPS * (lumpByteSize / 4);

        dheader_t.mapRevision = headerView[revisionStartIndex];

        return dheader_t;
    }

    static readLumpData(lumps, dataArray) {
        const lumpsData = [];

        for(let lump of lumps) {
            const lumpLength = lump.filelen;
            const lumpOffset = lump.fileofs;
            
            const lumpData = new Uint8Array(dataArray.slice(lumpOffset, lumpOffset + lumpLength));
            lumpsData.push(lumpData);
        }

        return lumpsData;
    }

    static verifyHeader(header) {
        const knownTypes = ['VBSP'];

        if(knownTypes.indexOf(header.indent) == -1) {
            throw new Error('Uknown bsp type.');
        }
    }

    constructor(dataArray) {

        const headerView = new Uint32Array(dataArray.slice(0, BSPFile.FILE_HEADER_BYTE_LENGTH));

        this.header = BSPFile.readHeader(headerView);

        try {
            BSPFile.verifyHeader(this.header);
        } catch(err) {
            throw err;
        }

        this.lumps = BSPFile.readLumpData(this.header.lumps, dataArray);
    }

}
