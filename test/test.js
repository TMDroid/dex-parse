var assert = require('chai').assert
var dexparse = require('./../to-json')
var jsonparse = require('./../to-dex')

describe('dexparse', function () {
    xit('should parse a file', function (done) {
        dexparse.readFile(__dirname + '/test2.dex', function (err, data) {
            assert.isUndefined(err)
            assert.isDefined(data)
            done()
        })
    })

    xit('should return error on file not found', function (done) {
        dexparse.readFile('does not exist.dex', function (err, data) {
            assert.isDefined(err)
            done()
        })
    })

    xit('should parse a string', function (done) {
        var text = 'test data'
        dexparse.readText(text, function (err, data) {
            assert.isUndefined(err)
            assert.isDefined(data)
            done()
        })
    })

    xit('should return an error on empty string', function (done) {
        var text = ''
        dexparse.readText(text, function (err, data) {
            assert.isDefined(err)
            done()
        })
    })

    xit('creates a new item for every PA1 line', function (done) {
        var text = 'PA1*010*50*****\n' +
            'PA1*011*50*****'
        dexparse.readText(text, function (err, data) {
            assert.equal(2, data.products.length)
            done()
        })
    })

    xit('reads item ID and price from PA1', function (done) {
        var text = 'PA1*010*50*'
        dexparse.readText(text, function (err, data) {
            assert.equal('010', data.products[0].name)
            assert.equal(.5, data.products[0].price)
            done()
        })
    })

    xit('reads item total sales from PA2', function (done) {
        var text = 'PA2*99*354'
        dexparse.readText(text, function (err, data) {
            assert.equal(99, data.products[0].sold)
            assert.equal(3.54, data.products[0].revenue)
            done()
        })
    })

    xit('reads test vend data from PA3', function (done) {
        var text = 'PA3*1*100'
        dexparse.readText(text, function (err, data) {
            assert.equal(1, data.products[0].testVendCount)
            done()
        })
    })

    xit('reads sold out data from PS5', function (done) {
        var text = 'PA5*20010101*120000'
        dexparse.readText(text, function (err, data) {
            assert.equal(20010101, data.products[0].soldOutDate)
            assert.equal(120000, data.products[0].soldOutTime)
            done()
        })
    })

    xit('reads machine data from ID1', function (done) {
        var text = 'ID1*WTN11082110074*GVC1        *8207***'

        dexparse.readText(text, function (err, data) {
            assert.equal('WTN11082110074', data.machine.serialNumber)
            assert.equal('GVC1', data.machine.modelNumber)
            done()
        })
    })

    xit('reads control board data from CB1', function (done) {
        var text = 'CB1*11082110074*GVC1        *8207'

        dexparse.readText(text, function (err, data) {
            assert.equal('11082110074', data.machine.controlBoard.serialNumber)
            assert.equal('GVC1', data.machine.controlBoard.modelNumber)
            assert.equal('8207', data.machine.controlBoard.softwareRevision)
            done()
        })
    })

    xit('should convert an object from json to dex and back', function (done) {
        let object = require('./object.json')

        jsonparse.convert(object, function (err, dexdata) {
            if (err) return done(err)

            dexparse.readText(dexdata, function (err, data) {
                if (err) return done(err)

                console.log(object)
                console.log(data)
                done()
            })
        })
    })

    it('should convert a dex file to object and back', function(done) {
        let fs = require('fs'),
            path = require('path'),
            filePath = path.join(__dirname, 'dex3.dex')

        fs.readFile(filePath, {encoding: 'utf-8'}, (err, text) => {
            if(err) return done(err)

            dexparse.readText(text, (err, object) => {
                jsonparse.convert(object, (err, dexData) => {
                    let apiAdapter = require('./../../apiAdapter')

                    let object = require('./dex.json')
                    object.DexData = dexData

                    apiAdapter.sendDex(object)
                        .then(response => {
                            console.log(response)
                            done()
                        })
                })
            })
        })
    })

    xit('should send a dex file to aws', done => {
        let object = require('./dex.json')
        let apiAdapter = require('./../../apiAdapter')

        apiAdapter.sendDex(object)
            .then(response => {
                console.log(response)
                done()
            })
    })

})