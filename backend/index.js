const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());
// 创建中间件
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
    next();
});

app.use(express.json());

// 配置 multer 存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 设置文件存储目录
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        // 设置文件名 (时间戳 + 原始文件名)
        cb(null, Date.now() + '-' + originalName);
    }
});

// 创建 multer 实例
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 限制文件大小为 5MB
    }
});

// 单文件上传接口
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({message: '请选择要上传的文件'});
        }

        res.json({
            message: '文件上传成功',
            filename: req.file.filename,
            path: req.file.path
        });
    } catch (error) {
        res.status(500).json({message: '文件上传失败', error: error.message});
    }
});

// 多文件上传接口
app.post('/upload-multiple', upload.array('files', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({message: '请选择要上传的文件'});
        }

        res.json({
            message: '文件上传成功',
            files: req.files.map(file => ({
                filename: file.filename,
                path: file.path
            }))
        });
    } catch (error) {
        res.status(500).json({message: '文件上传失败', error: error.message});
    }
});

//切片上传
app.post('/chunk', upload.single('chunk'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({message: '未接收到文件切片'})
        }

        const {filename, hash} = req.body
        // 创建临时文件夹用于存储切片
        const chunkDir = path.resolve(__dirname, 'uploads/chunks', filename)

        if (!fs.existsSync(chunkDir)) {
            await fs.promises.mkdir(chunkDir, {recursive: true})
        }

        // 将切片移动到对应文件夹下
        await fs.promises.rename(
            req.file.path,
            path.resolve(chunkDir, hash)
        )

        res.json({
            message: '切片上传成功',
            hash
        })
    } catch (error) {
        res.status(500).json({message: '切片上传失败', error: error.message})
    }
})

// 合并切片
app.post('/merge', async (req, res) => {
    try {
        const {filename} = req.body
        const filePath = path.resolve(__dirname, 'uploads', filename)
        const chunkDir = path.resolve(__dirname, 'uploads/chunks', filename)
        // 读取所有切片
        const chunks = await fs.promises.readdir(chunkDir)
        // 排序切片
        chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
        // 创建写入流
        const writeStream = fs.createWriteStream(filePath)
        // 合并切片
        for (const chunk of chunks) {
            const chunkPath = path.resolve(chunkDir, chunk)
            const buffer = await fs.promises.readFile(chunkPath)
            await new Promise((resolve, reject) => {
                writeStream.write(buffer, (error) => {
                    if (error) reject(error)
                    resolve()
                })
            })
            // 删除已合并的切片
            await fs.promises.unlink(chunkPath)
        }
        // 关闭写入流
        writeStream.end()
        // 删除切片目录
        await fs.promises.rmdir(chunkDir)
        res.json({
            message: '文件合并成功',
            filename
        })
    } catch (error) {
        res.status(500).json({message: '文件合并失败', error: error.message})
    }
})
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});