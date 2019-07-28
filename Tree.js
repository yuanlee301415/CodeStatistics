const path = require('path')
const afs = require('async-file')
const fse = require('fs-extra')

class Tree {
    constructor(product, dir, date) {
        console.log('Tree>args:', { product, dir, date })
        if (!product) return this.error('Product name validated failed!')
        date = new Date(date)
        if (!date.getTime()) return this.error('Date validated failed!')
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
        // console.log('product path exists:', exists)
        if (!exists) return this.error('Product path validated failed!')
        await this.read('', this.tree)
        await this.save()
        return this.tree
    }
    async read(dir, tree) {
        // console.log('read dir:', path.join(this.dir, dir))
        let list = await afs.readdir(path.join(this.dir, dir))
        list = list.filter(name => ['assets', 'icons'].indexOf(name) === -1) // 过滤静态资源（图片/字体文件/图标）
        // console.log('dir list:', list)
        for (let name of list) {
            const _path = path.join(this.dir, dir, name)
            const stat = await afs.stat(_path)
            if (stat.isDirectory()) {
                console.log('+:', _path)
                this.info.folderCount++
                const child = { name, type: 'dir', children: [] }
                tree.push(child)
                await this.read(path.join(dir, name), child.children)
                // console.log(child.children)
            } else {
                console.log('-:', _path)
                this.info.fileCount++
                const lineCount = await this.lineCount(dir, name)
                tree.push({ name, type: 'file', lineCount })
                this.info.lineCount += lineCount
            }
        }
    }
    async lineCount(dir, name) {
        const data = await afs.readFile(path.join(this.dir, dir, name), 'utf8')
        return data.split(/[\n|\r]/).length
    }
    async save() {
        const savePath = `./tmp/${this.product}/${this.dateStr}.json`
        // console.log('savePath:', savePath)
        await fse.ensureFile(savePath) // 如果文件不存在，则自动创建
        await afs.writeFile(savePath, JSON.stringify({ info: this.info, tree: this.tree}, null ,2))
        console.log(`\n[${this.product}]'s statistics data is stored in "${savePath}" at ${new Date().toLocaleString()}`)
    }
    error(msg) {
        console.error(`\n\nERROR:::\n${msg}`)
        return []
    }
}

module.exports = Tree
