import bpy
from bpy.types import Menu, Panel
from bpy import context

class vsdCyclesPanel(bpy.types.Panel):
    bl_idname = "VSDPanel"
    bl_label = "Fix Materials for Cycles"
    bl_category = "VSD"
    bl_space_type = "VIEW_3D"
    bl_region_type = "TOOLS"

    def draw(self, context):
        layout = self.layout
        box = layout.box()
        col = box.column(align=True)
        col.operator(
            "VSDFix.cylces",
            text="Convert",
            icon="ALIGN"
        )

class vsdOctanePanel(bpy.types.Panel):
    bl_idname = "VSDPanel"
    bl_label = "Fix Materials for Octane"
    bl_category = "VSD"
    bl_space_type = "VIEW_3D"
    bl_region_type = "TOOLS"

    def draw(self, context):
        layout = self.layout
        box = layout.box()
        col = box.column(align=True)
        col.operator(
            "VSDFix.octane",
            text="Convert",
            icon="ALIGN"
        )


def register():
    from bpy.utils import register_class
    register_class(vsdCyclesPanel)
    register_class(vsdOctanePanel)

def unregister():
    from bpy.utils import unregister_class
    unregister_class(vsdCyclesPanel)
    unregister_class(vsdOctanePanel)

if __name__ == "__main__":
    register()