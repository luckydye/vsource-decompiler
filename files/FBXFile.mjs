import { BinaryFile } from "./BinaryFile.mjs";
import { FBX } from './FBXStructure.mjs';

export default class FBXFile extends BinaryFile {

    static get STRUCT() {
        return FBX;
    }

    static fromDataArray(dataArray) {
        const fbx = this.createFile(dataArray);

        const header = this.unserialize(fbx.view, 0, FBX.header);

        fbx.header = header.data;
        fbx.nodes = {};

        if(fbx.header.magic.data !== "Kaydara FBX Binary  ") {
            throw new Error('File type not recognised');
        }

        let byteOffset = header.byteOffset;

        const unserializeNode = (nodeEndOffset) => {

            const node = this.unserialize(fbx.view, byteOffset, FBX.nodeRecord);
            byteOffset = node.byteOffset;

            const nodeData = node.data;
            nodeData.children = [];

            nodeEndOffset = nodeEndOffset || nodeData.endOffset.data;

            // node scope start
            while(byteOffset < nodeEndOffset) {
                // resolve nodes in current scope
                const childNode = unserializeNode(nodeData.endOffset.data);
                
                if(childNode.endOffset.data == 0) {
                    // close scope if node is a NULL terminator
                    return nodeData;
                } else {
                    nodeData.children.push(childNode);
                }
            }

            return nodeData;
        }

        while(byteOffset < fbx.view.byteLength - 13) {
            try {
                const node = unserializeNode();

                if (node.endOffset.data < fbx.view.byteLength && 
                    node.endOffset.data != 0) {
                        
                    fbx.nodes[node.name.data] = node;
                }

            } catch(err) {
                break;
                console.warn(err);
            }
        }

        return fbx;
    }

    convertToMesh() {
        
    }

}
