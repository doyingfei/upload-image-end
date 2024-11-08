const fs = require('fs');
const {insertTable, queryTable, querySingle, deleteTable} = require('./db')
const uploadImage = (req, res) => {
    const {originalname, size, filename} = req.file;
    insertTable(originalname, size, req.body.managerNo, req.body.date, filename).then(() => {
        res.status(200).json({message: '上传成功', code: 200})
    }).catch(() => {
        try {
            fs.unlinkSync(__dirname + '/uploads/' + filename);
            console.log('文件已成功删除');
        } catch (err) {
            console.error('删除文件失败:', err.message);
        }
        res.status(500).json({message: '上传失败', code: 500});
    })
}
const getList = (req, res) => {
    const {name = '', start_date, end_date, page = 1, limit = 10} = req.query;
    queryTable(name, start_date, end_date, page, limit).then(result => {
        res.status(200).json(result);
    }).catch((err)=>{
        console.log(err)
    })
}

const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const file_path = await querySingle(id)
        await deleteTable(id);
        // 删除文件
        fs.unlink(__dirname + '/uploads/' + file_path, (err) => {});
        res.status(200).json({message: '删除成功', code: 200});
    }catch (err) {
        res.status(500).json({message: '删除失败', code: 500});
    }
}

module.exports = {
    uploadImage,
    getList,
    deleteRecord
}