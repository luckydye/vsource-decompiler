import bpy
from bpy.types import Menu, Panel
from bpy import context

class VSDCyclesPanel(bpy.types.Panel):
    bl_idname = "VSDPanelCycles"
    bl_label = "Fix Materials for Cycles"
    bl_space_type = "VIEW_3D"
    bl_region_type = "TOOLS"

    def draw(self, context):
        layout = self.layout
        box = layout.box()
        col = box.column(align=True)
        col.operator(
            "vsdfix.cylces",
            text="Fix",
            icon="ALIGN"
        )

class VSDOctanePanel(bpy.types.Panel):
    bl_idname = "VSDPanelOctane"
    bl_label = "Fix Materials for Octane"
    bl_space_type = "VIEW_3D"
    bl_region_type = "TOOLS"

    def draw(self, context):
        layout = self.layout
        box = layout.box()
        col = box.column(align=True)
        col.operator(
            "vsdfix.octane",
            text="Fix",
            icon="ALIGN"
        )


def register():
    from bpy.utils import register_class
    register_class(VSDCyclesPanel)
    register_class(VSDOctanePanel)

def unregister():
    from bpy.utils import unregister_class
    unregister_class(VSDCyclesPanel)
    unregister_class(VSDOctanePanel)

if __name__ == "__main__":
    register()