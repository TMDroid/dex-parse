let strformat = require('strformat')
let uniqid = require('uniqid')
let CRC16 = require('crc16')

let serialize = (arr) => {
    let str = ''

    arr.forEach(element => {
        str += element + '\n'
    })

    return str
}

let calculateCrc = (arr) => {
    for (let i = 0; i < arr.length; i++) {
        let s = arr[i]

        if (s.startsWith('ST*')) {
            let subarr = arr.slice(i, arr.length)
            let ser = serialize(subarr)
            let crc = CRC16(ser)

            return crc.toString(16)
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
    let answer = strformat(str, data)

    return answer.replace(/{(.*?)}/g, def)
}

let writeMachineData = (machine, arr) => {
    let tmp
    tmp = format('DXS*{0}*VA*{1}*1', [uniqid().toUpperCase(), machine.version])
    arr.push(tmp)
    arr.push('ST*001*0001') //transaction set header, transaction set control number

    tmp = format('ID1*{serialNumber}*{modelNumber}*{buildStandard}*{location}*{assetNumber}*', machine)
    arr.push(tmp)
    arr.push('ID4*2*001*5') //currency decimal, numeric code, alphabetic code

    tmp = format('CB1*{serialNumber}*{modelNumber}*{softwareVersion}', machine.controlBoard)
    arr.push(tmp)
    addAditionalHeaders(arr)
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
        product.data.price = product.data.price * 100

        /**
         * PA1
         * PA1*010*50*****
         *
         * name = product name
         * price = product price (no decimals => $1.50 = 150)
         * id = product identification
         * selection = SELECTION STATUS (0 or blank (recommended) = Selection Present)
         * level = current product level
         * minimum = minimum product level
         */
        arr.push(format('PA1*{name}*{price}*{id}****{selection}*{level}*{minimum}*', product.data))

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
        arr.push(format('PA2*{npi}*{vpi}*{npr}*{vpr}*{ndi}*{vdi}*{ndr}*{vdr}*{nsi}*{vsi}*{nsr}*{vsr}', product.history, 0)) //product history

        /**
         * PA3
         * PA3*2*150*2*150
         *
         * nti = number of test vends since init
         * vti = value of test vends since init
         * ntr = number of test vends since reset
         * vtr = value of test vends since reset
         */
        arr.push(format('PA3*{nti}*{vti}*{ntr}*{vtr}', product.tests, 0))

        /**
         * PA4
         * PA4*0*0*0*0
         *
         * nfi = number of free products since initialization
         * vfi = value of free products since initialization
         * nfr = number of free products since last reset
         * vfr = value of free products since last reset
         */
        arr.push(format('PA4*{nfi}*{vfi}*{nfr}*{vfr}', product.free, 0))

        /**
         * PA5
         * PA5*20120301*125320*0
         *
         * date = sold out date = YYYYMMDD
         * time = sold out time = HHMMSS
         * sel = number of times sold out product selected
         */
        arr.push(format('PA5*{date}*{time}*{sel}', product))
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
    arr.push(format('SE*{sets}*0001', {sets: 54}))

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

exports.get = (object) => {
    let dex = []
    writeMachineData(object.machine, dex)
    writeProductsData(object.products, dex)
    writeMachineFooter(object, dex)

    return serialize(dex)
}