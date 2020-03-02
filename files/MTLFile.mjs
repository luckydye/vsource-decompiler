import { TextFile } from './TextFile.mjs';

export default class MTLFile extends TextFile {

    /* Format

        # https://en.wikipedia.org/wiki/Wavefront_.obj_file

        # <...> = parameter
        # (...) = options parameter
    
        # create new material
        newmtl <material_name>

        # Ambient color
        Ka 1.000 1.000 1.000

        # Diffuse color
        Kd 1.000 1.000 1.000

        # Specular
        Ks 0.000 0.000 0.000        # black (off)
        Ns 10.000                   # ranges between 0 and 1000

        # Transparency
        Tr 0.1

        # Ilum Models
        illum <num>

        0. Color on and Ambient off
        1. Color on and Ambient on
        2. Highlight on
        3. Reflection on and Ray trace on
        4. Transparency: Glass on, Reflection: Ray trace on
        5. Reflection: Fresnel on and Ray trace on
        6. Transparency: Refraction on, Reflection: Fresnel off and Ray trace on
        7. Transparency: Refraction on, Reflection: Fresnel on and Ray trace on
        8. Reflection on and Ray trace off
        9. Transparency: Glass on, Reflection: Ray trace off
        10. Casts shadows onto invisible surfaces

        # Texture maps
        map_Ka <texture_file>
        map_Kd <texture_file>
        map_Ks <texture_file>
        map_Ns <texture_file>
        map_Tr <texture_file>
        map_bump <texture_file>

        # Texture options
        -o u [v [w]]        # Origin offset
        -s u [v [w]]        # Scale
        -texres resolution  # texture resolution to create
        -clamp on | off
        -bm mult_value      # bump multiplier

    */

    constructor(name) {
        super();
        
        this.name = name;
    }

    fromObjFile(objFile) {
        const materials = objFile.materials;

        this.appendLine(`# Written with @uncut/file-format-lib`);
        this.appendLine(`# https://luckydye.de/`);

        for(let materialName of Object.keys(materials)) {

            const material = materials[materialName];
            const texturePath = material.name;

            this.appendLine(`\nnewmtl ${materialName}`);
            this.appendLine(`illum 1`);
            // diffuse
            this.appendLine(`Kd 1.000 1.000 1.000`);
            // specular
            this.appendLine(`Ks ${material.reflectivity.map(v => v.toFixed(3)).join(" ")}`);
            this.appendLine(`Ns 10.000`);
            // diffuse texture
            this.appendLine(`map_Kd res/textures/${texturePath}.dds`);
        }
    }

}
