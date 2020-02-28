import { TextFile } from './TextFile.mjs';

export default class OBJFile extends TextFile {

    /* Format

        # https://en.wikipedia.org/wiki/Wavefront_.obj_file#File_format

        # <...> = parameter
        # (...) = options parameter
    
        # Gometric vertices
        v <x> <y> <z> (<w>)
    
        # Texture coordinates
        vt <u> (<v>) (<w>)
    
        # Vertex normals
        vn <x> <y> <z>
    
        # Parameter space vertices
        vp <u> (<v>) (<w>)
    
        # Polygonal face
        f <v1>/<vt1>/<vn1> <v2>/<vt2>/<vn2> <v3>/<vt3>/<vn3>
        f <v1>//<vn1> <v2>//<vn2> <v3>//<vn3>

        # Objects
        o <object name>

        # Groups
        g <group name>

        # Referencing materials
        mtllib <.mtl file>
        usemtl <material name>

    */

    static fromGeometry(geometry = []) {
        const obj = new OBJFile();

        for(let geo of geometry) {

            obj.appendLine(`o ${geo.name}`);

            let vertecies = [];
            let uvs = [];
            let normals = [];

            for(let i = 0; i < geo.vertecies.length; i += 9) {
                const [ vx, vy, vz, vu, vv, vw, vnx, vny, vnz ] = geo.vertecies.slice(i, i + 9);

                vertecies.push([vx, vy, vz]);
                uvs.push([vu, vv, vw]);
                normals.push([vnx, vny, vnz]);
            }

            obj.append(vertecies.map(v => "v " + v.join(" ")).join("\n") + "\n");
            obj.append(uvs.map(v => "vt " + v.join(" ")).join("\n") + "\n");
            obj.append(normals.map(v => "vn " + v.join(" ")).join("\n") + "\n");
            
            obj.appendLine(`usemtl None`);
            obj.appendLine(`s off`);

            for(let i = 0; i < geo.indecies.length; i += 3) {
                const [ i1, i2, i3 ] = geo.indecies.slice(i, i + 3);
                
                obj.appendLine(`f ${i1}/${i1}/${i1} ${i2}/${i2}/${i2} ${i3}/${i3}/${i3}`);
            }

        }

        return obj;
    }

}
