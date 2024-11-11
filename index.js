const express = require('express');
const multer = require('multer');
const path = require('path');
const {db, createTable} = require('./db');  // 引入数据库连接和创建表函数
const {uploadImage, getList, deleteRecord, viewPicture, editPicture,downloadPicture, downloadAll} = require('./api')
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = 3000;

// 使用 JSON 中间件解析请求体中的 JSON 数据
app.use(express.json());

// 在启动时创建数据表
createTable();

const folderPath = path.join(__dirname, 'uploads');
// 中间件或路由处理函数中判断并创建文件夹
app.use((req, res, next) => {
    // 判断文件夹是否存在
    if (!fs.existsSync(folderPath)) {
        // 文件夹不存在，创建文件夹
        fs.mkdirSync(folderPath, {recursive: true}); // { recursive: true } 允许创建多层目录
        console.log('文件夹已创建:', folderPath);
    } else {
        console.log('文件夹已存在:', folderPath);
    }

    next(); // 调用下一个中间件或路由
});

// 配置 multer 存储选项
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname + '/uploads'); // 设置文件保存目录
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // 保留文件扩展名
    }
});
const upload = multer({storage: storage});
app.post('/upload', upload.single('file'), uploadImage)
app.get('/list', getList)
app.delete('/files/:id', deleteRecord)
app.get('/view-image/:id', viewPicture)
app.post('/edit', editPicture)
app.get('/download-all', downloadAll)
app.get('/download-images', downloadPicture)

// 启动 Express 服务器
app.listen(PORT, () => {
    console.log(`服务器正在运行，访问 http://localhost:${PORT}`);
});