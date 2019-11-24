import { BinaryFile } from './BinaryFile';

const FileHeader_t = {
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
}

const BodyPartHeader_t = {
    modelCount: 'int',
    modelOffset: 'int',
}

const ModelHeader_t = {
    lodCount: 'int',
    lodOffset: 'int',
}

const ModelLODHeader_t = {
    numMeshes: 'int',
    meshOffset: 'int',
    switchPoint: 'float',
}

const MeshHeader_t = {
    numStripGroups: 'int',
    stripGroupHeaderOffset: 'int',
    flags: 'unsigned char',
}

const StripGroupHeader_t = {
    numVerts: 'int',
    vertOffset: 'int',
    numIndices: 'int',
    indexOffset: 'int',
    numStrips: 'int',
    stripOffset: 'int',
    flags: 'unsigned char',
}

const StripHeader_t = {
    numIndices: 'int',
    indexOffset: 'int',
    numVerts: 'int',
    vertOffset: 'int',
    numBones: 'int',
    flags: 'unsigned char',
    numBoneStateChanges: 'int',
    boneStateChangeOffset: 'int',
}

const Vertex_t = {
    boneWeightIndex: 'char[3]',
    numBones: 'unsigned char',
    origMeshVertID: 'unsigned short',
    boneID: 'char[3]',
}

export default class VTXFile extends BinaryFile {

    static fromDataArray(dataArray) {
        const vtx = this.createFile(dataArray);

        vtx.header = this.unserialize(vtx.view, 0, FileHeader_t).data;

        const bodyPartOffset = vtx.header.bodyPartOffset.data;
        const bodyPartCount = vtx.header.bodyPartCount.data;

        const parts = this.unserializeArray(vtx.view, bodyPartOffset, BodyPartHeader_t, bodyPartCount);

        vtx.bodyparts = parts;
        vtx.stripGroups = [];

        for(let part of vtx.bodyparts) {
            const modelOffset = bodyPartOffset + part.modelOffset.data;
            const modelCount = part.modelCount.data;

            const models = this.unserializeArray(vtx.view, modelOffset, ModelHeader_t, modelCount);

            for(let mdl of models) {
                const lodOffset = modelOffset + mdl.lodOffset.data;
                const lodCount = mdl.lodCount.data;

                const lods = this.unserializeArray(vtx.view, lodOffset, ModelLODHeader_t, lodCount);

                for(let lod of lods) {
                    const meshOffset = lodOffset + lod.meshOffset.data;
                    const meshCount = mdl.lodCount.data;

                    const meshes = this.unserializeArray(vtx.view, meshOffset, MeshHeader_t, meshCount);

                    for(let mesh of meshes) {
                        const stripsOffset = meshOffset + mesh.stripGroupHeaderOffset.data;
                        const stripsCount = mesh.numStripGroups.data;
    
                        const stripGroups = this.unserializeArray(vtx.view, stripsOffset, StripGroupHeader_t, stripsCount);
    
                        vtx.stripGroups.push(...stripGroups);

                        for(let stripGroup of stripGroups) {
                            const stripOffset = stripsOffset + stripGroup.stripOffset.data;
                            const stripCount = stripGroup.numStrips.data;
        
                            const strips = this.unserializeArray(vtx.view, stripOffset, StripHeader_t, stripCount);

                            for(let strip of strips) {
                                const indexOffset = stripsOffset + stripGroup.indexOffset.data + strip.indexOffset.data;
                                const indexCount = strip.numIndices.data;

                                const vertOffset = stripsOffset + stripGroup.vertOffset.data + strip.vertOffset.data;
                                const vertCount = strip.numVerts.data;
            
                                const indecies = this.unserializeArray(vtx.view, indexOffset, { index: 'unsigned short' }, indexCount);
                                const vertecies = this.unserializeArray(vtx.view, vertOffset, Vertex_t, vertCount);
    
                                // collect indecies
                                vtx.indecies = indecies.map(i => i.index.data);
                                vtx.vertexIndecies = vertecies.map(v => v.origMeshVertID.data);
                            }
                        }
                    }
                }
            }
        }

        return vtx;
    }

}
