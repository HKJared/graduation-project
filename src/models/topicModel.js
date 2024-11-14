const pool = require('../configs/connectDB');

class TopicModel {
    // Tạo một topic mới
    static async createTopic(topic) {
        const keys = Object.keys(topic); // Lấy tất cả các khóa từ đối tượng topic
        const values = Object.values(topic); // Lấy tất cả các giá trị từ đối tượng topic

        // Tạo chuỗi truy vấn SQL
        const queryString = `
            INSERT INTO system_exercise_topics (${keys.join(', ')})
            VALUES (${keys.map(() => '?').join(', ')})
        `;

        try {
            const [result] = await pool.execute(queryString, values);
            return result.insertId; // Trả về ID của topic vừa được tạo
        } catch (error) {
            console.error('Error executing createTopic() query:', error);
            throw error;
        }
    }

    // Lấy danh sách topic
    static async getTopics() {
        const queryString = `
            SELECT
                t.*,
                u_created.username AS created_by_username,
                u_updated.username AS updated_by_username,
                (SELECT GROUP_CONCAT(condition_topic_id) FROM topic_unlock_conditions WHERE topic_id = t.id) AS unlock_conditions,
                (SELECT COUNT(*) FROM exercises e WHERE e.topic_id = t.id) AS total_exercises
            FROM
                system_exercise_topics t
            LEFT JOIN
                users u_created ON t.created_by = u_created.id
            LEFT JOIN
                users u_updated ON t.updated_by = u_updated.id
            ORDER BY
                t.level
        `;
    
        try {
            const [rows] = await pool.execute(queryString);
            // Chuyển đổi unlock_conditions thành mảng cho mỗi topic
            return rows.map(row => {
                row.unlock_conditions = row.unlock_conditions ? row.unlock_conditions.split(',').map(Number) : [];
                return row;
            });
        } catch (error) {
            console.error('Error executing getTopics() query:', error);
            throw error;
        }
    }    

    // Lấy danh sách topic đã khóa chỉnh sửa
    static async getNonEditableTopics() {
        const queryString = `
            SELECT
                t.*,
                u_created.username AS created_by_username,
                u_updated.username AS updated_by_username,
                (SELECT GROUP_CONCAT(condition_topic_id) FROM topic_unlock_conditions WHERE topic_id = t.id) AS unlock_conditions
            FROM
                system_exercise_topics t
            LEFT JOIN users u_created ON t.created_by = u_created.id
            LEFT JOIN users u_updated ON t.updated_by = u_updated.id
            WHERE
                is_editable = 0
        `;

        try {
            const [rows] = await pool.execute(queryString);
            // Chuyển đổi unlock_conditions thành mảng cho mỗi topic
            return rows.map(row => {
                row.unlock_conditions = row.unlock_conditions ? row.unlock_conditions.split(',').map(Number) : [];
                return row;
            }); // Trả về danh sách topic đã khóa
        } catch (error) {
            console.error('Error executing getNonEditableTopics() query:', error);
            throw error;
        }
    }

