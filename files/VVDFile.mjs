import { BinaryFile } from './BinaryFile.mjs';
import { VDD } from './VVDStructure.mjs';

// https://developer.valvesoftware.com/wiki/VVD

export default class VVDFile extends BinaryFile {

    static get STRUCT() {
        return VDD;
    }

    static fromDataArray(dataArray) {
        const vvd = this.createFile(dataArray);

        vvd.header = this.unserialize(vvd.view, 0, VDD.vertexFileHeader_t).data;
        vvd.vertexCount = vvd.header.numLODVertexes.data[0];

        return vvd;
    }

    convertToMesh() {
        let byteOffset = this.header.vertexDataStart.data;
        
        let vertecies = [];
        let normals = [];
        let uvs = [];

        for(let v = 0; v < this.vertexCount; v++) {
            byteOffset += 16;
            const vert = VVDFile.unserialize(this.view, byteOffset, VDD.mstudiovertex_t);
            byteOffset = vert.byteOffset;

            vertecies.push([
                vert.data.pos_y.data,
                vert.data.pos_z.data,
                vert.data.pos_x.data,
            ]);
            
            uvs.push([
                vert.data.tex_u.data,
                vert.data.tex_v.data,
            ]);

            normals.push([
                -vert.data.norm_y.data,
                -vert.data.norm_z.data,
                -vert.data.norm_x.data,
            ]);
        }

        return {
            vertecies,
            uvs,
            normals
        };
    }

}
