const path = require('path')
const afs = require('async-file')
const fse = require('fs-extra')

class Tree {
    constructor(product, dir, date) {
        console.log('Tree>args:', { product, dir, date })

        if (!product) return console.error('\nERROR:::Product name validated failed!')
        date = new Date(date)
        if (!date.getTime()) return console.error('\nERROR:::Date validated failed!')
        this.product = product
        this.dir = dir
        this.dateStr = [ date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-')
        // console.log('dateStr:', this.dateStr)
        this.tree = []
        this.info = {
            folderCount: 0,
            fileCount: 0,
            lineCount: 0
        }
        return this.start()
    }
    async start() {
        const exists = await fse.pathExists(this.dir)
        console.log('product path exists:', exists)
        if (!exists) return console.error('\nERROR:::Product path validated failed!')
        await this.read('', this.tree)
        await this.save()
        return this.tree
    }
    async read(dir, tree) {
        console.log('read dir:', path.join(this.dir, dir))
        const list = await afs.readdir(path.join(this.dir, dir))//.error(err => console.error(err))
        // console.log('dir list:', list)
        for (let name of list) {
            const stat = await afs.stat(path.resolve(this.dir, dir, name))
             // console.log('stat:', name, stat.isDirectory())
            if (stat.isDirectory()) {
                this.info.folderCount++
                const child = { name, type: 'dir', children: [] }
                tree.push(child)
                await this.read(path.join(dir, name), child.children)
                // console.log(child.children)
            } else {
                this.info.fileCount++
                const lineCount = await this.lineCount(dir, name)
                tree.push({ name, type: 'file', lineCount })
                this.info.lineCount += lineCount
            }
        }
    }
    async lineCount(dir, name) {
        const data = await afs.readFile(path.resolve(this.dir, dir, name), 'utf8')
        return data.split(/[\n|\r]/).length
    }
    async save() {
        const savePath = `./tmp/${this.product}/${this.dateStr}.json`
        console.log('savePath:', savePath)
        await fse.ensureFile(savePath) // 如果文件不存在，则自动创建
        await afs.writeFile(savePath, JSON.stringify({ info: this.info, tree: this.tree}, null ,2))
        console.log(`\n:::[${this.product}]'s statistics data is stored in "${savePath}" at ${new Date().toLocaleString()}`)
    }
}

module.exports = Tree
