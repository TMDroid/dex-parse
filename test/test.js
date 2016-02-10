var assert = require('chai').assert
var dexparse = require('..')

describe('dexparse', function() {
    it('should parse a file', function(done) {
        dexparse.readFile('./test2.dex', function(err, data) {
            assert.isUndefined(err)
            assert.isDefined(data)
            console.log(JSON.stringify(data, null, 2))
            done()
        })
    })
    
    it('should parse a string', function(done) {
        var text = "test data"
        dexparse.readText(text, function(err, data) {
            assert.isUndefined(err)
            assert.isDefined(data)
            done()
        })
    })
    
    it('creates a new item for every PA1 line', function(done) {
        var text = "PA1*010*50*****\n" +
                   "PA1*011*50*****"
        dexparse.readText(text, function(err, data) {
            assert.equal(2, data.products.length)
            done()
        })
    })
    
    it('reads item ID and price from PA1', function(done) {
        var text = "PA1*010*50*"
        dexparse.readText(text, function(err, data) {
            assert.equal("010", data.products[0].name)
            assert.equal(.5, data.products[0].price)
            done()
        })
    })
    
    it('reads item total sales from PA2', function(done) {
        var text = "PA1*010*50*\n" +
                   "PA2*99*354"
        dexparse.readText(text, function(err, data) {
            assert.equal(99, data.products[0].sold)
            assert.equal(3.54, data.products[0].revenue)
            done()
        })
    })
    
    it('reads machine data from ID1', function(done) {
        var text = "ID1*WTN11082110074*GVC1        *8207***"
        
        dexparse.readText(text, function(err, data) {
            assert.equal("WTN11082110074", data.machine.serialNumber)
            assert.equal("GVC1", data.machine.modelNumber)
            done()
        })
    })
    
    it('reads control board data from CB1', function(done) {
        var text = "CB1*11082110074*GVC1        *8207"
        
        dexparse.readText(text, function(err, data) {
            assert.equal("11082110074", data.machine.controlBoard.serialNumber)
            assert.equal("GVC1", data.machine.controlBoard.modelNumber)
            assert.equal("8207", data.machine.controlBoard.softwareRevision)
            done()
        })
    })

})