    // Lấy thông tin topic theo ID
    static async getTopicById(topicId) {
        const queryString = `
            SELECT
                t.*,
                u_created.username AS created_by_username,
                u_updated.username AS updated_by_username,
                (SELECT GROUP_CONCAT(condition_topic_id) FROM topic_unlock_conditions WHERE topic_id = t.id) AS unlock_conditions,
                (SELECT COUNT(*) FROM exercises e WHERE e.topic_id = t.id) AS total_exercises
            FROM
                system_exercise_topics t
            LEFT JOIN
                users u_created ON t.created_by = u_created.id
            LEFT JOIN
                users u_updated ON t.updated_by = u_updated.id
            WHERE
                t.id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [topicId]);
            if (rows.length > 0) {
                // Chuyển đổi unlock_conditions thành mảng
                rows[0].unlock_conditions = rows[0].unlock_conditions ? rows[0].unlock_conditions.split(',').map(Number) : [];
                return rows[0]; // Trả về thông tin topic với thông tin bổ sung
            }
            return null; // Nếu không tìm thấy topic
        } catch (error) {
            console.error('Error executing getTopicById() query:', error);
            throw error;
        }
    }

    // Cập nhật thông tin topic
    static async updateTopic(topicId, updatedData) {
        const keys = Object.keys(updatedData);
        const values = Object.values(updatedData);

        // Tạo chuỗi truy vấn SQL
        const queryString = `
            UPDATE system_exercise_topics
            SET ${keys.map(key => `${key} = ?`).join(', ')}
            WHERE id = ?
        `;

        try {
            values.push(topicId); // Thêm ID của topic vào cuối mảng values
            const [result] = await pool.execute(queryString, values);
            return result.affectedRows > 0; // Trả về true nếu có bản ghi nào được cập nhật
        } catch (error) {
            console.error('Error executing updateTopic() query:', error);
            throw error;
        }
    }

    // Xóa một topic
    static async deleteTopic(topicId) {
        const queryString = `
            DELETE FROM system_exercise_topics
            WHERE id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [topicId]);
            return result.affectedRows > 0; // Trả về true nếu có bản ghi nào bị xóa
        } catch (error) {
            console.error('Error executing deleteTopic() query:', error);
            throw error;
        }
    }

    // Tìm kiếm topic theo từ khóa
    static async searchTopics(keyword, page = 1, topicsPerPage = 10) {
        const offset = (page - 1) * topicsPerPage;
        const queryString = `
            SELECT * FROM system_exercise_topics
            WHERE
                (LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))
                AND is_editable = 0
            LIMIT ?, ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [`%${keyword}%`, `%${keyword}%`, offset, topicsPerPage]);
            return rows; // Trả về danh sách topic theo từ khóa
        } catch (error) {
            console.error('Error executing searchTopics() query:', error);
            throw error;
        }
    }

    // Tạo các điều kiện cho một topic
    static async createTopicConditions(topicId, conditionTopicIds) {
        const values = conditionTopicIds.map(conditionTopicId => [topicId, conditionTopicId]);
        
        // Tạo chuỗi truy vấn SQL
        const queryString = `
            INSERT INTO topic_unlock_conditions (topic_id, condition_topic_id)
            VALUES ?
        `;

        try {
            // Thực hiện truy vấn với nhiều giá trị
            const [result] = await pool.query(queryString, [values]);
            return result.affectedRows > 0; // Trả về true nếu có bản ghi nào được thêm
        } catch (error) {
            console.error('Error executing createTopicConditions() query:', error);
            throw error;
        }
    }

    // Xóa tất cả các điều kiện của một topic
    static async deleteTopicCondition(topicId) {
        const queryString = `
            DELETE FROM topic_unlock_conditions
            WHERE topic_id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [topicId]);
            return result.affectedRows > 0; // Trả về true nếu có bản ghi nào bị xóa
        } catch (error) {
            console.error('Error executing deleteTopicCondition() query:', error);
            throw error;
        }
    }

    // Lấy thông tin chủ đề được hoàn thành bởi người dùng
    static async getUserCompletedTopics() {
        const queryString = `
            SELECT
                ct.*,
                u.username,
                t.name as topic_name
            FROM
                user_completed_topics ct
            JOIN
                users u ON ct.user_id = u.id
            JOIN
                system_exercise_topics t ON ct.topic_id = t.id
            ORDER BY
                ct.completed_at
        `;
    
        try {
            const [rows] = await pool.execute(queryString);
            // Chuyển đổi unlock_conditions thành mảng cho mỗi topic
            return rows
        } catch (error) {
            console.error('Error executing getTopics() query:', error);
            throw error;
        }
    }

    // Xóa thông tin bài làm của người dùng
    static async deleteCompletedTopicById(topicId) {
        const queryString = `
            DELETE FROM user_completed_topics
            WHERE topic_id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [topicId]);
            return result.affectedRows > 0; // Trả về true nếu có bản ghi nào bị xóa
        } catch (error) {
            console.error('Error executing deleteCompletedTopicById() query:', error);
            throw error;
        }
    }
}

module.exports = TopicModel;