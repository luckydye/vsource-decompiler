import { BinaryFile } from './BinaryFile';
import { Structs } from './MDLFileTypes';

export default class MDLFile extends BinaryFile {

    static get STRUCT() {
        return Structs;
    }

    static fromDataArray(dataArray) {
        const mdl = this.createFile(dataArray);

        mdl.header = this.unserialize(mdl.view, 0, Structs.studiohdr_t).data;

        // body parts
        mdl.bodyparts = [];

        for(let b = 0; b < mdl.header.bodypart_count.data; b++) {
            const part = this.unserialize(mdl.view, mdl.header.bodypart_offset.data, Structs.mstudiobodyparts_t);
            mdl.bodyparts.push(part.data);
        }

        mdl.models = [];
        mdl.meshes = [];

        for(let part of mdl.bodyparts) {
            for(let model of part.models.data) {
                mdl.models.push(model);
                
                for(let b = 0; b < model.mesh_count.data; b++) {
                    const byteOffset = mdl.header.bodypart_offset.data + part.model_offset.data + model.mesh_offset.data;
                    const mesh = this.unserialize(mdl.view, byteOffset, Structs.mstudiomesh_t);
                    mdl.meshes.push(mesh.data);
                }
            }
        }

        return mdl;
    }

}