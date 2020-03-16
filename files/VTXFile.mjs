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
            const modelOffset = part.byteOffset + part.modelOffset.valueOf();
            const models = this.unserializeArray(vtx.view, modelOffset, VTX.ModelHeader_t, part.modelCount.valueOf());

            for(let mdl of models) {
                const lodOffset = mdl.byteOffset + mdl.lodOffset.valueOf();
                const lods = this.unserializeArray(vtx.view, lodOffset, VTX.ModelLODHeader_t, mdl.lodCount.valueOf());

                for(let lod of lods) {
                    const meshOffset = lod.byteOffset + lod.meshOffset.valueOf();
                    const meshes = this.unserializeArray(vtx.view, meshOffset, VTX.MeshHeader_t, lod.numMeshes.valueOf());

                    for(let mesh of meshes) {

                        const stripsOffset = mesh.byteOffset + mesh.stripGroupHeaderOffset.valueOf();
                        const stripGroups = this.unserializeArray(vtx.view, stripsOffset, VTX.StripGroupHeader_t, mesh.numStripGroups.valueOf());

                        let meshVertexCount = 0;

                        // skip empty strip groups
                        if(mesh.numStripGroups.valueOf() <= 0) {
                            continue;
                        }

                        for(let stripGroup of stripGroups) {

                            const stripOffset = stripGroup.byteOffset + stripGroup.stripOffset.valueOf();
                            const stripCount = stripGroup.numStrips.valueOf();

                            const indexOffset = stripGroup.byteOffset + stripGroup.indexOffset.valueOf();
                            const vertOffset = stripGroup.byteOffset + stripGroup.vertOffset.valueOf();
                            
                            const indexCount = stripGroup.numIndices.valueOf();
                            const vertexCount = stripGroup.numVerts.valueOf();

                            const indices = this.unserializeArray(vtx.view, indexOffset, { index: 'unsigned short' }, indexCount);
                            const vertecies = this.unserializeArray(vtx.view, vertOffset, VTX.Vertex_t, vertexCount);

                            const strips = this.unserializeArray(vtx.view, stripOffset, VTX.StripHeader_t, stripCount);

                            for(let strip of strips) {
                                const stripIndexOffset = strip.byteOffset + strip.indexOffset.valueOf();
                                const stripVertexOffset = strip.byteOffset + strip.vertOffset.valueOf();

                                // TODO: use stripIndexOffset and stripVertexOffset to index into this group pools

                                const stripIndexCount = stripGroup.numIndices.valueOf();
                                const stripVertexCount = stripGroup.numVerts.valueOf();

                                // collect indices
                                vtx.meshes.push({
                                    indexCount: stripIndexCount,
                                    vertexCount: stripVertexCount,
                                    indices: indices.map(i => i.index.valueOf()),
                                    vertexindices: vertecies.map(v => v.origMeshVertID.valueOf() + meshVertexOffset),
                                });
    
                                meshVertexCount += stripVertexCount;
                            }
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
