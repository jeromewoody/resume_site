/** 
 * modelBuilder.js
 * Version: 1.0.0
 * Description: Class for building nodes in resume model
 * **/

xpath = require('xpath'),
dom = require('xmldom').DOMParser;

module.exports.ModelBuilder = class {
    constructor(childObj, document){
        //this.parentXpath = parentXpath;
        this.childObj = childObj;
        this.document = document;
    }

    static buid() {
        let payload = [];
        //let element = xpath.select(this.parentXpath,this.document);
        for(let i=0; i < element.length; i++) {
            let fragment = new dom().parseFromString(element[i].toString());
            payload.push(childObj);
        }

        return payload;
    }
}

