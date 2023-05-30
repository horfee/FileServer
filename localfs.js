'use strict';

const fs = require('fs').promises;
const fileExists = require('fs').existsSync;
const resolver = require("path").resolve;

exports = module.exports = function(){

    var service = function(params){
        this.rootFolder = (params || {}).rootFolder || "./";
    };
    
    service.prototype.getFilesForPath = async function(path) {
        const file = resolver(this.rootFolder, './' + path);

        var items;
        if ( !this.fileExists(file)) items = [".."];
        else items = ["..", ...(await fs.readdir(file))];
        
        const res = (await Promise.all(items.map( async (entry) => {
            try {
                const res = await fs.stat(resolver(file, entry));
                return { [entry]: Object.assign( res, { isDir: res.isDirectory()})};
            } catch(err) {
                return { [entry]: { isDir: true}};
            }
        }))).reduce( (prev, current) => Object.assign(prev, current), {});
        
        return res;
    }

    service.prototype.isFile = async function(path) {
        try {
            const file = resolver(this.rootFolder, './' + path);
            return (await fs.stat(file)).isFile();
        } catch(e) {}
        return false;
    }

    service.prototype.fileExists = async function(path) {
        //const file = resolver(this.rootFolder, (path.startsWith('/') ? '.' : './') + path);
        return this.exists(path) && (await this.isFile(path));
    }

    service.prototype.exists = function (path) {
        const file = resolver(this.rootFolder, './' + path);
        return fileExists(file);
    }

    service.prototype.sendFile = function(res, path) {
        const file = resolver(this.rootFolder, './' + path);
        return res.sendFile(file);
    }

    service.prototype.saveFile = async function(sourceFile, targetFile) {
        const sourceF = resolver(this.rootFolder, './' + sourceFile);
        const targetF = resolver(this.rootFolder, './' + targetFile);
        await fs.rename(sourceF, targetF);
    }

    return service;
}();
