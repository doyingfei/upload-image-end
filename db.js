const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');  // SQLite 数据库文件

// 创建数据表的 SQL 查询
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 自增主键
    name TEXT NOT NULL,                     -- 文件名称
    size INTEGER NOT NULL,                  -- 文件大小
    uploader TEXT NOT NULL,                 -- 上传人
    upload_time TEXT DEFAULT CURRENT_TIMESTAMP,  -- 上传时间，默认当前时间
    modify_time TEXT DEFAULT CURRENT_TIMESTAMP, -- 修改时间，默认当前时间
    modifier TEXT,                          -- 修改人
    file_path TEXT NOT NULL                 -- 文件地址
  );
`;

// 创建数据表函数
const createTable = () => {
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error("创建表时发生错误:", err);
        } else {
            console.log("数据表 'files' 已创建或已存在。");
        }
    });
};

const checkName = (name) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT 1 FROM files WHERE name = ?", [name], (err, row) => {
            if (row) {
                reject()
            } else {
                resolve()
            }
        });
    })
}

const insertTable = (name, size, uploader, upload_time, file_path) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO files (name, size, uploader, upload_time, modify_time, modifier, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, size, uploader, upload_time, '', '', file_path],
            function (err) {
                if (err) {
                    console.error("数据插入失败：", err.message);
                    reject()
                    return;
                }
                console.log("数据插入成功，文件ID:", this.lastID);
                resolve()
            }
        );
    })
}

const queryMulti = (ids) => {
    const query = `SELECT file_path FROM files WHERE id IN (${ids.join(',')})`;
    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err)
            }
            resolve(rows);
        });
    })
}

const querySingle = (id) => {
    return new Promise((resolve, reject) => {
        const selectSql = 'SELECT file_path FROM files WHERE id = ?';
        db.get(selectSql, id, (err, row) => {
            if (err) {
                console.error('查询文件路径失败:', err.message);
                reject()
            }
            if (!row) {
                console.log('记录未找到')
                reject()
            }
            resolve(row.file_path);
        })
    })
}


const deleteTable = (ids) => {
    // 动态生成占位符
    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM files WHERE id IN (${placeholders})`;
    return new Promise((resolve, reject) => {
        db.run(sql, ids, function (err) {
            if (err) {
                console.log(err,'err')
                reject(err)
            }
            resolve()
        });
    })
}

const editTable = (id, newName, modifier) => {
    const query = `
      UPDATE files 
      SET name = ?, modifier = ?, modify_time = CURRENT_TIMESTAMP 
      WHERE id = ?;
    `;

    db.run(query, [newName, modifier, id], function (err) {
        if (err) {
            return console.error('更新失败:', err.message);
        }
        console.log(`更新成功，${this.changes} 条记录被修改`);
    });
}

const queryTable = (name, start_date, end_date, page, limit) => {
    // 动态构建 SQL 查询和参数数组
    let sql = 'SELECT * FROM files WHERE 1=1';
    const params = [];

    // 模糊查询文件名
    if (name) {
        sql += ' AND name LIKE ?';
        params.push(`%${name}%`);
    }
    // 上传时间区间查询
    if (start_date && end_date) {
        sql += ' AND upload_time BETWEEN ? AND ?';
        params.push(start_date, end_date);
    } else if (start_date) {
        sql += ' AND upload_time >= ?';
        params.push(start_date);
    } else if (end_date) {
        sql += ' AND upload_time <= ?';
        params.push(end_date);
    }
    sql += ' ORDER BY id DESC';
    // 分页
    if (page > 0) {
        const offset = (page - 1) * limit;
        sql += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
    }
    return new Promise((resolve, reject) => {
        // 执行查询
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('查询文件失败:', err.message);
                reject()
            }

            resolve(rows)
        });
    })

}

// 导出数据库对象和创建表的函数
module.exports = {
    db,
    checkName,
    createTable,
    insertTable,
    queryTable,
    querySingle,
    queryMulti,
    deleteTable,
    editTable
};
