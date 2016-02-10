"use strict";

var fs = require('fs')

class DexData {
    constructor() {
        this.products = [];
    }
        
    startItem(name) {
        this.currItem = new Item(name)
        this.products.push(this.currItem)
    }
    
    complete() {
        delete this.currItem
    }
}

class Item {
    constructor(name) {
        this.name = name
     }
}

function assign(parts, fieldNumber, object, property, lambda) {
    var fieldValue = parts[fieldNumber]
    if(typeof(fieldValue) == 'string') {
        fieldValue = fieldValue.trim()
        if(lambda != undefined) {
            object[property] = lambda(fieldValue)
        } else {
            object[property] = fieldValue
        }
    }
}

exports.DexData = DexData;

var parseID1 = function(line, context) {
    var parts = line.split("*")
    context.machine = context.machine || {}
    
    assign(parts, 1, context.machine, "serialNumber")
    assign(parts, 2, context.machine, "modelNumber")
    assign(parts, 3, context.machine, "buildStandard")
    assign(parts, 6, context.machine, "assetNumber")
}

var parseCB1 = function(line, context) {
    var parts = line.split("*")
    context.machine = context.machine || {}
    context.machine.controlBoard = context.machine.controlBoard || {}
    
    assign(parts, 1, context.machine.controlBoard, "serialNumber")
    assign(parts, 2, context.machine.controlBoard, "modelNumber")
    assign(parts, 3, context.machine.controlBoard, "softwareRevision")
}

var parsePA1 = function(line, context) {
    var parts = line.split("*")
    context.startItem()
    assign(parts, 1, context.currItem, "name")
    assign(parts, 2, context.currItem, "price", (i) => i / 100)

}

var parsePA2 = function(line, context) {
    if(context.currItem) {
        var parts = line.split("*")
        assign(parts, 1, context.currItem, "sold", (i) => Number(i))
        assign(parts, 2, context.currItem, "revenue", (i) => i / 100)
    }
}

var parsePA3 = function(line, context) {
    if(context.currItem) {
        var parts = line.split("*")
    }
}

var parsePA5 = function(line, context) {
    if(context.currItem) {
        var parts = line.split("*")
        var date = ""
        var time = ""
        if(parts.length >= 2) {
            date = parts[1]
        }
        if(parts.length >= 3) {
            time = parts[2]
        }
        
        context.currItem.lastSale = date + " " + time
    }
}

var defaultHandlers = {
    "ID1" : parseID1,
    "CB1" : parseCB1,
    "PA1" : parsePA1,
    "PA2" : parsePA2,
    "PA3" : parsePA3,
    "PA5" : parsePA5
};

exports.readText = function(text, cb) {
    var handlers = defaultHandlers
    
    var lines = text.toString().split('\n')
    
    if(lines.length <= 0) {
        cb(new Error('file or text was empty'));
        return
    }
    
    var dexdata = new DexData()
    
    lines.forEach(function(line) {
        line = line.replace("\r", "")
        var prefix2 = line.substring(0, 2)
        var prefix3 = line.substring(0, 3)
        
        var handler = handlers[prefix3] || handlers[prefix2]
        
        if(handler) {
            handler(line, dexdata)   
        }
    })
    
    dexdata.complete()
    
    cb(undefined, dexdata);
};

exports.readFile = function(path, cb) {
    fs.readFile(path, (err, data) => {
        if(err) {
            cb(err);  
        };
        
        exports.readText(data, cb);
    })
};

