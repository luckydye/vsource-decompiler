import bpy
from . import c2o_ops
from . import vsd_ui

bl_info = {
    "name": "Cycles to Octane Material Converter",
    "description": "Cycles to Octane Material Converter",
    "author": "Aditia A. Pratama",
    "version": (0, 0, 1),
    "blender": (2, 9, 1),
    "location": "",
    "warning": "This addon is still in development.",
    "wiki_url": "",
    "category": "" }

def register():
    c2o_ops.register()
    vsd_ui.register()

def unregister():
    c2o_ops.unregister()
    vsd_ui.unregister()

if __name__ == "__main__":
    register()
    