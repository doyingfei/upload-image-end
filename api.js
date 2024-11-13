const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const {insertTable, checkName, queryTable, querySingle, queryMulti, deleteTable, deleteMultiple, editTable} = require('./db')
const e = require("express");
const deleteImg = (filename) => {
    try {
        fs.unlinkSync(__dirname + '/uploads/' + filename);
    }catch (e) {
        console.log('删除图片' + filename + '失败')
    }
}
const uploadImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ code: 400, message: '文件上传失败' });
    }
    const {originalname, size, filename} = req.file;
    const originalNameUtf = Buffer.from(originalname, 'latin1').toString('utf8');
    const fileNameWithoutExt = path.basename(originalNameUtf, path.extname(originalname));
    try {
        await checkName(fileNameWithoutExt)
    }catch (e) {
        deleteImg(filename)
        return res.status(500).json({message: '文件已存在', code: 500})
    }
    insertTable(fileNameWithoutExt, size, req.body.managerNo, req.body.date, filename).then(() => {
        res.status(200).json({message: '上传成功', code: 200})
    }).catch(() => {
        deleteImg(filename)
        res.status(500).json({message: originalNameUtf + '上传失败', code: 500});
    })
}
const getList = async (req, res) => {
    const {name = '', start_date, end_date, page = 1, limit = 10} = req.query;
    const totalRows = await queryTable(name, start_date, end_date, 0, 0)
    const result = await queryTable(name, start_date, end_date, page, limit)
    res.status(200).json({
        message: '查询成功',
        data: result,
        total: totalRows.length
    });
}

const deleteRecord = async (req, res) => {
    const ids = req.params.id ? req.params.id.split(',') : [];
    if(!ids.length) {
        return res.status(500).json({message:'没有数据',code: 500})
    }
    try {
        const rows = await queryMulti(ids)
        for (const row of rows) {
            deleteImg(row.file_path)
        }
        await deleteTable(ids);
        res.status(200).json({message: '删除成功', code: 200});
    } catch (err) {
        res.status(500).json({message: '删除失败', code: 500});
    }
}

const viewPicture = async (req, res) => {
    const {id} = req.params;
    try {
        const file_path = await querySingle(id)
        res.sendFile(__dirname + '/uploads/' + file_path, (err) => {
            if (err) {
                console.error('图片读取失败:', err);
                res.status(404).json({error: '图片未找到', code: 404});
            }
        });
    } catch (err) {
        res.status(404).json({error: '图片未找到', code: 404});
    }
}

const editPicture = async (req, res) => {
    const {id, newName, modifier} = req.body;
    try {
        await editTable(id, newName, modifier);
        res.status(200).json({message: '修改成功', code: 200});
    } catch (err) {
        res.status(500).json({message: '修改失败', code: 500});
    }
}

const packagePicture = (rows, res) => {
    // 创建 ZIP 文件
    const zipFileName = 'images.zip';
    const zipArchive = archiver('zip', {
        zlib: {level: 9}, // 设置压缩级别
    });
    // 设置响应头，告知浏览器这是一个下载文件
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
    // 将 ZIP 文件流传送给前端
    zipArchive.pipe(res);
    // 将每个图片文件添加到 ZIP 文件
    rows.forEach((row) => {
        const filePath = row.file_path;
        const fileName = path.basename(filePath);
        // 检查文件是否存在
        if (fs.existsSync(__dirname + '/uploads/' + filePath)) {
            zipArchive.file(__dirname + '/uploads/' + filePath, {name: fileName});
        }
    });

    // 结束打包并发送给前端
    zipArchive.finalize()
}

const downloadPicture = (req, res) => {
    const ids = req.query.ids ? req.query.ids.split(',') : [];
    if (ids.length === 0) {
        return res.status(400).send('没有可下载的');
    }
    queryMulti(ids).then(rows => {
        packagePicture(rows, res)
    }).catch(() => {
        res.status(500).json({
            message: '下载失败', code: 500
        })
    })
}

const downloadAll = async (req, res) => {
    const {name = '', start_date, end_date} = req.query;
    const totalRows = await queryTable(name, start_date, end_date, 0, 0)
    if (totalRows.length === 0) {
        return res.status(400).send('没有可下载的');
    }
    packagePicture(totalRows, res)
}

module.exports = {
    uploadImage,
    getList,
    deleteRecord,
    viewPicture,
    editPicture,
    downloadPicture,
    downloadAll
}