![Image of Dust2](/dust_2_hologram.png)

## Features

- Convert single prop to .gltf
- Convert .bsp with all props to .gltf
- Extract Pak file from .bsp
- Extract all files from .vpk archives (slow)

## Ideas to come:
- extract a defined region of the map
- extract animations for models
- render section of demo file to animations etc.
- convert dds textures to jpegs internally
- decompile decals and wall sprays
- fix bugs. make faster. lol

## Todos

- glTF file writer  	                        ✓
- read prop textures                            ✓
- displacements                                 ✓
- normal maps                                   ✓
- bump maps                                     ✓
- texture blends                                (✓)

## Buggy list:

- _autocombine_metal_pipe_603.mdl_0 (nuke, orientation)
- claypot03.mdl.001 (Index/Vertex Error)
- ctm_fbi.mdl (No textures)

## Known Issues:

1. Sometimes the color of the textures becoms black because of the alpha layer in the image.

2. Some Props may not decompile properly

3. Blend Textures
    - If a material has a blend texture, the second texture is included as a "OCCLUSION" Texture and has to be menually mixed with the base texture. Use the Alpha of the Vertex Color to blend the textures through the Mix Vertex Color Node.

4. Some Props convert with a wrong orientation. This can be fixed manually in blender.

5. Normal maps may be in a DirectX format (Y-), to be usable in blender with gltf they have to be manually modified in blender to fit the OpenGL format (Y+).

## Installation

1. Install Node.JS
2. Clone or Download this repository
3. Run ```npm install```
4. Run ```npm run setup```
5. Change to your CS:GO installtion directory and run ```vsource```

## Partialy usable with my vsource-viewer (may not be up to date)
https://vsource-viewer.web.app/
