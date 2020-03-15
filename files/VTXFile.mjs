import { BinaryFile } from './BinaryFile.mjs';
import { VTX } from './VTXStructure.mjs';

export default class VTXFile extends BinaryFile {

    static fromDataArray(dataArray) {
        const vtx = this.createFile(dataArray);

        vtx.header = this.unserialize(vtx.view, 0, VTX.FileHeader_t).data;

        const bodyPartOffset = vtx.header.bodyPartOffset.data;
        const bodyPartCount = vtx.header.bodyPartCount.data;

        const parts = this.unserializeArray(vtx.view, bodyPartOffset, VTX.BodyPartHeader_t, bodyPartCount);

        vtx.bodyparts = parts;
        vtx.meshes = [];

        let meshVertexOffset = 0;

        for(let part of vtx.bodyparts) {
            const modelOffset = part.byteOffset + part.modelOffset.data;
            const models = this.unserializeArray(vtx.view, modelOffset, VTX.ModelHeader_t, part.modelCount.data);

            for(let mdl of models) {
                const lodOffset = mdl.byteOffset + mdl.lodOffset.data;
                const lods = this.unserializeArray(vtx.view, lodOffset, VTX.ModelLODHeader_t, mdl.lodCount.data);

                for(let lod of lods) {
                    const meshOffset = lod.byteOffset + lod.meshOffset.data;
                    const meshes = this.unserializeArray(vtx.view, meshOffset, VTX.MeshHeader_t, lod.numMeshes.data);

                    for(let mesh of meshes) {
                        const stripsOffset = mesh.byteOffset + mesh.stripGroupHeaderOffset.data;
                        const stripGroups = this.unserializeArray(vtx.view, stripsOffset, VTX.StripGroupHeader_t, mesh.numStripGroups.data);

                        let meshVertexCount = 0;

                        for(let stripGroup of stripGroups) {
                            
                            const indexOffset = stripGroup.byteOffset + stripGroup.indexOffset.valueOf();
                            const vertOffset = stripGroup.byteOffset + stripGroup.vertOffset.valueOf();

                            const indexCount = stripGroup.numIndices.valueOf();
                            const vertexCount = stripGroup.numVerts.valueOf();

                            const indices = this.unserializeArray(vtx.view, indexOffset, { index: 'unsigned short' }, indexCount);
                            const vertecies = this.unserializeArray(vtx.view, vertOffset, VTX.Vertex_t, vertexCount);

                            // collect indices
                            vtx.meshes.push({
                                indexCount: indexCount,
                                vertexCount: vertexCount,
                                indices: indices.map(i => i.index.valueOf()),
                                vertexindices: vertecies.map(v => v.origMeshVertID.valueOf() + meshVertexOffset),
                            });

                            meshVertexCount += vertexCount;
                        }

                        meshVertexOffset += meshVertexCount;
                    }

                    // only read the first lod of every prop
                    break;
                }
            }
        }

        return vtx;
    }

}
