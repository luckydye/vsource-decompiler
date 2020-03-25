import { BinaryFile } from 'binary-file-lib';
import { MDL } from './MDLStructure.mjs';

// helped alot:
// https://github.com/ZeqMacaw/Crowbar/blob/master/Crowbar/Core/SourceModel/SourceCommon/SourceMdlFileData/SourceMdlBodyPart.vb

export default class MDLFile extends BinaryFile {

    static get STRUCT() {
        return MDL;
    }

    static fromDataArray(dataArray) {
        const mdl = this.createFile(dataArray);

        const mdlhead = this.unserialize(mdl.view, 0, MDL.studiohdr_id_version).data;

        if(mdlhead.version == 10) {
            mdl.header = this.unserialize(mdl.view, 0, MDL.studiohdr_t_v10).data;
        } else {
            mdl.header = this.unserialize(mdl.view, 0, MDL.studiohdr_t_v49).data;
        }

        mdl.bodyparts = [];
        mdl.models = [];
        mdl.meshes = [];
        mdl.textures = [];
        mdl.texturePaths = [];
        mdl.skins = [];

        // // bodyparts
        // for(let b = 0; b < mdl.header.bodypart_count; b++) {
        //     if(mdlhead.version == 49) {
        //         const part = this.unserialize(mdl.view, mdl.header.bodypart_offset.valueOf(), MDL.mstudiobodyparts_t_49);
        //         mdl.bodyparts.push(part.data);
        //     } else {
        //         const part = this.unserialize(mdl.view, mdl.header.bodypart_offset.valueOf(), MDL.mstudiobodyparts_t);
        //         mdl.bodyparts.push(part.data);
        //     }
        // }

        // // meshes
        // for(let part of mdl.bodyparts) {
        //     for(let model of part.models.valueOf()) {
        //         mdl.models.push(model);

        //         for(let b = 0; b < model.mesh_count.data; b++) {
        //             const byteOffset = mdl.header.bodypart_offset.valueOf() + part.model_offset.valueOf() + model.mesh_offset.valueOf();
        //             const mesh = this.unserialize(mdl.view, byteOffset, MDL.mstudiomesh_t);

        //             mdl.meshes.push(mesh.valueOf());
        //         }
        //     }
        // }

        // textures
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

        // texture paths
        for(let i = 0; i < mdl.header.texturePathCount; i++) {
            const texPathOffset = this.unserialize(mdl.view, mdl.header.texturePathOffset, { offset: 'int' });
            const texPathString = this.unserialize(mdl.view, texPathOffset.data.offset, {
                path: `unsigned char`,
            }).data;

            mdl.texturePaths.push(texPathString.path.toString());
        }

        // skins
        // for(let i = 0; i < mdl.header.skinfamily_count; i++) {
        //     const part = this.unserialize(mdl.view, mdl.header.skin_index, {
        //         replacement_table: `byte[${mdl.header.skinfamily_count * mdl.header.skinreference_count * 2}]`,
        //     });
        //     mdl.skins.push(part.data.replacement_table.toString());
        // }

        return mdl;
    }

}
