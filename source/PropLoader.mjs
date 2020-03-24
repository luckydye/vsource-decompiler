import MDLFile from "../files/MDLFile.mjs";
import VTXFile from "../files/VTXFile.mjs";
import VVDFile from "../files/VVDFile.mjs";
import MaterialLoader from "./MaterialLoader.mjs";

export default class PropLoader {

    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.materialLoader = new MaterialLoader(fileSystem);
    }
    
    async loadProp(propType) {
        const fileSystem = this.fileSystem;
        
        const mdlPath = propType;
        const vddPath = propType.replace('.mdl', '.vvd');
        const vtxPath = propType.replace('.mdl', '.dx90.vtx');

        const prop = {
            materials: [],
        };

        // mdl
        const mdlFile = await fileSystem.getFile(mdlPath);
        const mdl = MDLFile.fromDataArray(await mdlFile.arrayBuffer());

        // textures and materials
        for(let tex of mdl.textures) {
            const path = mdl.texturePaths[0].replace(/\\|\//g, '/');
            let materialName = tex.name.toString().replace(path, '');

            if(materialName.split("/").length < 2) {
                materialName = path + materialName;
            }

            try {
                const mat = await this.materialLoader.loadMaterial(materialName);
                prop.materials.push(mat);
            } catch(err) {
                error(err);
            }
        }

        // geometry info
        const vtxFile = await fileSystem.getFile(vtxPath);
        const vtx = VTXFile.fromDataArray(await vtxFile.arrayBuffer());

        const vvdFile = await fileSystem.getFile(vddPath);
        const vvd = VVDFile.fromDataArray(await vvdFile.arrayBuffer());
        const geometry = vvd.convertToMesh();

        const propMeshes = [];
        let meshIndex = 0;

        for(let mesh of vtx.meshes) {
            propMeshes.push({
                material: prop.materials[meshIndex],
                indices: mesh.indices,
                vertecies: mesh.vertexindices.map(rv => {
                    const vert = geometry.vertecies[rv];
                    if(!vert) throw new Error('Vertex doesnt exist');
                    return vert;
                }),
                uvs: mesh.vertexindices.map(rv => {
                    const vert = geometry.uvs[rv];
                    if(!vert) throw new Error('UV doesnt exist');
                    return vert;
                }),
                normals: mesh.vertexindices.map(rv => {
                    const vert = geometry.normals[rv];
                    if(!vert) throw new Error('Normal doesnt exist');
                    return vert;
                }),
            });

            meshIndex++;
        }

        return propMeshes;
    }
}
