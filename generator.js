const Tree = require('./Tree')
const afs = require('async-file')
const fse = require('fs-extra')

class Generator {
    constructor(product, dir, date = new Date()) {
        date = new Date(date)
        if (!date.getTime()) return this.error('Date validated failed!')
        this.product = product
        this.dir = dir
        this.date = date
        this.data = null // 统计结果
        this.startTime = new Date()
        this.start()
    }
    async start() {
        this.data = await new Tree(this.product, this.dir, this.date)
        await this.record()
    }
    async record() {
        // console.log('data:', this.data)
        if (!this.data.length) return this.error('统计失败！！')
        await fse.ensureDir(`./tmp/${this.product}`) // 如果项目文件夹不存在，则自动创建
        const dateStr = [this.date.getFullYear(), this.date.getMonth() + 1, this.date.getDate()].join('-')
        const recordPath = `./tmp/${this.product}/record.json`
        let record = await fse.pathExists(recordPath) // 检测目录是否存在，不自动创建目录（Fix:ensureFile 自动创建的文件会生成一个空字符内容，导致当作JSON解析时报错）
        // console.log('record pathExists:', record)
        if (!record) record = []
        else record = await fse.readJson(recordPath)
        record = new Set(record)
        record.add(dateStr)
        record = Array.from(record).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) // 升序
        // console.log('record:', record)
        await afs.writeFile(recordPath, JSON.stringify(record, null, 2))
        this.finish()
    }
    finish() {
        console.log(`Done in ${Date.now() - this.startTime} ms.`)
    }
    error(msg) {
        console.error(`\n\nERROR:::\n${msg}`)
    }
}

const [, , product, dir, date] = process.argv
console.log('process.argv:', {product, dir, date})

new Generator(product, dir, date)
