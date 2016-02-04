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
            assert.equal(2, data.items.length)
            done()
        })
    })
    
    it('reads item ID and price from PA1', function(done) {
        var text = "PA1*010*50*"
        dexparse.readText(text, function(err, data) {
            assert.equal("010", data.items[0].name)
            assert.equal(.5, data.items[0].price)
            done()
        })
    })
    
    it('reads item total sales from PA2', function(done) {
        var text = "PA1*010*50*\n" +
                   "PA2*99*354"
        dexparse.readText(text, function(err, data) {
            assert.equal(99, data.items[0].sold)
            assert.equal(3.54, data.items[0].revenue)
            done()
        })
    })

})