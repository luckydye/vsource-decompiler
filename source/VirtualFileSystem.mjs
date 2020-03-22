import Zip from 'jszip';

let fs, path, logFile;

const env = typeof Buffer != "undefined" ? 'node' : 'browser';

export default class VirtualFileSystem {

    static async indexFileTree(dir, filelist) {
        filelist = filelist || {};

        fs = fs || await import('fs');
        path = path || await import('path');

        if(!logFile) {
            if(fs.existsSync('filesystem.log')) {
                fs.unlinkSync('filesystem.log');
            }
            logFile = fs.createWriteStream('filesystem.log');
        }

        const files = fs.readdirSync(dir);
        
        files.forEach(async file => {
            if (fs.statSync(dir + "/" + file).isDirectory()) {
                filelist = await this.indexFileTree(dir + '/' + file, filelist);
            } else {
                const dirPath = dir.split(/\/|\\/g).slice(1);
                const fileKey = dirPath.join("/").toLocaleLowerCase() + "/" + file.toLocaleLowerCase();

                if(logFile) {
                    logFile.write(fileKey + '\n');
                }

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

    setRoot(root) {
        this.root = root;
    }

    getRoot() {
        return this.root;
    }

    async attatchPakfile(pakfileBuffer) {
        this.pakfile = await Zip.loadAsync(pakfileBuffer);

        const entries = Object.keys(this.pakfile.files);

        for(let entry of entries) {
            if(logFile) {
                logFile.write(entry + '\n');
            }

            this.fileRegistry[entry.toLocaleLowerCase()] = { 
                file: entry, 
                async arrayBuffer() {
                    return this.pakfile.files[entry].asNodeBuffer();
                }
            };
        }
    }

    getTree() {
        return {
            name: 'root',
            children: [
                {
                    name: 'x',
                    children: []
                },
                {
                    name: 'y',
                    children: []
                }
            ]
        }
    }

    getFile(resource) {
        resource = resource.replace(/\/|\\/g, "/").toLocaleLowerCase();

        return new Promise(async (resolve, reject) => {

            // look in fileregistry
            const fileSystemEntries = Object.keys(this.fileRegistry);

            for(let entry of fileSystemEntries) {
                if(entry.match(resource)) {
                    return resolve(this.fileRegistry[entry]);
                }
            }

            // index if not yet indexed
            if(!this.indexed && env === "node") {
                this.fileRegistry = Object.assign(await VirtualFileSystem.indexFileTree(this.root), this.fileRegistry);
                this.indexed = true;

                const file = await this.getFile(resource);
                if(file) {
                    resolve(file);
                }
            }

            reject(new Error('Resource File not found: ' + resource));
        })
    }

}
