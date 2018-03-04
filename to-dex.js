let strformat = require('strformat')
let uniqid = require('uniqid')
let crc = require('crc')

let serialize = (arr) => {
    let str = ''

    arr.forEach(element => {
        if (element !== '')
            str += element + '\r\n'
    })

    return str
}

let calculateCrc = (arr) => {
    for (let i = 0; i < arr.length; i++) {
        let s = arr[i]

        if (s.startsWith('ST*')) {
            let subarr = arr.slice(i, arr.length)
            let ser = serialize(subarr)
            return crc.crc16(ser).toString(16)
        }
    }
}

/**
 *
 * @param str = String to format using strformat library
 * @param data = array or object with the data to be replaced
 * @param def = default value for values not replaced
 * @returns {*}
 */
let format = (str, data, def = '') => {
    if (data === undefined || data === null || data.length === 0) return ''

    let answer = strformat(str, data)

    return answer.replace(/{(.*?)}/g, def)
}

let writeMachineData = (machine, arr) => {
    if (!machine) return

    /**
     * DXS
     * DXS*9259630009*VA*V1/1*1**
     *
     * DXS01 = id = COMMUNICATION ID OF SENDER
     * & DXS02 = FUNCTIONAL IDENTIFIER (VA)
     * DXS03 = version  = VERSION (0/6)
     * & DXS04 = TRANSMISSION CONTROL NUMBER (1)
     */
    arr.push(format('DXS*{id}*VA*{version}*1', {
        id: uniqid().toUpperCase(),
        version: machine.version
    }))

    /**
     * ST
     * ST*001*0001
     *
     * & ST01 = TRANSACTION SET HEADER (001)
     * & ST02 = TRANSACTION SET CONTROL NUMBER (0001)
     */
    arr.push('ST*001*0001') //transaction set header, transaction set control number

    /**
     * ID1
     * ID1*WTN11082110074*GVC1*8207***
     *
     * ID101 = serialNumber = MACHINE SERIAL NUMBER
     * ID102 = modelNumber  = MACHINE MODEL NUMBER
     * ID103 = buildStandard= MACHINE BUILD STANDARD
     * ID104 = location     = MACHINE LOCATION
     * & ID105 = User Defined Field
     * ID106 = assetNumber  = MACHINE ASSET NUMBER
     * & ID107 = DTS Level
     * & ID108 = DTS Revision
     */
    if (machine.details) {
        arr.push(format('ID1*{serialNumber}*{modelNumber}*{buildStandard}*{location}*{assetNumber}*', machine.details))
    }

    /**
     * ID4
     * ID4*2*001*5
     *
     * ID401 = currencyDecimalPoint   = DECIMAL POINT POSITION
     * ID402 = currencyCode           = CURRENCY NUMERIC CODE
     * ID403 = alphabeticCurrencyCode = CURRENCY ALPHABETIC CODE
     */
    if (machine.currency) {
        arr.push(format('ID4*{currencyDecimalPoint}*{currencyCode}*{alphabeticCurrencyCode}', machine.currency)) //currency decimal, numeric code, alphabetic code
    }

    /**
     * CB1
     * CB1*11082110074*GVC1*8207
     *
     * These are all optional VMC Control Board info
     */
    if (machine.controlBoard) {
        arr.push(format('CB1*{vmcBoardSerialNumber}*{vmcBoardModelNumber}*{vmcBoardBuildStandard}', machine.controlBoard))
    }

    // addAditionalHeaders(arr)
}

let writeProductsData = (products, arr) => {
    products.forEach(product => {
        /*
            PA1*010*50*****
            PA2*6*350*6*350*0*0*0*0*0*0*0*0
            PA3*2*150*2*150
            PA4*0*0*0*0
            PA5*20120301*125320*0
         */
        // product.data.price = parseInt(product.data.price * 100)

        /**
         * PA1
         * PA1*010*50*****
         *
         * PA101 = selectionNumber  = PRODUCT IDENTIFIER (Recommend: Product Identifier = Panel Selection #)
         * PA102 = price            = product price (no decimals => $1.50 = 150)
         * PA103 = id               = PRODUCT IDENTIFICATION
         * & PA104 = Maximum Product Capacity
         * & PA105 = Standard Filling Level
         * & PA106 = Standard Dispensed Quantity
         * PA107 = selection        = SELECTION STATUS (0 or blank (recommended) = Selection Present)
         * PA108 = level            = current product level
         * PA109 = minimum          = minimum product level
         */
        if (product.data) {
            arr.push(format('PA1*{selectionNumber}*{price}*{id}****{selection}*{level}*{minimum}*', product.data))
        }

        /**
         * PA2
         * PA2*6*350*6*350*0*0*0*0*0*0*0*0
         *
         * npi = number of paid products vended since last init
         * vpi = value of paid products vended since last init
         * npr = number of paid products vended since last reset
         * vpr = value of paid products vended since last reset
         *
         * ndi = number of discounts since last init
         * vdi = value of discounts since last init
         * ndr = number of discounts since last reset
         * vdr = value of discounts since last reset
         *
         * nsi = number of surcharged since last init
         * vsi = value of surcharged since last init
         * nsr = number of surcharged since last reset
         * vsr = value of surcharged since last reset
         */
        if (product.history) {
            arr.push(format('PA2*{npi}*{vpi}*{npr}*{vpr}*{ndi}*{vdi}*{ndr}*{vdr}*{nsi}*{vsi}*{nsr}*{vsr}', product.history, 0)) //product history
        }

        /**
         * PA3
         * PA3*2*150*2*150
         *
         * nti = number of test vends since init
         * vti = value of test vends since init
         * ntr = number of test vends since reset
         * vtr = value of test vends since reset
         */
        if (product.tests) {
            arr.push(format('PA3*{nti}*{vti}*{ntr}*{vtr}', product.tests, 0))
        }

        /**
         * PA4
         * PA4*0*0*0*0
         *
         * nfi = number of free products since initialization
         * vfi = value of free products since initialization
         * nfr = number of free products since last reset
         * vfr = value of free products since last reset
         */
        if (product.free) {
            arr.push(format('PA4*{nfi}*{vfi}*{nfr}*{vfr}', product.free, 0))
        }

        /**
         * PA5
         * PA5*20120301*125320*0
         *
         * soldOutDate = sold out date = YYYYMMDD
         * soldOutTime = sold out time = HHMMSS
         * soldOutCount = number of times sold out product selected
         */
        if (product.data.soldOutDate || product.data.soldOutTime || product.data.soldOutCount) {
            arr.push(format('PA5*{soldOutDate}*{soldOutTime}*{soldOutCount}', product.data))
        }
    })
}

