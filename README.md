## Features

- Convert single prop to .gltf
- Convert .bsp with all props to .gltf
- Extract Pak file from .bsp
- Extract all files from .vpk archives (slow)

## Todos

- glTF file writer  	                        ✓
- read prop textures                            ✓
- displacements                                 ✓
- normal maps                                   ✓
- bump maps                                     ✓
- texture blends                                (✓)
- texture transforms

## Buggy list:

- _autocombine_metal_pipe_603.mdl_0 (nuke, orientation)
- claypot03.mdl.001 (Index/Vertex Error)

## Known Issues:

1. Sometimes the color of the textures becoms black because of the alpha layer in the image.

2. Some Props may not decompile properly

3. Blend Textures
    - If a material has a blend texture, the second texture is included as a "OCCLUSION" Texture and has to be menually mixed with the base texture. Use the Alpha of the Vertex Color to blend the textures through the Mix Vertex Color Node.

4. Some Props convert with a wrong orientation. This can be fixed manually in blender.

## Installation

1. Install Node.JS
2. Clone or Download this repository
3. Run ```npm install```
4. Run ```npm run setup```
5. Change to your CS:GO installtion directory and run ```vsource```

## Partialy usable with my vsource-viewer
https://vsource-viewer.web.app/
