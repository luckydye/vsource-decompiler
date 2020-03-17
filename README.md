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
- texture transforms
- texture blends
- decals / sprites

## Buggy todo list:

Props:

_autocombine_metal_pipe_603.mdl_0 (nuke, orientation)
de_cache some skybox prop_static stuff
claypot03.mdl.001 (Index/Vertex Error)

## Other Ideas

Decompile Apex Legends VPKs?

## Known Issues:

1. Sometimes the color of the textures becoms black because of the alpha layer in the image.
    - Use a MixRGB node and multiply the image with the alpha layer as the factor.

2. Some Props may not decompile properly
