import bpy

def setupScene():
    bpy.data.objects['Map'].scale.x = 0.1
    bpy.data.objects['Map'].scale.y = 0.1
    bpy.data.objects['Map'].scale.z = 0.1

def createMaterialGroup(material):
    group = material.node_tree.nodes.new('ShaderNodeGroup');
    group.label = "OctaneSourceMaterialMixer";
    fixNodeGroup = bpy.data.node_groups['OctaneSourceMaterial'];
    group.node_tree = fixNodeGroup;

    group.location = material.node_tree.nodes['Material Output'].location
    group.location.y -= 1000
    group.location.x -= 200
    
    principled = material.node_tree.nodes['Principled BSDF']
    spec = principled.inputs['Specular'].default_value
    roughness = principled.inputs['Roughness'].default_value
    
    group.inputs['Specular'].default_value = spec;
    group.inputs['Roughness'].default_value = roughness;

    return group;
    
def createOtImageNode(material, imgNode):
    node = material.node_tree.nodes.new('ShaderNodeOctImageTex')
    node.location = imgNode.location
    node.location.y -= 1000
    node.image = imgNode.image
    return node

    
def createMatOutput(material):
    
    material.node_tree.nodes['Material Output'].target = "EEVEE";
    
    otOutput = material.node_tree.nodes.new('ShaderNodeOutputMaterial')
    otOutput.location = material.node_tree.nodes['Material Output'].location
    otOutput.location.y -= 1000
    
    return otOutput

def convertMaterial(material):
    group = createMaterialGroup(material);
    output = createMatOutput(material);

    material.node_tree.links.new(output.inputs[0], group.outputs[0])
    
    displacement = False
    for node in material.node_tree.nodes:
        if node.label == "OCCLUSION":
            displacement = True
    
    for node in material.node_tree.nodes:
        
        if node.label == "BASE COLOR":
            color1 = createOtImageNode(material, node)
            material.node_tree.links.new(group.inputs[0], color1.outputs[0])
            if not displacement:
                material.node_tree.links.new(group.inputs[1], color1.outputs[0])

        if node.label == "NORMALMAP":
            normal = createOtImageNode(material, node)
            material.node_tree.links.new(group.inputs[2], normal.outputs[0])

        if node.label == "OCCLUSION":
            color2 = createOtImageNode(material, node)
            material.node_tree.links.new(group.inputs[1], color2.outputs[0])


# selection_names = bpy.context.selected_objects
# object = selection_names[0]
# mat = object.material_slots[0].material

# convertMaterial(mat)

class VSDFixOctane(bpy.types.Operator):
    bl_idname = "vsdfix.octane"
    bl_label = "Fix Materials for Octane"
    bl_description = "Fix Source Materials from VSource Decompiler"
    bl_options = {"REGISTER"}

    def execute(self, context):
        setupScene()
        for mat in bpy.data.materials:
            print(mat.name)
            convertMaterial(mat)

        return {"FINISHED"}


def register():
    from bpy.utils import register_class
    register_class(VSDFixOctane)

def unregister():
    from bpy.utils import unregister_class
    unregister_class(VSDFixOctane)

if __name__ == "__main__":
    register()