const express = require('express');
const multer = require('multer');

const app = express();
// 创建中间件
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});