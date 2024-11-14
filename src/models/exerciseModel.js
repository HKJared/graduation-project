const pool = require('../configs/connectDB');

class ExerciseModel {
    // Tạo một bài tập mới
    static async createExercise(exercise) {
        const keys = Object.keys(exercise); // Lấy tất cả các khóa từ đối tượng exercise
        const values = Object.values(exercise); // Lấy tất cả các giá trị từ đối tượng exercise

        // Tạo chuỗi truy vấn SQL
        const queryString = `
            INSERT INTO exercises (${keys.join(', ')})
            VALUES (${keys.map(() => '?').join(', ')})
        `;

        try {
            const [result] = await pool.execute(queryString, values);
            return result.insertId; // Trả về ID của bài tập vừa được tạo
        } catch (error) {
            console.error('Error executing createExercise() query:', error);
            throw error;
        }
    }

    // Lấy danh sách bài tập
    static async getExercises() {
        const queryString = `
            SELECT
                e.*, 
                t.is_editable
            FROM
                exercises e
            JOIN
                system_exercise_topics t ON e.topic_id = t.id
        `;

        try {
            const [rows] = await pool.execute(queryString);
            return rows; // Trả về danh sách bài tập
        } catch (error) {
            console.error('Error executing getExercisesByTopic() query:', error);
            throw error;
        }
    }

    // Lấy danh sách bài tập theo topic
    static async getExercisesByTopic(topic_id) {
        const queryString = `
            SELECT
                e.*, 
                t.is_editable
            FROM
                exercises e
            JOIN
                system_exercise_topics t ON e.topic_id = t.id
            WHERE
                e.topic_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [topic_id]);
            return rows; // Trả về danh sách bài tập
        } catch (error) {
            console.error('Error executing getExercisesByTopic() query:', error);
            throw error;
        }
    }

    // Cập nhật thông tin bài tập
    static async updateExercise(exerciseId, updatedData) {
        const keys = Object.keys(updatedData);
        const values = Object.values(updatedData);

        // Tạo chuỗi truy vấn SQL
        const queryString = `
            UPDATE exercises
            SET ${keys.map(key => `${key} = ?`).join(', ')}
            WHERE id = ?
        `;

        try {
            values.push(exerciseId); // Thêm ID của bài tập vào cuối mảng values
            const [result] = await pool.execute(queryString, values);
            return result.affectedRows > 0; // Trả về true nếu có bản ghi nào được cập nhật
        } catch (error) {
            console.error('Error executing updateExercise() query:', error);
            throw error;
        }
    }

    // Xóa một bài tập
    static async deleteExercise(exerciseId) {
        const queryString = `
            DELETE FROM exercises
            WHERE id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [exerciseId]);
            return result.affectedRows > 0; // Trả về true nếu có bản ghi nào bị xóa
        } catch (error) {
            console.error('Error executing deleteExercise() query:', error);
            throw error;
        }
    }

    // Lấy thông tin bài tập theo ID
    static async getExerciseById(exerciseId) {
        const queryString = `
            SELECT
                e.*, 
                t.is_editable
            FROM
                exercises e
            JOIN
                system_exercise_topics t ON e.topic_id = t.id
            WHERE 
                e.id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [exerciseId]);
            return rows[0]; // Trả về thông tin bài tập cùng với thông tin chỉnh sửa
        } catch (error) {
            console.error('Error executing getExerciseById() query:', error);
            throw error;
        }
    }

    // Tạo thông tin nhiều câu hỏi trắc nghiệm
    static async createMultipleChoiceExercises(multipleChoiceExercises) {
        if (!Array.isArray(multipleChoiceExercises) || multipleChoiceExercises.length === 0) {
            throw new Error('Invalid input: must be a non-empty array');
        }

        // Tạo chuỗi truy vấn SQL và mảng giá trị cho nhiều câu hỏi
        const queryString = `
            INSERT INTO multiple_choice_exercises (exercise_id, type, question, question_image, options)
            VALUES ${multipleChoiceExercises.map(() => '(?, ?, ?, ?, ?)').join(', ')}
        `;

        // Tạo mảng giá trị cho từng câu hỏi
        const values = [];
        for (const exercise of multipleChoiceExercises) {
            const {
                exercise_id,
                type,
                question,
                question_image,
                options,
            } = exercise;

            values.push(exercise_id, type, question, question_image, options);
        }

        try {
            const [result] = await pool.execute(queryString, values);
            return result.affectedRows; // Trả về số lượng câu hỏi đã được tạo
        } catch (error) {
            console.error('Error executing createMultipleChoiceExercises() query:', error);
            throw error;
        }
    }

    // Tạo thông tin bài tập code
    static async createCodeExercise(codeExercise) {
        const {
            exercise_id,
            prompt,
            language,
            starter_code,
            time_limit,
            test_cases,
        } = codeExercise;
    
        const queryString = `
            INSERT INTO code_exercises (exercise_id, prompt, language, starter_code, time_limit, test_cases)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
    
        try {
            const [result] = await pool.execute(queryString, [exercise_id, prompt, language, starter_code, time_limit, test_cases]);
            return result.insertId; // Trả về ID của bài tập code vừa được tạo
        } catch (error) {
            console.error('Error executing createCodeExercise() query:', error);
            throw error;
        }
    }

    // Lấy thông tin luyện tập của người dùng
    static async getUserExerciseResultsByStarted(started_at = null) {
        // Câu truy vấn cơ bản
        let queryString = `
            SELECT
                er.*, 
                e.topic_id,
                e.level as exercise_level,
                u.username,
                u.last_activity as user_last_activity
            FROM
                user_exercise_results er
            JOIN
                exercises e ON er.exercise_id = e.id
            JOIN
                users u ON er.user_id = u.id
        `;
        
        // Nếu có giá trị started_at, thêm điều kiện vào câu truy vấn
        if (started_at) {
            queryString += ` WHERE er.started_at = ?`;  // Điều kiện so sánh với started_at
        }
    
        try {
            const [rows] = await pool.execute(queryString, started_at ? [started_at] : []);
            return rows; // Trả về danh sách bài tập
        } catch (error) {
            console.error('Error executing getUserExerciseResultsByStarted() query:', error);
            throw error;
        }
    }

    // Xóa thông tin bài làm của người dùng theo topic
    static async deleteExerciseResultsByTopicId(topicId) {
        const queryString = `
            DELETE
                er
            FROM
                user_exercise_results er
            JOIN
                exercises e ON er.exercise_id = e.id
            WHERE
                e.topic_id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [topicId]);
            return result.affectedRows > 0; // Trả về true nếu có bản ghi nào bị xóa
        } catch (error) {
            console.error('Error executing deleteExerciseResultsByTopicId() query:', error);
            throw error;
        }
    }
}

module.exports = ExerciseModel;