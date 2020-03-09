const MAX_NUM_LODS = 8;
const MAX_NUM_BONES_PER_VERT = 3;

export const VDD = {

    vertexFileHeader_t: {
        id: 'char[4]',
        version: 'int',
        checksum: 'int',
        numLODs: 'int',
        numLODVertexes: `int[${MAX_NUM_LODS}]`,
        numFixups: 'int',
        fixupTableStart: 'int',
        vertexDataStart: 'int',
        tangentDataStart: 'int',
    },

    vertexFileFixup_t: {
        lod: 'int',			
        sourceVertexID: 'int',
        numVertexes: 'int',
    },

    mstudiovertex_t: {
        // m_BoneWeights: 'byte[16]',

        pos_x: 'float',
        pos_y: 'float',
        pos_z: 'float',

        norm_x: 'float',
        norm_y: 'float',
        norm_z: 'float',

        tex_u: 'float',
        tex_v: 'float',
    },

    mstudioboneweight_t: {
        weight: `float[${MAX_NUM_BONES_PER_VERT}]`,
        bone: `byte[${MAX_NUM_BONES_PER_VERT}]`,
        numbones: 'byte',
    },
    
    mstudiotangent_t: {
        tangent: 'vector4d'
    },
}
