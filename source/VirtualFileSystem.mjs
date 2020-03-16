import fs from 'fs';
import Zip from 'node-zip';
import path from 'path';

if(fs.existsSync('filesystem.log')) {
    fs.unlinkSync('filesystem.log');
}
const logFile = fs.createWriteStream('filesystem.log');

export default class VirtualFileSystem {

    static indexFileTree(dir, filelist) {
        filelist = filelist || {};

        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            if (fs.statSync(dir + "/" + file).isDirectory()) {
                filelist = this.indexFileTree(dir + '/' + file, filelist);
            } else {
                const dirPath = dir.split(/\/|\\/g).slice(1);
                const fileKey = dirPath.join("/").toLocaleLowerCase() + "/" + file.toLocaleLowerCase();

                logFile.write(fileKey + '\n');

                filelist[fileKey] = { 
                    file: dir + '/' + file, 
                    async arrayBuffer() {
                        return new Promise((resolve, reject) => {
                            fs.readFile(dir + '/' + file, (err, data) => {
                                if(err) {
                                    reject(new Error('Error loading file: ' + err));
                                } else {
                                    resolve(data);
                                }
                            });
                        })
                    }
                }
            }
        });

        return filelist;
    }

    constructor(root = "csgo/") {
        this.root = root;
        this.pakfile = null;
        this.indexed = false;
        this.fileRegistry = {};
    }

    attatchPakfile(pakfileBuffer) {
        const pakfile = new Zip(pakfileBuffer);
        this.pakfile = pakfile;

        const entries = Object.keys(pakfile.files);

        for(let entry of entries) {
            logFile.write(entry + '\n');

            this.fileRegistry[entry.toLocaleLowerCase()] = { 
                file: entry, 
                async arrayBuffer() {
                    return pakfile.files[entry].asNodeBuffer();
                }
            };
        }
    }

    getFile(resource) {
        resource = resource.replace(/\/|\\/g, "/").toLocaleLowerCase();

        return new Promise(async (resolve, reject) => {

            // index if not yet indexed
            if(!this.indexed) {
                this.fileRegistry = Object.assign(VirtualFileSystem.indexFileTree(this.root), this.fileRegistry);
                this.indexed = true;
            }

            // look in fileregistry
            const fileSystemEntries = Object.keys(this.fileRegistry);

            for(let entry of fileSystemEntries) {
                if(entry.match(resource)) {
                    resolve(this.fileRegistry[entry]);
                    break;
                }
            }

            reject(new Error('Resource File not found: ' + resource));
        })
    }

}
