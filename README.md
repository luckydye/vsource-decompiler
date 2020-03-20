A BSP library to read Source .bsp map files and convert into .gltf or .obj.

## Todo

- glTF file writer  	                        ✓
- read prop textures                            ✓
- fix wrong prop orientation on some props      ✓
- displacements                                 ✓
- 3d skybox placement                           ✓
- fix prop positioning (eg. de_nuke)            ✓
- normal maps                                   ✓
- bump maps                                     ✓
- texture blends                                (✓)
- texture transforms
- decals / sprites

## Buggy todo list:

- _autocombine_metal_pipe_603.mdl_0 (nuke, orientation)
- claypot03.mdl.001 (Index/Vertex Error)

## Other Ideas

Decompile Apex Legends VPKs?

## Known Issues:

1. Sometimes the color of the textures becoms black because of the alpha layer in the image.
    - Use a MixRGB node and multiply the image with the alpha layer as the factor.

2. Some Props may not decompile properly

3. Blend Textures
    - If a material has a blend texture, the second texture is included as a "OCCLUSION" Texture and has to be menually mixed with the base texture. Use the Alpha of the Vertex Color to blend the textures through the Mix Vertex Color Node.
