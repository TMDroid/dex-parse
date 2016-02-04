"use strict";

var fs = require('fs')

class DexData {
    constructor() {
        this.items = [];
    }
        
    startItem(name) {
        this.currItem = new Item(name)
        this.items.push(this.currItem)
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

exports.DexData = DexData;

var parseID1 = function(line, context) {
    var parts = line.split("*")
    var machine = context.machine || {}
    
    if(parts.length >= 2) {
        machine.serialNumber = parts[1]
    }
    if(parts.length >= 3) {
        machine.modelNumber = parts[2]
    }
    if(parts.length >= 4) {
        machine.buildStandard = parts[3]
    }
    if(parts.length >= 7) {
        machine.assetNumber = parts[6]
    }
    
    context.machine = machine
}

var parseCB1 = function(line, context) {
    var parts = line.split("*")
    var machine = context.machine || {}
    var cb = {}
    
    if(parts.length >= 2) {
        cb.serialNumber = parts[1]
    }
    if(parts.length >= 3) {
        cb.modelNumber = parts[2]
    }
    if(parts.length >= 4) {
        cb.softwareRevision = parts[3]
    }
    
    machine.controlBoard = cb
    context.machine = machine
}

var parsePA1 = function(line, context) {
    var parts = line.split("*")
    
    if(parts.length >= 2) {
        context.startItem(parts[1])
    }
    
    if(parts.length >= 3) {
        context.currItem.price = parts[2] / 100
    }
}

var parsePA2 = function(line, context) {
    if(context.currItem) {
        var parts = line.split("*")
        
        if(parts.length >= 2) {
            context.currItem.sold = Number(parts[1])
        }
        if(parts.length >= 3) {
            context.currItem.revenue = parts[2] / 100
        }
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

