bl_info = {
    "name": "VSource Decompiler Helper",
    "description": "Fix Materials from VSource Decompiler",
    "author": "Tim Havlicek",
    "version": (0, 0, 1),
    "blender": (2, 91, 2),
    "location": "",
    "warning": "This addon is still in development.",
    "wiki_url": "",
    "category": "Development" 
}

import bpy
from . import convert_to_octane
from . import fix_source_materials
from . import vsd_ui

def register():
    convert_to_octane.register()
    fix_source_materials.register()
    # vsd_ui.register()

def unregister():
    convert_to_octane.unregister()
    fix_source_materials.unregister()
    # vsd_ui.register()

if __name__ == "__main__":
    register()
    