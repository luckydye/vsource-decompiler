import VMTFile from "../files/VMTFile.mjs";
import VTFFile from "../files/VTFFile.mjs";

export default class MaterialLoader {

    constructor(fileSystem) {
        this.fileSystem = fileSystem;
    }

    async loadMaterial(materialName) {
        if(materialName == undefined) {
            throw new Error('Material name undefined.');
        }
        
        const fileSystem = this.fileSystem;

        const vmtFile = await fileSystem.getFile(`${materialName}.vmt`);
        let vmt = VMTFile.fromDataArray(await vmtFile.arrayBuffer());

        const patch = vmt.data.patch;
        
        if(patch && patch.include) {
            const vmtFile = await fileSystem.getFile(patch.include);
            vmt = VMTFile.fromDataArray(await vmtFile.arrayBuffer());
        }
        
        const vertexlit = vmt.data.vertexlitgeneric;
        const lightmapped = vmt.data.lightmappedgeneric;
        const unlit = vmt.data.unlitgeneric;
        const world = vmt.data.worldvertextransition;
        const water = vmt.data.water;
        const refract = vmt.data.refract;
        const lightmapped_4wayblend = vmt.data.lightmapped_4wayblend;
        const unlittwotexture = vmt.data.unlittwotexture;
        const splinerope = vmt.data.splinerope;
        const modulate = vmt.data.modulate;
        const decalmodulate = vmt.data.decalmodulate;
        const sprite = vmt.data.sprite;

        const shader =  vertexlit || 
                        lightmapped || 
                        unlit || 
                        world || 
                        water ||
                        refract || 
                        lightmapped_4wayblend || 
                        unlittwotexture || 
                        splinerope || 
                        modulate || 
                        decalmodulate || 
                        sprite

        if(!shader) {
            console.error(new Error('Unknown material.'));

            return {
                name: materialName,
                translucent: 0,
                texture: null,
                texture2: null,
                bumpmap: null,
                material: vmt,
            }
        }

        const texture = shader['$basetexture'];
        const texture2 = shader['$basetexture2'];
        const surface = shader['$surfaceprop'];
        const bumpmap = shader['$bumpmap'];

        let textureVtf = null;
        let texture2Vtf = null;
        let bumpmapVtf = null;

        if(texture) {
            const vtfFile = await fileSystem.getFile(texture.replace('.vtf', '') + '.vtf');
            textureVtf = VTFFile.fromDataArray(await vtfFile.arrayBuffer());
            textureVtf.name = texture;
        }

        if(texture2) {
            const vtfFile = await fileSystem.getFile(texture2.replace('.vtf', '') + '.vtf');
            texture2Vtf = VTFFile.fromDataArray(await vtfFile.arrayBuffer());
            texture2Vtf.name = texture2;
        }

        if(bumpmap) {
            const vtfFile = await fileSystem.getFile(bumpmap.replace('.vtf', '') + '.vtf');
            bumpmapVtf = VTFFile.fromDataArray(await vtfFile.arrayBuffer());
            bumpmapVtf.name = bumpmap;
        }

        return {
            name: materialName,
            translucent: shader['$translucent'] || shader['$alphatest'],
            texture: textureVtf,
            texture2: texture2Vtf,
            bumpmap: bumpmapVtf,
            material: vmt,
        }
    }

}
