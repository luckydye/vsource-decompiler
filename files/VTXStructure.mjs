export const VTX = {
    
    FileHeader_t: {
        version: 'int',
        vertCacheSize: 'int',
        maxBonesPerStrip: 'unsigned short',
        maxBonesPerTri: 'unsigned short',
        maxBonesPerVert: 'int',
        checkSum: 'int',
        lodCount: 'int',
        materialReplacementListOffset: 'int',
        bodyPartCount: 'int',
        bodyPartOffset: 'int',
    },

    BodyPartHeader_t: {
        modelCount: 'int',
        modelOffset: 'int',
    },

    ModelHeader_t: {
        lodCount: 'int',
        lodOffset: 'int',
    },

    ModelLODHeader_t: {
        numMeshes: 'int',
        meshOffset: 'int',
        switchPoint: 'float',
    },

    MeshHeader_t: {
        numStripGroups: 'int',
        stripGroupHeaderOffset: 'int',
        flags: 'byte',
    },

    StripGroupHeader_t: {
        numVerts: 'int',
        vertOffset: 'int',
        numIndices: 'int',
        indexOffset: 'int',
        numStrips: 'int',
        stripOffset: 'int',
        flags: 'byte',
        skip: 'byte[8]',
    },

    StripHeader_t: {
        numIndices: 'int',
        indexOffset: 'int',
        numVerts: 'int',
        vertOffset: 'int',
        numBones: 'short',
        flags: 'byte',
        numBoneStateChanges: 'int',
        boneStateChangeOffset: 'int',
    },

    Vertex_t: {
        boneWeightIndex: 'char[3]',
        numBones: 'byte',
        origMeshVertID: 'unsigned short',
        boneID: 'char[3]',
    },

}
