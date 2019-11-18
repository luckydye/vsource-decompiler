export const Structs = {
    studiohdr_t: {
        id: 'int',
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

        /// ??????????
        // https://github.com/pmrowla/hl2sdk-csgo/blob/master/public/studio.h
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
        sznameindex: 'int',
        nummodels: 'int',
        base: 'int',
        modelindex: 'int',
    },
    mstudiomodel_t: {
        name: 'char[64]',
        type: 'int',
        boundingradius: 'float',

        nummeshes: 'int',
        meshindex: 'int',

        numvertices: 'int',
        vertexindex: 'int',
        tangentsindex: 'int',

        numattachments: 'int',
        attachmentindex: 'int',
        numeyeballs: 'int',
        eyeballindex: 'int',

        vertexdata: 'mstudio_modelvertexdata_t',

        unused: 'int[8]',
    },
    mstudio_modelvertexdata_t: {
        position: 'vector',
        normal: 'vector',
        tangentS: 'vector4d',
        texcoords: 'vector2d',
        BoneWeights: 'mstudioboneweight_t',
        vertex: 'mstudiovertex_t',
        HasTangentData: 'bool',
        GlobalVertexIndex: 'int',
        GlobalTangentIndex: 'int',
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
    }
};

export const LumpTypes = {
    
};
