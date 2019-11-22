import { BinaryFile } from './BinaryFile';
import { MDL } from './MDLFileTypes';

export default class MDLFile extends BinaryFile {

    static get STRUCT() {
        return MDL;
    }

    static fromDataArray(dataArray) {
        const mdl = this.createFile(dataArray);

        mdl.header = this.unserialize(mdl.view, 0, MDL.studiohdr_t).data;

        // body parts
        mdl.bodyparts = [];

        for(let b = 0; b < mdl.header.bodypart_count.data; b++) {
            const part = this.unserialize(mdl.view, mdl.header.bodypart_offset.data, MDL.mstudiobodyparts_t);
            mdl.bodyparts.push(part.data);
        }

        mdl.models = [];
        mdl.meshes = [];
        mdl.textures = [];

        for(let part of mdl.bodyparts) {
            for(let model of part.models.data) {
                mdl.models.push(model);
                
                for(let b = 0; b < model.mesh_count.data; b++) {
                    const byteOffset = mdl.header.bodypart_offset.data + part.model_offset.data + model.mesh_offset.data;
                    const mesh = this.unserialize(mdl.view, byteOffset, MDL.mstudiomesh_t);
                    mdl.meshes.push(mesh.data);
                }
            }
        }

        let byteOffset = mdl.header.texture_offset.data;

        for(let t = 0; t < mdl.header.texture_count.data; t++) {
            const part = this.unserialize(mdl.view, byteOffset, MDL.mstudiotexture_t);
            const name_offset = part.data.name_offset.data;
            const name = this.unserialize(mdl.view, name_offset + byteOffset, { name: 'unsigned char' });

            byteOffset = part.byteOffset;

            const tex = part.data;
            tex.name = name.data.name;

            mdl.textures.push(tex);
        }

        return mdl;
    }

}