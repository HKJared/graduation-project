const pool = require('../configs/connectDB');
const diacritics = require('diacritics')
const logPerTimeGet = 50;



function formatMessageWithVietnameTime(message) {
    const now = new Date();

    // Chuyển đổi giờ sang múi giờ Việt Nam (UTC+7)
    const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));

    const formattedTime = `[${vietnamTime.getFullYear()}:${(vietnamTime.getMonth() + 1).toString().padStart(2, '0')}:${vietnamTime.getDate().toString().padStart(2, '0')} ${vietnamTime.getHours().toString().padStart(2, '0')}:${vietnamTime.getMinutes().toString().padStart(2, '0')}:${vietnamTime.getSeconds().toString().padStart(2, '0')}]`;

    // Ghép thời gian với log message

    return `${formattedTime}: ${message}`;
}

class LogModel {
    // Tạo một bản ghi log mới
    static async createLog(action, user_id) {
        const queryString = `
            INSERT INTO logs (user_id, action)
            VALUES (?, ?)
        `;

        try {
            const [result] = await pool.execute(queryString, [user_id, action]);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createLog() query:', error);
            throw error;
        }
    }

    // Lấy các bản ghi log cũ theo từ khóa và mốc thời gian
    static async getOldLogs(keyword, created_at) {
        keyword = diacritics.remove(keyword);

        const queryString = `
            SELECT 
                l.*,
                u.fullname as fullname,
                u.username as username
            FROM 
                logs l
            JOIN
                users u ON l.user_id = u.user_id
            WHERE
                (LOWER(u.fullname) LIKE LOWER(?)
                OR LOWER(u.username) LIKE LOWER(?))
                AND l.created_at < ?
            ORDER BY
                l.created_at DESC
            LIMIT ${ logPerTimeGet }
        `;

        try {
            const [rows] = await pool.execute(queryString, [`%${ keyword }%`, `%${ keyword }%`, created_at]);
            return rows;
        } catch (error) {
            console.error('Error executing getOldLogs() query:', error);
            throw error;
        }
    }

    // Lấy các bản ghi log mới theo từ khóa và mốc thời gian
    static async getNewLogs(keyword, created_at) {
        keyword = diacritics.remove(keyword);

        const queryString = `
            SELECT 
                l.*,
                u.fullname as fullname,
                u.username as username
            FROM 
                logs l
            JOIN
                users u ON l.user_id = u.user_id
            WHERE
                (LOWER(u.fullname) LIKE LOWER(?)
                OR LOWER(u.username) LIKE LOWER(?))
                AND l.created_at > ?
            ORDER BY
                l.created_at DESC
            LIMIT ${ logPerTimeGet }
        `;

        try {
            const [rows] = await pool.execute(queryString, [`%${ keyword }%`, `%${ keyword }%`, created_at]);
            return rows;
        } catch (error) {
            console.error('Error executing getNewLogs() query:', error);
            throw error;
        }
    }

    // Lấy các bản ghi log cũ của một người dùng cụ thể theo mốc thời gian
    static async getOldLogsByUserId(user_id, created_at) {
        const queryString = `
            SELECT
                id, action, is_success, detail, created_at
            FROM
                logs
            WHERE
                user_id = ?
                AND created_at < ?
            ORDER BY
                created_at DESC
            LIMIT ${ logPerTimeGet }
        `;

        try {
            const [rows] = await pool.execute(queryString, [user_id, created_at]);
            return rows;
        } catch (error) {
            console.error('Error executing getOldLogsByUserId() query:', error);
            throw error;
        }
    }

    // Lấy các bản ghi log mới của một người dùng cụ thể theo mốc thời gian
    static async getNewLogsByUserId(user_id, created_at) {
        const queryString = `
            SELECT
                id, action, is_success, detail, created_at
            FROM
                logs
            WHERE
                user_id = ?
                AND created_at > ?
            ORDER BY
                created_at DESC
            LIMIT ${ logPerTimeGet }
        `;

        try {
            const [rows] = await pool.execute(queryString, [user_id, created_at]);
            return rows;
        } catch (error) {
            console.error('Error executing getNewLogsByUserId() query:', error);
            throw error;
        }
    }

    // Cập nhật chi tiếp bản ghi log
    static async updateDetailLog(detail, log_id) {
        detail = formatMessageWithVietnameTime(detail);
        const queryString = `
            UPDATE
                logs
            SET 
                detail = CASE 
                            WHEN detail = '' THEN ?
                            ELSE CONCAT(detail, '\n', ?)
                        END
            WHERE
                id = ?
        `;
    
        try {
            const [result] = await pool.execute(queryString, [detail, detail, log_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing updateDetailLog() query:', error);
            throw error;
        }
    }    

    // Cập nhật trạng thái bản ghi log
    static async updateStatusLog(log_id) {
        const queryString = `
        UPDATE
            logs
        SET 
            status = 1
        WHERE
            id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [log_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing updateStatusLog() query:', error);
            throw error;
        }
    }
}

module.exports = LogModel;