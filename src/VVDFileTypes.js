const MAX_NUM_LODS = 8;
const MAX_NUM_BONES_PER_VERT = 3;

export const Structs = {
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
        m_BoneWeights: 'mstudioboneweight_t',
        m_vecPosition: 'vector',
        m_vecNormal: 'vector',
        m_vecTexCoord: 'vector2d',
    },
    mstudioboneweight_t: {
        weight: `float[${MAX_NUM_BONES_PER_VERT}]`,
        bone: `byte[${MAX_NUM_BONES_PER_VERT}]`,
        numbones: 'byte',
    },
    mstudiovertex_t: {
        m_BoneWeights: 'mstudioboneweight_t',
        m_vecPosition: 'vector',
        m_vecNormal: 'vector',
        m_vecTexCoord: 'vector2d',
    },
    mstudiotangent_t: {
        tangent: 'vector4d'
    },
}