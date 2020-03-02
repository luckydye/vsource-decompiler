import { TextFile } from './TextFile.mjs';
import glmatrix from 'gl-matrix';
import { S3Texture } from './S3Texture.mjs';

import fs from 'fs';

const { vec4, quat, mat4 } = glmatrix;

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

    constructor() {
        super();

        this.textures = [];
    }

    fromGeometry(geometry = []) {
        const obj = this;

        obj.appendLine(`# Written with @uncut/file-format-lib`);
        obj.appendLine(`# https://luckydye.de/`);

        let indexOffset = 1;

        geoloop: for(let geo of geometry) {

            obj.appendLine(`\no ${geo.name}`);

            const rotQuat = quat.create();
            const modelMatrix = mat4.create();
            const normalMatrix = mat4.create();
            
            const position = [
                geo.position[0],
                geo.position[1],
                geo.position[2],
            ];
            const rotation = [
                geo.rotation[0],
                geo.rotation[1],
                geo.rotation[2],
            ];
            const scale = geo.scale;
            const origin = geo.origin;

            quat.fromEuler(
                rotQuat, 
                rotation[0] * ( 180 / Math.PI ), 
                rotation[1] * ( 180 / Math.PI ), 
                rotation[2] * ( 180 / Math.PI )
            );
            mat4.fromRotationTranslationScaleOrigin(modelMatrix, rotQuat, position, scale, origin);
            mat4.translate(modelMatrix, modelMatrix, origin);

            mat4.fromRotationTranslationScaleOrigin(normalMatrix, rotQuat, 
                [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]);

            let vertecies = [];
            let uvs = [];
            let normals = [];

            for(let i = 0; i < geo.vertecies.length; i += 9) {

                let vertex = geo.vertecies.slice(i, i + 3);
                vertex[3] = 1;
                vertex = vec4.transformMat4(vertex, vertex, modelMatrix);

                let uv = geo.vertecies.slice(i + 3, i + 6);

                let normal = geo.vertecies.slice(i + 6, i + 9);
                normal[3] = 1;
                normal = vec4.transformMat4(normal, normal, normalMatrix);

                if(vertex[0].toString() == "NaN") {
                    console.warn('Error writing prop: ' + geo.name);
                    continue geoloop;
                }

                vertecies.push([vertex[0], vertex[1], vertex[2]]);
                uvs.push([uv[0] || 0, uv[1] || 0, uv[2] || 0]);
                normals.push([normal[0] || 0, normal[1] || 0, normal[2] || 0]);
            }

            obj.append(vertecies.map(v => `v ${v[0]} ${v[1]} ${v[2]}`)
                .join("\n") + "\n");
                
            obj.append(uvs.map(v => `vt ${v[0]} ${v[1]} ${v[2]}`)
                .join("\n") + "\n");

            obj.append(normals.map(v => `vn ${v[0]} ${v[1]} ${v[2]}`)
                .join("\n") + "\n");
            
            obj.appendLine(`usemtl ${geo.name}_mat`);
            obj.appendLine(`s off`);

            for(let i = 0; i < geo.indecies.length; i += 3) {
                const [ i1, i2, i3 ] = geo.indecies.slice(i, i + 3);
                
                obj.appendLine(`f ${indexOffset + i1}/${indexOffset + i1}/${indexOffset + i1} ${indexOffset + i2}/${indexOffset + i2}/${indexOffset + i2} ${indexOffset + i3}/${indexOffset + i3}/${indexOffset + i3}`);
            }

            indexOffset += vertecies.length;

            // textures and materials

            for(let material of geo.materials) {

                if(material.format) {

                    const format = material.format;
                    const data = material.imageData;
                    const name = material.name;

                    const texture = S3Texture.fromDataArray(data, format.type, format.width, format.height);

                    texture.toDDS();

                    const dirPath = name.split("/");
                    if(!fs.existsSync('res/textures/' + dirPath[0])) {
                        fs.mkdirSync('res/textures/' + dirPath[0]);
                    }

                    fs.writeFileSync(`res/textures/${name}.dds`, texture.view);

                    obj.textures.push(texture.decompress());
                }
            }
        }
    }

}
