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
    flags: 'char',
}

const StripGroupHeader_t = {
    numVerts: 'int',
    vertOffset: 'int',
    numIndices: 'int',
    indexOffset: 'int',
    numStrips: 'int',
    stripOffset: 'int',
    flags: 'unsigned char',
    skip: 'byte[8]',
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
        vtx.indecies = [];
        vtx.vertexIndecies = [];

        let meshVertexOffset = 0;

        for(let part of vtx.bodyparts) {
            const modelOffset = bodyPartOffset + part.modelOffset.data;
            const models = this.unserializeArray(vtx.view, modelOffset, ModelHeader_t, part.modelCount.data);

            for(let mdl of models) {
                const lodOffset = modelOffset + mdl.lodOffset.data;
                const lods = this.unserializeArray(vtx.view, lodOffset, ModelLODHeader_t, mdl.lodCount.data);

                for(let lod of lods) {
                    const meshOffset = lodOffset + lod.meshOffset.data;
                    const meshes = this.unserializeArray(vtx.view, meshOffset, MeshHeader_t, lod.numMeshes.data);

                    for(let mesh of meshes) {
                        const stripsOffset = mesh.byteOffset + mesh.stripGroupHeaderOffset.data;
                        const stripGroups = this.unserializeArray(vtx.view, stripsOffset, StripGroupHeader_t, mesh.numStripGroups.data);

                        for(let stripGroup of stripGroups) {
                            const indexOffset = stripGroup.byteOffset + stripGroup.indexOffset.data;
                            const indexCount = stripGroup.numIndices.data;

                            const vertOffset = stripGroup.byteOffset + stripGroup.vertOffset.data;
                            const vertCount = stripGroup.numVerts.data;
        
                            const indecies = this.unserializeArray(vtx.view, indexOffset, { index: 'unsigned short' }, indexCount);
                            const vertecies = this.unserializeArray(vtx.view, vertOffset, Vertex_t, vertCount);

                            // collect indecies
                            vtx.indecies.push(indecies.map(i => i.index.data + meshVertexOffset));
                            vtx.vertexIndecies.push(vertecies.map(v => v.origMeshVertID.data + meshVertexOffset));

                            meshVertexOffset += vertCount;
                        }
                    }
                }
            }
        }

        vtx.indecies = vtx.indecies.flat();
        vtx.vertexIndecies = vtx.vertexIndecies.flat();

        return vtx;
    }

}
