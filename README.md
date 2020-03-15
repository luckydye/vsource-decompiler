A BSP library to read Source .bsp map files and convert into .gltf or .obj.

Spec: https://developer.valvesoftware.com/wiki/

### Todo

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

Buggy todo list:

Props:

_autocombine_wires_377.mdl (textures)
_autocombine_wires_391.mdl (textures)
nuke_skydome_003.mdl
_autocombine_metal_pipe_603.mdl_0 (nuke, orientation)
window_001_768.mdl (textures)
_autocombine_wires_143.mdl (textures)
_autocombine_dust_detruis_sacks_02_color_353.mdl_0 (missing textures?)
models/props/gg_vietnam/cloth02.mdl (Vertex doesnt exist)
models/props/cs_office/phone_p2.mdl (Unknown material. 'sprite')
models/newcache/nc_bigtdoor/nc_bigtdoor.mdl (Resource File not found: newde_cache/ctsigns.vtf)
models/newcache/nc_spawnfloor/nc_spawnfloor.mdl (Resource File not found: newde_cache/ctfloor.vtf)
models/newcache/nc_flatcar/nc_flatcar.mdl (RangeError: Offset is outside the bounds of the DataView)
de_cache some skybox prop_static stuff