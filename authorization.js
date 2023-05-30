'use strict';

const fs = require('fs').promises;
const fileExists = require('fs').existsSync;
const resolver = require("path").resolve;

exports = module.exports = function(){

    var service = function(params){
        this.answer = (params || {}).defaultAnswer || false;
    };

    service.prototype.isAuthorizedForFile = function (user, path) {
        return this.answer;
    }

    return service;
}()
