import { Structs, LumpTypes } from './BSPFileTypes';
import { BinaryFile } from './BinaryFile';

export default class BSPFile extends BinaryFile {

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
            console.log(header);
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
                id: String.fromCharCode(...this.Uint32ToBytes(gamelumpHeader.id)),
                version: gamelumpHeader.version,
                flags: gamelumpHeader.flags,
                buffer: fileBuffer.slice(fileOfs, fileOfs + fileLen)
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

        // models
        bsp.models = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.MODELS], BSPFile.STRUCT.dmodel_t);

        // world geometry
        bsp.faces = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.FACES], BSPFile.STRUCT.dface_t);
        bsp.planes = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.PLANES], BSPFile.STRUCT.dplane_t);
        bsp.edges = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.EDGES], BSPFile.STRUCT.dedge_t);
        bsp.surfedges = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.SURFEDGES], { edge: 'int' });
        bsp.vertecies = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.VERTEXES], BSPFile.STRUCT.vertex);
        
        // textures
        // bsp.texinfo = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.TEXINFO], BSPFile.STRUCT.texinfo_t);
        // bsp.texdata = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.TEXDATA], BSPFile.STRUCT.dtexdata_t);
        // bsp.texdatastringtable = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.TEXDATA_STRING_TABLE], { tex: 'int' });
        // bsp.textures = BSPFile.unserializeTextureDataLump(lumps[BSPFile.LUMP.TEXDATA_STRING_DATA], bsp.texdatastringtable);
        
        // displacements
        // bsp.displacements = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.DISPINFO], BSPFile.STRUCT.ddispinfo_t);
        // bsp.displacementverts = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.DISP_VERTS], BSPFile.STRUCT.dDispVert);
        // bsp.displacementtris = BSPFile.unserializeStructArray(lumps[BSPFile.LUMP.DISP_TRIS], BSPFile.STRUCT.dDispTri);

        // entities
        const entitiesString = BSPFile.unserializeASCILump(lumps[BSPFile.LUMP.ENTITIES]);
        bsp.entities = BSPFile.unserializeVMFString(entitiesString);

        // pakfile
        // bsp.pakfile = lumps[BSPFile.LUMP.PAKFILE];

        // gamelumps
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