let writeMachineFooter = (obj, arr) => {
    /**
     * G85
     * G85*E8BC
     *
     * TODO (1) Inca n-am idee cum calculez asta
     * crc = crc-16 checksum as defined in the docs
     */
    arr.push(format('G85*{crc}', {crc: calculateCrc(arr)}))

    /**
     * SE
     * SE*54*0001
     *
     * TODO (2) Inca n-am idee cum calculez asta
     * sets = Number of Included Sets
     */
    arr.push(format('SE*{sets}*0001', {sets: obj.products.length}))

    /**
     * DXE
     * DXE*1*1
     *
     */
    arr.push('DXE*1*1')

}

String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '')
}

//still have to handle these ones
let addAditionalHeaders = (arr) => {
    let x = 'VA1*15600*302*15600*302*0*0*0*0\n' +
        'VA2*1125*15*1125*15\n' +
        'VA3*900*18*900*18\n' +
        'CA1*CAI002207520165*USQ702C01EA6*0008**\n' +
        'BA1*CAI000460701743*BP4SX       *0001**\n' +
        'CA2*15600*302*15600*302\n' +
        'CA3*19610*5650*9060*49*19610*5650*9060*49*4900*4900\n' +
        'CA4*4040*1280*4040*1280\n' +
        'CA8*50*50\n' +
        'CA9*0*0\n' +
        'CA10**200\n' +
        'CA15*5200*TUBE1*49*93*161*0*0*0*0*0\n' +
        'CA15*5200*TUBE2*0*0*0*0*0*0*0*0\n' +
        'CA16*0*0\n' +
        'CA17*0*5*49*40*17\n' +
        'CA17*1*10*93*50*14\n' +
        'CA17*2*25*161*20*17\n' +
        'TA2*0*0*0*0*0*0*0*0'
    x = x.split('\n')

    x.forEach(e => {
        arr.push(e)
    })
}

let writeDataToFile = (name, dexData) => {
    let fs = require('fs')
    let logger = fs.createWriteStream(name, {
        flags: 'w'
    })

    logger.write(dexData)

    logger.end()
}

/**
 *
 * @param object = object mapped correspondingly to fit the format defined below
 * @param cb = callback
 */
exports.convert = (object, cb) => {
    let dex = []
    writeMachineData(object.machine, dex)
    writeProductsData(object.products, dex)
    writeMachineFooter(object, dex)

    let serialized = serialize(dex)

    writeDataToFile(`somefilename-${new Date().getTime()}.txt`, serialized)

    cb(undefined, serialized)
}

/*
object =  {
    machine: {
        version, //Machine version (0/6)
        currency: {
            currencyDecimalPoint,
            currencyCode,
            alphabeticCurrencyCode
        },
        controlBoard: {
            vmcBoardSerialNumber,
            vmcBoardModelNumber,
            vmcBoardBuildStandard
        },
        details : {
            serialNumber,
            modelNumber,
            buildStandard,
            location,
            assetNumber
        }
    },
    products: [
        { //Product 1
            data: {
                selectionNumber,
                price,
                id,
                selection,
                level,
                minimum,
                soldOutDate, //PA5
                soldOutTime,
                soldOutCount,
            },
            history: {
                npi, vpi, npr, vpr,
                ndi, vdi, ndr, vdr,
                nsi, vsi, nsr, vsr
            },
            tests: {
                nti, vti, ntr, vtr
            },
            free: {
                nfi, vfi, nfr, vfr
            },

        },
    ]
}*/
