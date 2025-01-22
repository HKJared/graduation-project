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
    static async getExercisesByTopicId(topic_id) {
        const queryString = `
            SELECT
                e.id, e.topic_id, e.title, e.type, e.level, e.bonus_scores, e.is_key_exercise, 
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
            SET ${keys.map(key => `${key} = ?`).join(', ')}, updated_at = now()
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
                t.is_editable, t.name as topic_name,
                u_created.username AS created_by_username,
                u_updated.username AS updated_by_username
            FROM
                exercises e
            JOIN
                system_exercise_topics t ON e.topic_id = t.id
            LEFT JOIN
                users u_created ON e.created_by = u_created.id
            LEFT JOIN
                users u_updated ON e.updated_by = u_updated.id
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
    static async createMultipleChoiceExercises(exerciseId, multipleChoiceExercises = []) {
        // Tạo chuỗi truy vấn SQL và mảng giá trị cho nhiều câu hỏi
        const queryString = `
            INSERT INTO multiple_choice_exercises (exercise_id, type, question, question_image_url, options)
            VALUES ${multipleChoiceExercises.map(() => `(${ exerciseId }, ?, ?, ?, ?)`).join(', ')}
        `;

        // Tạo mảng giá trị cho từng câu hỏi
        const values = [];
        for (const exercise of multipleChoiceExercises) {
            values.push(exercise.type, exercise.question, exercise.question_image_url, JSON.stringify(exercise.options));
        }
        
        try {
            const [result] = await pool.execute(queryString, values);
            return result.affectedRows; // Trả về số lượng câu hỏi đã được tạo
        } catch (error) {
            console.error('Error executing createMultipleChoiceExercises() query:', error);
            throw error;
        }
    }

    // Lấy các câu hỏi trắc nghiệm của bài tập
    static async getMultipleChoiceExercisesByExerciseId(exerciseId) {
        const queryString = `
            SELECT
                *
            FROM
                multiple_choice_exercises
            WHERE
                exercise_id = ?
        `;
    
        try {
            const [rows] = await pool.execute(queryString, [exerciseId]);
    
            // Chuyển đổi 'options' từ chuỗi JSON sang mảng
            const processedRows = rows.map(row => {
                return {
                    ...row,
                    options: row.options ? JSON.parse(row.options) : [], // Chuyển đổi hoặc trả về mảng rỗng nếu null
                };
            });
    
            return processedRows; // Trả về dữ liệu đã được xử lý
        } catch (error) {
            console.error('Error executing getMultipleChoiceExercisesByExerciseId() query:', error);
            throw error;
        }
    }

    // Lấy câu hỏi trắc nghiệm bằng id
    static async getMultipleChoiceExercisesById(questionId) {
        const queryString = `
            SELECT
                *
            FROM
                multiple_choice_exercises
            WHERE
                id = ?
        `;
    
        try {
            const [rows] = await pool.execute(queryString, [questionId]);
    
            // Chuyển đổi 'options' từ chuỗi JSON sang mảng
            const processedRows = rows.map(row => {
                return {
                    ...row,
                    options: row.options ? JSON.parse(row.options) : [], // Chuyển đổi hoặc trả về mảng rỗng nếu null
                };
            });
    
            return processedRows[0]; // Trả về dữ liệu đã được xử lý
        } catch (error) {
            console.error('Error executing getMultipleChoiceExercisesById() query:', error);
            throw error;
        }
    }

    // Cập nhật câu hỏi trác nghiệm
    static async updateMultipleChoiceExercises(updateQuestion) {
        const { id, type, question, question_image_url, options, is_required } = updateQuestion
        const queryString = `
            UPDATE
                multiple_choice_exercises
            SET
                type = ?, question = ?, question_image_url = ?, options = ?, is_required = ?
            WHERE
                id = ?
        `;
    
        try {
            const [result] = await pool.execute(queryString, [
                type, question, question_image_url, JSON.stringify(options), is_required, id
            ]);
    
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing updateMultipleChoiceExercises() query:', error);
            throw error;
        }
    }

    // Tạo thông tin bài tập code
    static async createCodeExercise(exerciseId, codeExercise) {
        const {
            content,
            language,
            starter_code,
            test_cases,
        } = codeExercise;
    
        const queryString = `
            INSERT INTO code_exercises (exercise_id, content, language, starter_code, test_cases)
            VALUES (?, ?, ?, ?, ?)
        `;
    
        try {
            const [result] = await pool.execute(queryString, [exerciseId, content, language, starter_code, JSON.stringify(test_cases)]);
            return result.insertId; // Trả về ID của bài tập code vừa được tạo
        } catch (error) {
            console.error('Error executing createCodeExercise() query:', error);
            throw error;
        }
    }

    // Lấy thông tin bài tập code
    static async getCodeExercise (exerciseId) {
        const queryString = `
            SELECT
                *
            FROM
                code_exercises
            WHERE
                exercise_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [exerciseId]);
            if (rows.length) {
                rows[0].test_cases = JSON.parse(rows[0].test_cases)
            }
            return rows[0]; // Trả về ID của bài tập code vừa được tạo
        } catch (error) {
            console.error('Error executing getCodeExercise() query:', error);
            throw error;
        }
    }

    // Cập nhật thông tin bài tập code
    static async updateCodeExercise(exerciseId, updatedData) {
        const keys = Object.keys(updatedData);
        const values = Object.values(updatedData);

        // Tạo chuỗi truy vấn SQL
        const queryString = `
            UPDATE code_exercises
            SET ${keys.map(key => `${key} = ?`).join(', ')}
            WHERE exercise_id = ?
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

        // Lấy thông tin luyện tập của người dùng theo 1 chủ đề
        static async getUserExerciseResultsByTopicIdAndStarted(topicId, started_at = null) {
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
                WHERE
                    e.topic_id = ?
            `;
            
            // Nếu có giá trị started_at, thêm điều kiện vào câu truy vấn
            if (started_at) {
                queryString += ` AND er.started_at = ?`;  // Điều kiện so sánh với started_at
            }
        
            try {
                const [rows] = await pool.execute(queryString, started_at ? [topicId, started_at] : [topicId]);
                return rows; // Trả về danh sách bài tập
            } catch (error) {
                console.error('Error executing getUserExerciseResultsByStarted() query:', error);
                throw error;
            }
        }

    // Lấy thông tin luyện tập của người dùng theo topic
    static async getUserExerciseResultsByTopicId(topicId) {
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
            WHERE
                e.topic_id = ?
        `;
    
        try {
            const [rows] = await pool.execute(queryString, [topicId]);
            return rows; // Trả về danh sách bài tập
        } catch (error) {
            console.error('Error executing getUserExerciseResultsByTopicId() query:', error);
            throw error;
        }
    }

    // Tạo thông tin bài làm của người dùng
    static async createUserExerciseResult(user_id, exercise_id, score, is_completed) {
        try {
            // Khởi tạo câu truy vấn và mảng giá trị
            let queryString = `
                INSERT INTO user_exercise_results (user_id, exercise_id, score
            `;
            const values = [user_id, exercise_id, score];
    
            // Kiểm tra is_completed để thêm các trường và giá trị tương ứng
            if (is_completed) {
                queryString += `, is_completed, completed_at`;
                values.push(1, new Date());
            }
    
            queryString += `) VALUES (?, ?, ?`;
    
            if (is_completed) {
                queryString += `, ?, ?`;
            }
    
            queryString += `)`;
    
            // Thực thi truy vấn
            const [result] = await pool.execute(queryString, values);
            return result.insertId; // Trả về ID của bài tập vừa được tạo
        } catch (error) {
            console.error('Error executing createUserExerciseResult() query:', error);
            throw error;
        }
    }

    // Lấy thông tin bài làm của người dùng
    static async getUserExerciseResultByExerciseIdAndUserId(result_id, user_id) {
        const queryString = `
            SELECT
                *
            FROM
                user_exercise_results
            WHERE
                exercise_id = ?
                AND user_id = ?
        `;
        try {
            const [row] = await pool.execute(queryString, [result_id, user_id]);
            return row[0]; // Trả về ID của bài tập vừa được tạo
        } catch (error) {
            console.error('Error executing getUserExerciseResult() query:', error);
            throw error;
        }
    }

    // Cập nhật thông tin bài làm của người dùng
    static async updateUserExerciseResult(id, score, is_completed) {
        try {
            // Khởi tạo câu truy vấn và mảng giá trị
            let queryString = `
                UPDATE user_exercise_results 
                SET score = ?, submission_count = submission_count + 1
            `;
            const values = [score];
    
            // Nếu is_completed là true, thêm các trường và giá trị tương ứng
            if (is_completed) {
                queryString += `, is_completed = ?, completed_at = ?`;
                values.push(1, new Date());
            }
    
            queryString += ` WHERE id = ?`;
            values.push(id);
    
            // Thực thi truy vấn
            const [result] = await pool.execute(queryString, values);
    
            // Kiểm tra số hàng bị ảnh hưởng để xác định thành công
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing updateUserExerciseResult() query:', error);
            throw error;
        }
    }    

    // Tạo thông tin bài làm trắc nghiệm của người dùng
    static async createMultipleChoiceExerciseAnswers(result_id, questionResults = []) {
        // Tạo chuỗi truy vấn SQL và mảng giá trị cho nhiều câu trả lời
        const queryString = `
            INSERT INTO user_multiple_choice_answers (question_id, result_id, selected_options, is_correct)
            VALUES ${questionResults.map(() => `(?, ${ result_id }, ?, ?)`).join(', ')}
        `;
        // Tạo mảng giá trị cho từng câu trả lời
        const values = [];
        for (const result of questionResults) {
            values.push(result.question_id, JSON.stringify(result.selected_options), result.is_correct);
        }
// console.log(queryString, values)
        try {
            const [result] = await pool.execute(queryString, values); 
            return result.affectedRows; // Trả về số lượng câu trả lời đã được tạo
        } catch (error) {
            console.error('Error executing createMultipleChoiceExerciseAnswer() query:', error);
            throw error;
        }
    }

    // Lấy thông tin bài làm trắc nghiệm của người dùng
    static async getMultipleChoiceExerciseAnswerByResultId(result_id) {
        const queryString = `
            SELECT 
                umca.*,
                mce.*
            FROM
                user_multiple_choice_answers umca
            JOIN
                multiple_choice_exercises mce ON mce.id = umca.question_id
            WHERE
                umca.result_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [result_id]);
            const processedRows = rows.map(row => {
                return {
                    ...row,
                    options: row.options ? JSON.parse(row.options) : [], // Chuyển đổi hoặc trả về mảng rỗng nếu null
                    selected_options: row.selected_options ? JSON.parse(row.selected_options) : [],
                };
            });
            return processedRows; // Trả về số lượng câu trả lời đã được tạo
        } catch (error) {
            console.error('Error executing getMultipleChoiceExerciseAnswerByResultId() query:', error);
            throw error;
        }
    }

    // Tạo thông tin bài làm lập trình của người dùng
    static async createCodeExerciseSubmission(result_id, submittedCode) {
        // Tạo chuỗi truy vấn SQL và mảng giá trị cho nhiều câu trả lời
        const queryString = `
            INSERT INTO user_code_exercise_submissions (result_id, submitted_code)
            VALUES (?, ?)
        `;
        try {
            const [result] = await pool.execute(queryString, [result_id, submittedCode]); 
            return result.affectedRows;
        } catch (error) {
            console.error('Error executing createCodeExerciseSubmission() query:', error);
            throw error;
        }
    }

    // Tạo thông tin bài làm lập trình của người dùng
    static async getCodeExerciseSubmissionByResultId(result_id) {
        const queryString = `
            SELECT 
                *
            FROM
                user_code_exercise_submissions
            WHERE
                result_id = ?
        `;

        try {
            const [row] = await pool.execute(queryString, [result_id,]); 
            return row[0];
        } catch (error) {
            console.error('Error executing getCodeExerciseSubmissionByResultId() query:', error);
            throw error;
        }
    }

    // Sửa thông tin bài làm lập trình của người dùng
    static async updateCodeExerciseSubmission(result_id, submittedCode) {
        // Tạo chuỗi truy vấn SQL và mảng giá trị cho nhiều câu trả lời
        const queryString = `
            UPDATE user_code_exercise_submissions
            SET submitted_code = ?
            WHERE result_id = ?
        `;
        try {
            const [result] = await pool.execute(queryString, [submittedCode, result_id]); 
            return result.affectedRows;
        } catch (error) {
            console.error('Error executing updateCodeExerciseSubmission() query:', error);
            throw error;
        }
    }

    // Lấy thông bài làm của người dùng
    static async getUserExerciseResultByExerciseId(user_id, exercise_id) {
        const queryString = `
            SELECT
                *
            FROM
                user_exercise_results
            WHERE
                user_id = ?
                AND exercise_id = ?
        `;

        try {
            const [row] = await pool.execute(queryString, [user_id, exercise_id]);
            return row[0];
        } catch (error) {
            console.error('Error executing getUserExerciseResultByExerciseId() query:', error);
            throw error;
        }
    }

    // Xóa thông tin bài làm cũ của người dùng
    static async deleteUserMultipleExerciseAnswers(result_id) {
        const queryString = `
            DELETE
            FROM
                user_multiple_choice_answers
            WHERE
                result_id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [result_id]);
            return result.affectedRows > 0; // Trả về true nếu có bản ghi nào bị xóa
        } catch (error) {
            console.error('Error executing deleteUserMultipleExerciseResult() query:', error);
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

    // Lấy thông tin luyện tập của một người dùng
    static async getUserExerciseResultsByTopicId(user_id, topic_id) {
        // Câu truy vấn cơ bản
        const queryString = `
            SELECT
                er.id, er.exercise_id, er.is_completed, e.bonus_scores
            FROM
                user_exercise_results er
            JOIN
                exercises e ON er.exercise_id = e.id
            WHERE
                er.user_id = ?
                AND e.topic_id = ?
        `;
    
        try {
            const [rows] = await pool.execute(queryString, [user_id, topic_id]);
            return rows; 
        } catch (error) {
            console.error('Error executing getUserExerciseResultsByStarted() query:', error);
            throw error;
        }
    }

    // Lấy tất cả các bài đã hoàn thành của một của đề bởi Id người dùng
    static async getUserCompletedExercisesByTopicId(userId, topicId) {
        // Câu truy vấn cơ bản
        let queryString = `
            SELECT
                er.id
            FROM
                user_exercise_results er
            JOIN
                exercises e ON er.exercise_id = e.id
            WHERE
                er.user_id = ?
                AND e.topic_id = ?
                AND er.is_completed = 1
        `;
    
        try {
            const [rows] = await pool.execute(queryString, [userId, topicId]);
            return rows; // Trả về danh sách bài tập
        } catch (error) {
            console.error('Error executing getUserExerciseResultsByTopicId() query:', error);
            throw error;
        }
    }
}

module.exports = ExerciseModel;