import { Structs, LumpTypes } from './BSPFileTypes';
import { BinaryFile } from './BinaryFile';

export default class BSPFile extends BinaryFile {

    static get decode_lumps() {
        return [
            BSPFile.LUMP.MODELS,
            BSPFile.LUMP.FACES,
            BSPFile.LUMP.PLANES,
            BSPFile.LUMP.EDGES,
            BSPFile.LUMP.SURFEDGES,
            BSPFile.LUMP.VERTEXES,
            // BSPFile.LUMP.TEXINFO,
            // BSPFile.LUMP.TEXDATA,
            // BSPFile.LUMP.TEXDATA_STRING_TABLE,
            // BSPFile.LUMP.TEXDATA_STRING_DATA,
            // BSPFile.LUMP.DISPINFO,
            // BSPFile.LUMP.DISP_VERTS,
            // BSPFile.LUMP.DISP_TRIS,
            BSPFile.LUMP.ENTITIES,
            // BSPFile.LUMP.PAKFILE,
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

    static readLumpData(lumps, dataArray) {
        const lumpsData = [];

        for(let lump of lumps.data) {
            const index = lumps.data.indexOf(lump);
            if(this.decode_lumps.indexOf(index) != -1) {
                const lumpLength = lump.filelen.data;
                const lumpOffset = lump.fileofs.data;
                const view = new DataView(dataArray.slice(lumpOffset, lumpOffset + lumpLength));
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
            const index = texdatastringtable[i].tex;
            const nextIndex = texdatastringtable[i + 1] ? texdatastringtable[i + 1].tex -1 : lumpByteSize - 1;
            const byteLength = nextIndex - index;

            const byteData = lumpBuffer.slice(index, index + byteLength);
            const string = String.fromCharCode(...(new Uint8Array(byteData)));

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

        for(let p = 0; p < entries.data; p++) {
            const prop = this.unserialize(buffer, byteOffset, BSPFile.STRUCT.StaticPropLumpV10_t);
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

        try {
            BSPFile.verifyHeader(bsp.header);
        } catch(err) {
            throw err;
        }

        const lumps = this.readLumpData(bsp.header.lumps, dataArray);

        console.log('decode lumps...');

        // models
        bsp.models = this.unserializeArray(lumps[this.LUMP.MODELS], 0, this.STRUCT.dmodel_t);

        // world geometry
        bsp.faces = this.unserializeArray(lumps[this.LUMP.FACES], 0, this.STRUCT.dface_t);
        bsp.planes = this.unserializeArray(lumps[this.LUMP.PLANES], 0, this.STRUCT.dplane_t);
        bsp.edges = this.unserializeArray(lumps[this.LUMP.EDGES], 0, this.STRUCT.dedge_t);
        bsp.surfedges = this.unserializeArray(lumps[this.LUMP.SURFEDGES], 0, { edge: 'int' });
        bsp.vertecies = this.unserializeArray(lumps[this.LUMP.VERTEXES], 0, this.STRUCT.vertex);
        
        // textures
        // bsp.texinfo = this.unserializeArray(lumps[this.LUMP.TEXINFO], 0, this.STRUCT.texinfo_t);
        // bsp.texdata = this.unserializeArray(lumps[this.LUMP.TEXDATA], 0, this.STRUCT.dtexdata_t);
        // bsp.texdatastringtable = this.unserializeArray(lumps[this.LUMP.TEXDATA_STRING_TABLE], 0, { tex: 'int' });
        // bsp.textures = this.unserializeTextureDataLump(lumps[this.LUMP.TEXDATA_STRING_DATA], 0, bsp.texdatastringtable);
        
        // displacements
        // bsp.displacements = this.unserializeArray(lumps[this.LUMP.DISPINFO], 0, this.STRUCT.ddispinfo_t);
        // bsp.displacementverts = this.unserializeArray(lumps[this.LUMP.DISP_VERTS], 0, this.STRUCT.dDispVert);
        // bsp.displacementtris = this.unserializeArray(lumps[this.LUMP.DISP_TRIS], 0, this.STRUCT.dDispTri);

        // entities
        const entitiesString = BSPFile.unserializeASCILump(lumps[BSPFile.LUMP.ENTITIES]);
        bsp.entities = BSPFile.unserializeVMFString(entitiesString);

        // pakfile
        // bsp.pakfile = lumps[BSPFile.LUMP.PAKFILE];

        console.log('read gamelumps...');

        // gamelumps
        const gamelumps = BSPFile.unserializeGameLumps(lumps[BSPFile.LUMP.GAME_LUMP], bsp.view);

        bsp.gamelumps = {};

        console.log('decode gamelumps...');

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
            const plane = planes[face.planenum.data];

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
                vertex: [v.x.data, v.z.data, v.y.data], 
                uv: [1, 1, 0],
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
