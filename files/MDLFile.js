import { BinaryFile } from './BinaryFile';

// helped alot:
// https://github.com/ZeqMacaw/Crowbar/blob/master/Crowbar/Core/SourceModel/SourceCommon/SourceMdlFileData/SourceMdlBodyPart.vb

export const MDL = {
    studiohdr_t: {
        id: 'char[4]',
        version: 'int',

        checksum: 'int',

        name: 'char[64]',

        dataLength: 'int',

        eyeposition: 'vector',
        illumposition: 'vector',
        hull_min: 'vector',
        hull_max: 'vector',
        view_bbmin: 'vector',
        view_bbmax: 'vector',

        flags: 'int',

        bone_count: 'int',
        bone_offset: 'int',
        bonecontroller_count: 'int',
        bonecontroller_offset: 'int',

        hitbox_count: 'int',
        hitbox_offset: 'int',

        localanim_count: 'int',
        localanim_offset: 'int',

        localseq_count: 'int',
        localseq_offset: 'int',

        activitylistversion: 'int',
        eventsindexed: 'int',

        texture_count: 'int',
        texture_offset: 'int',

        texturePathCount: 'int',
        texturePathOffset: 'int',

        skinreference_count: 'int',
        skinfamily_count: 'int',
        skin_index: 'int',

        bodypart_count: 'int',
        bodypart_offset: 'int',

        attachment_count: 'int',
        attachment_offset: 'int',

        localnode_count: 'int',
        localnode_index: 'int',
        localnode_name_index: 'int',

        flexdesc_count: 'int',
        flexdesc_index: 'int',

        flexcontroller_count: 'int',
        flexcontroller_index: 'int',

        flexrules_count: 'int',
        flexrules_index: 'int',

        ikchain_count: 'int',
        ikchain_index: 'int',

        mouths_count: 'int',
        mouths_index: 'int',

        localposeparam_count: 'int',
        localposeparam_index: 'int',

        surfaceprop_index: 'int',

        keyvalue_index: 'int',
        keyvalue_count: 'int',

        iklock_count: 'int',
        iklock_index: 'int',

        mass: 'float',
        contents: 'int',

        includemodel_count: 'int',
        includemodel_index: 'int',

        virtualModel: 'int',

        animblocks_name_index: 'int',
        animblocks_count: 'int',
        animblocks_index: 'int',

        animblockModel: 'int',

        bonetablename_index: 'int',

        vertex_base: 'int',
        offset_base: 'int',

        directionaldotproduct: 'byte',
        rootLod: 'byte',

        numAllowedRootLods: 'byte',

        unused1: 'byte',
        unused2: 'int',

        flexcontrollerui_count: 'int',
        flexcontrollerui_index: 'int',

        studiohdr2index: 'int',

        unused3: 'int',
    },
    mstudiobodyparts_t: {
        name_offset: 'int',
        model_count: 'int',
        base: 'int',
        model_offset: 'int',
        // name: 'unsigned char',
        models: 'mstudiomodel_t[model_count]',

        ModelCommandIsUsed: 'bool',
        EyeballOptionIsUsed : 'bool',
        // theFlexFrames : 'flexframe_t?',
    },
    mstudiomodel_t: {
        name: 'char[64]',
        type: 'int',
        boundingradius: 'float',

        mesh_count: 'int',
        mesh_offset: 'int',

        vertex_count: 'int',
        vertex_offset: 'int',

        tangents_offset: 'int',

        attachment_count: 'int',
        attachment_offset: 'int',

        eyeballs_count: 'int',
        eyeball_offset: 'int',

        vertexdata: 'mstudio_modelvertexdata_t',

        unused: 'int[8]',

        smd_files_array: 'unsigned char',
    },

    mstudiomesh_t: {
        materialIndex: 'int',
        modelOffset: 'int',
        vertexCount: 'int',
        vertexIndexStart: 'int',
        flexCount: 'int',
        flexOffset: 'int',
        materialType: 'int',
        materialParam: 'int',
        id: 'int',
        origin: 'vector',
        vertexData: 'mstudio_meshvertexdata_t',
    },
    mstudioflex_t: {
        flexDescIndex: 'int',
        target0: 'float',
        target1: 'float',
        target2: 'float',
        target3: 'float',
        numverts: 'int',
        vertindex: 'int',
        flexDescPartnerIndex: 'int',
        vertAnimType: 'byte',
        unusedChar: 'char[2]',
        unused: 'int[5]',
        // ...
    },
    mstudio_meshvertexdata_t: {
        modelVertexDataP: 'int',
        lodVertexCount: 'int',
    },
    mstudio_modelvertexdata_t: {
        vertexDataP: 'int',
        tangentDataP: 'int',
    },
    mstudioboneweight_t: {
        weight: 'float[3]', // MAX_NUM_BONES_PER_VERT
        bone: 'char[3]', // MAX_NUM_BONES_PER_VERT
        numbones: 'byte',
    },
    mstudiovertex_t: {
        m_BoneWeights: 'mstudioboneweight_t',
        m_vecPosition: 'vector',
        m_vecNormal: 'vector',
        m_vecTexCoord: 'vector2d',
    },

    mstudiotexture_t: {
        name_offset: 'int',
        flags: 'int',
        used: 'int',
        unused: 'int',
        material: 'int',
        client_material: 'int',
        unused2: 'int[10]',
    }
};

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