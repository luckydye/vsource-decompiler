A BSP library to read Source .bsp map files and convert into .gltf or .obj.

Spec: https://developer.valvesoftware.com/wiki/

## Todo

- glTF file writer  	                        ✓
- read prop textures                            ✓
- fix wrong prop orientation on some props      ✓
- displacements                                 ✓
- 3d skybox placement                           ✓
- fix prop positioning (eg. de_nuke)            ✓
- texture blends
- texture displacement
- normal maps
- bump maps

## Buggy todo list:

Props:

_autocombine_metal_pipe_603.mdl_0 (nuke, orientation)
de_cache some skybox prop_static stuff
claypot03.mdl.001 (Index/Vertex Error)

## Other Ideas

Decompile Apex Legends VPKs?

## Known Issues:

Materials and Textures

1. Sometimes the color of the textures becoms black because of the alpha layer in the image.
    - Set the Color-Space of the image in the material to "No-Color" or "Raw".

2. Some Props may not decompile properly
