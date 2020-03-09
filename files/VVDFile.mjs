import { BinaryFile } from './BinaryFile.mjs';
import { VDD } from './VVDStructure.mjs';

// https://developer.valvesoftware.com/wiki/VVD

export default class VVDFile extends BinaryFile {

    static get STRUCT() {
        return VDD;
    }

    static decompileVertexData(vvd) {
        let byteOffset = vvd.header.vertexDataStart.data;
        let vertecies = [];

        for(let v = 0; v < vvd.vertexCount; v++) {
            byteOffset += 16;
            const vert = this.unserialize(vvd.view, byteOffset, VDD.mstudiovertex_t);
            byteOffset = vert.byteOffset;
            vertecies.push([
                vert.data.pos_y.data,
                vert.data.pos_z.data,
                vert.data.pos_x.data,
                
                vert.data.tex_u.data,
                vert.data.tex_v.data,
                
                -vert.data.norm_y.data,
                -vert.data.norm_z.data,
                -vert.data.norm_x.data,
            ]);
        }

        return vertecies;
    }

    static fromDataArray(dataArray) {
        const vvd = this.createFile(dataArray);

        vvd.header = this.unserialize(vvd.view, 0, VDD.vertexFileHeader_t).data;
        vvd.vertexCount = vvd.header.numLODVertexes.data[0];

        return vvd;
    }

    convertToMesh() {
        return VVDFile.decompileVertexData(this);
    }

}
