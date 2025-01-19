const pool = require('../configs/connectDB');
const diacritics = require('diacritics');

recruitmentsPerPage = 20;

class RecruitmentModel {
    static async getRecruitments(keyword, page) {
        keyword = diacritics.remove(keyword);
        const offset = recruitmentsPerPage * (page - 1);

        const queryString = `
            SELECT 
                *
            FROM 
                recruitments
            WHERE
                (LOWER(position) LIKE LOWER(?)
                OR LOWER(department) LIKE LOWER(?))
            ORDER BY
                id DESC
            LIMIT
                ${ recruitmentsPerPage }
            OFFSET
                ${ offset }
            
        `;

        const [rows] = await pool.execute(queryString, [`%${keyword}%`, `%${keyword}%`]);
        return rows;
    }

    static async getRecruitmentById(id) {
        const queryString = `
            SELECT 
                r.*,
                a.fullname as admin_name,
                ua.fullname as updated_by_name 
            FROM 
                recruitments r
            JOIN
                users a ON r.created_by = a.id
            LEFT JOIN 
                users ua ON r.updated_by = ua.id
            WHERE 
                r.id = ?
        `;

        const [rows] = await pool.execute(queryString, [id]);
        return rows[0];
    }

    static async createRecruitment(data, user_id) {
        const queryString = `
            INSERT INTO recruitments (
                position, department, location, quantity, salary_range, 
                experience_required, application_deadline, detail, 
                created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
        `;
        
        const [result] = await pool.execute(queryString, [
            data.position, data.department, data.location, data.quantity, data.salary_range, 
            data.experience_required, data.application_deadline, data.detail, 
            user_id
        ]);

        return result.insertId;
    }

    static async updateRecruitment(data, user_id) {
        const queryString = `
            UPDATE recruitments 
            SET position = ?, department = ?, location = ?, quantity = ?, salary_range = ?, 
                experience_required = ?, application_deadline = ?, detail = ?,
                updated_by = ?, updated_at = CURRENT_TIMESTAMP()
            WHERE id = ?
        `;

        await pool.execute(queryString, [
            data.position, data.department, data.location, data.quantity, data.salary_range, 
            data.experience_required, data.application_deadline, data.detail,
            user_id, data.id
        ]);

        return;
    }

    static async deleteRecruitment(id) {
        const queryString = `
            DELETE FROM recruitments 
            WHERE id = ?
        `;

        await pool.execute(queryString, [id]);
        return;
    }
}

module.exports = RecruitmentModel;
