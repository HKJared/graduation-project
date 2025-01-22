const pool = require('../configs/connectDB');
const diacritics = require('diacritics');
const hashPassword = require('../utils/hashPassword');
const generateUniqueName = require('../utils/generateUniqueName');

class UserModel {
    static async createUser(account) {
        // Kiểm tra xem fullname đã có trong account chưa
        const fullname = account.fullname || generateUniqueName();
    
        // Lấy các khóa từ đối tượng account và loại bỏ fullname
        const { fullname: _, ...accountWithoutFullname } = account; // Sử dụng destructuring để loại bỏ fullname
        const keys = Object.keys(accountWithoutFullname);
        const values = Object.values(accountWithoutFullname); console.log(values)
    
        // Tạo chuỗi truy vấn SQL với các khóa tương ứng
        const queryString = `
            INSERT INTO users (${keys.join(', ')}, fullname, last_activity)
            VALUES (${keys.map(() => '?').join(', ')}, ?, NOW())
        `;
    
        try {
            // Thêm fullname vào cuối mảng values
            values.push(fullname);
    
            const [result] = await pool.execute(queryString, values);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createUser() query:', error);
            throw error;
        }
    }    

    static async getUsers(keyword = '', page = 1, additionalConditions = {}, usersPerPage = 15) {
        keyword = diacritics.remove(keyword);
        const offset = (page - 1) * usersPerPage;
    
        // Mảng điều kiện và giá trị
        const conditions = [
            '(LOWER(u.username) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?) OR LOWER(u.phone_number) LIKE LOWER(?) OR LOWER(u.fullname) LIKE LOWER(?)) AND u.role_id = 2'
        ];
        const values = [
            `%${keyword}%`,  // Tìm theo tên người dùng
            `%${keyword}%`,  // Tìm theo email người dùng
            `%${keyword}%`,  // Tìm theo số điện thoại người dùng
            `%${keyword}%`   // Tìm theo họ tên người dùng
        ];
    
        // Xử lý các điều kiện bổ sung dựa trên additionalConditions
        let isViolationCondition = ''; // Điều kiện cho is_violation
    
        Object.keys(additionalConditions).forEach((key) => {
            const value = additionalConditions[key];
            if (value !== null && value !== undefined) {
                if (key === 'is_violation') {
                    // Điều kiện cho is_violation
                    if (value === 1) {
                        isViolationCondition = `
                            EXISTS (
                                SELECT 1 FROM user_disables ud 
                                WHERE ud.user_id = u.id
                                AND ud.disable_end > NOW()
                                AND ud.is_active = 1
                            )
                        `;
                    } else if (value === 0) {
                        isViolationCondition = `
                            NOT EXISTS (
                                SELECT 1 FROM user_disables ud 
                                WHERE ud.user_id = u.id
                                AND ud.disable_end > NOW()
                                AND ud.is_active = 1
                            )
                        `;
                    }
                } else {
                    conditions.push(`u.${key} = ?`);
                    values.push(value);
                }
            }
        });
    
        // Thêm điều kiện cho is_violation nếu có
        if (isViolationCondition) {
            conditions.push(isViolationCondition);
        } else {
            // Nếu không có điều kiện is_violation thì mặc định lấy các người dùng không bị vô hiệu hóa
            conditions.push(`
                NOT EXISTS (
                    SELECT 1 FROM user_disables ud 
                    WHERE ud.user_id = u.id
                    AND ud.disable_end > NOW()
                    AND ud.is_active = 1
                )
            `);
        }
    
        // Truy vấn số lượng người dùng
        const countQueryString = `
            SELECT COUNT(u.id) AS total_count
            FROM users u
            WHERE ${conditions.join(' AND ')}
        `;
    
        // Truy vấn danh sách người dùng
        const queryString = `
            SELECT
                u.id, u.username, u.fullname, u.email, u.phone_number, 
                u.avatar_url, r.name AS role_name, u.created_at, u.updated_at
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE ${conditions.join(' AND ')}
            LIMIT ${usersPerPage}
            OFFSET ${offset}
        `;
    
        try {
            // Đếm tổng số người dùng
            const [countRows] = await pool.execute(countQueryString, values);
            const totalCount = countRows[0].total_count;
            const totalPages = Math.ceil(totalCount / usersPerPage);
    
            // Lấy danh sách người dùng
            const [rows] = await pool.execute(queryString, values);
    
            return { users: rows, totalPages }; // Trả về dữ liệu người dùng và tổng số trang
        } catch (error) {
            console.error('Error executing getUsers() query:', error);
            throw error;
        }
    }    
    
    static async getAdmins(keyword = '', page = 1, usersPerPage = 15, additionalConditions = {}) {
        keyword = diacritics.remove(keyword);
        const offset = (page - 1) * usersPerPage;
    
        // Mảng điều kiện và giá trị
        const conditions = [
            '(LOWER(u.username) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?) OR LOWER(u.phone_number) LIKE LOWER(?) OR LOWER(u.fullname) LIKE LOWER(?)) AND u.role_id != 2'
        ];
        const values = [
            `%${keyword}%`,  // Tìm theo tên người dùng
            `%${keyword}%`,  // Tìm theo email người dùng
            `%${keyword}%`,  // Tìm theo số điện thoại người dùng
            `%${keyword}%`   // Tìm theo họ tên người dùng
        ];
    
        // Xử lý các điều kiện bổ sung dựa trên additionalConditions
        let isViolationCondition = ''; // Điều kiện cho is_violation
    
        Object.keys(additionalConditions).forEach((key) => {
            const value = additionalConditions[key];
            if (value !== null && value !== undefined) {
                if (key === 'is_violation') {
                    // Điều kiện cho is_violation
                    if (value === 1) {
                        isViolationCondition = `
                            EXISTS (
                                SELECT 1 FROM user_disables ud 
                                WHERE ud.user_id = u.id
                                AND ud.disable_end > NOW()
                                AND ud.is_active = 1
                            )
                        `;
                    } else if (value === 0) {
                        isViolationCondition = `
                            NOT EXISTS (
                                SELECT 1 FROM user_disables ud 
                                WHERE ud.user_id = u.id
                                AND ud.disable_end > NOW()
                                AND ud.is_active = 1
                            )
                        `;
                    }
                } else {
                    conditions.push(`u.${key} = ?`);
                    values.push(value);
                }
            }
        });
    
        // Thêm điều kiện cho is_violation nếu có
        if (isViolationCondition) {
            conditions.push(isViolationCondition);
        } else {
            // Nếu không có điều kiện is_violation thì mặc định lấy các người dùng không bị vô hiệu hóa
            conditions.push(`
                NOT EXISTS (
                    SELECT 1 FROM user_disables ud 
                    WHERE ud.user_id = u.id
                    AND ud.disable_end > NOW()
                    AND ud.is_active = 1
                )
            `);
        }
    
        // Truy vấn số lượng người dùng
        const countQueryString = `
            SELECT COUNT(u.id) AS total_count
            FROM users u
            WHERE ${conditions.join(' AND ')}
        `;
    
        // Truy vấn danh sách người dùng
        const queryString = `
            SELECT
                u.id, u.username, u.fullname, u.email, u.phone_number, 
                u.avatar_url, r.name AS role_name, u.created_at, u.updated_at
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE ${conditions.join(' AND ')} AND u.id != 1
            ORDER BY u.id DESC
            LIMIT ${usersPerPage}
            OFFSET ${offset}
        `;
    
        try {
            // Đếm tổng số người dùng
            const [countRows] = await pool.execute(countQueryString, values);
            const totalCount = countRows[0].total_count;
            const totalPages = Math.ceil(totalCount / usersPerPage);
    
            // Lấy danh sách người dùng
            const [rows] = await pool.execute(queryString, values);
    
            return { users: rows, totalPages }; // Trả về dữ liệu người dùng và tổng số trang
        } catch (error) {
            console.error('Error executing getUsers() query:', error);
            throw error;
        }
    }    

    static async getUserById(user_id) {
        const queryString = `
        SELECT 
            u.id, u.username, u.password, u.fullname, u.email, u.phone_number, u.last_activity, u.provider,
            u.gender, u.date_of_birth, u.avatar_url, u.role_id, 
            r.name as role_name,
            u.created_at, u.updated_at
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [user_id]);
            return rows[0];
        } catch (error) {
            console.error('Error executing getUserById() query:', error);
            throw error;
        }
    }

    static async getUserByUsernameOrPhoneNumber(keyword) {
        const queryString = `
        SELECT *
        FROM users
        WHERE
            username = ?
            OR phone_number = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [keyword, keyword]);
            
            return rows[0];
        } catch (error) {
            console.error('Error executing getUserByUsernameOrPhoneNumber() query:', error);
            throw error;
        }
    }

    static async getUserByProviderAndId(provider, provider_id) {
        const queryString = `
        SELECT *
        FROM users
        WHERE
            provider = ?
            AND provider_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [provider, provider_id]);
            
            return rows[0];
        } catch (error) {
            console.error('Error executing getUserByUsernameOrPhoneNumber() query:', error);
            throw error;
        }
    }

    static async updateUser(account) {
        // Xây dựng câu lệnh SQL
        let setClause = [];
        let values = [];
    
        // Duyệt qua các key của account để xây dựng câu lệnh SQL
        for (const [key, value] of Object.entries(account)) {
            if (key === 'id') continue; // Bỏ qua trường id ở đây
    
            // Kiểm tra nếu là trường 'last_activity' và chuyển đổi giá trị ngày giờ
            if (key === 'last_activity' && value) {
                const date = new Date(value);
                // Đảm bảo giá trị 'last_activity' có định dạng hợp lệ cho MySQL
                values.push(date.toISOString().slice(0, 19).replace('T', ' '));
            } else {
                values.push(value);
            }
    
            setClause.push(`${key} = ?`);
        }
    
        // Thêm ID của người dùng vào cuối cùng
        setClause = setClause.join(', ');
        const queryString = `
            UPDATE users
            SET ${setClause}
            WHERE id = ?
        `;
    
        values.push(account.id); // Thêm user_id vào cuối mảng values
    
        try {
            const [result] = await pool.execute(queryString, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing updateUser() query:', error);
            throw error;
        }
    }
    
    static async deleteUser(user_id) {
        const queryString = `
        DELETE FROM users
        WHERE id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [user_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing deleteUser() query:', error);
            throw error;
        }
    }

    static async createOldPassword(hash_password, user_id) {
        const queryString = `
        INSERT INTO old_passwords (old_password, user_id)
        VALUES (?, ?)
        `;

        try {
            const [result] = await pool.execute(queryString, [hash_password, user_id]);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createUser() query:', error);
            throw error;
        }
    }

    static async getOldPassword(hash_password, user_id) {
        const queryString = `
        SELECT *
        FROM old_passwords 
        WHERE old_password = ? AND user_id = ?
        `;

        try {
            const [row] = await pool.execute(queryString, [hash_password, user_id]);
            return row[0];
        } catch (error) {
            console.error('Error executing createUser() query:', error);
            throw error;
        }
    }

    // TODO: Dành cho nhánh giảng viên
    static async createInstructor(user_id, instructor) {
        const { phone_number, email, teaching_levels, teaching_certificate_url } = instructor
    
        // Tạo chuỗi truy vấn SQL với các khóa tương ứng
        const queryString = `
            INSERT INTO instructors (user_id, phone_number, email, teaching_levels, teaching_certificate_url)
            VALUES (?, ?, ?, ?, ?)
        `;
    
        try {
            const [result] = await pool.execute(queryString, [user_id, phone_number, email, teaching_levels, teaching_certificate_url]);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createInstructor() query:', error);
            throw error;
        }
    }

    static async createInstructorIdentification(user_id, instructor_identification) {
        const { id_type, id_value, fullname, id_image_url, id_image_with_person_url } = instructor_identification
    
        // Tạo chuỗi truy vấn SQL với các khóa tương ứng
        const queryString = `
            INSERT INTO instructor_identifications (user_id, id_type, id_value, fullname, id_image_url, id_image_with_person_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
    
        try {
            const [result] = await pool.execute(queryString, [user_id, id_type, id_value, fullname, id_image_url, id_image_with_person_url]);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createInstructorIdentification() query:', error);
            throw error;
        }
    }

    static async getInstructorByUserId (user_id) {
        const queryString = `
            SELECT
                *
            FROM
                instructors
            WHERE
                user_id = ?
        `

        try {
            const [row] = await pool.execute(queryString, [user_id]);
            return row[0];
        } catch (error) {
            console.error('Error executing getInstructorByUserId() query:', error);
            throw error;
        }
    }

    static async getInstructorIdentificationByUserId (user_id) {
        const queryString = `
            SELECT
                *
            FROM
                instructor_identifications
            WHERE
                user_id = ?
        `

        try {
            const [row] = await pool.execute(queryString, [user_id]);
            return row[0];
        } catch (error) {
            console.error('Error executing getInstructorIdentificationByUserId() query:', error);
            throw error;
        }
    }

    static async updateInstructorByUser(user_id, instructor) {
        const {
            email, phone_number, teaching_levels, teaching_certificate_url
        } = instructor

        const queryString = `
            UPDATE instructors
            SET email = ?, phone_number = ?, teaching_levels = ?, teaching_certificate_url = ?, is_approved = 0, approved_by = NULL, approved_at = NULL
            WHERE user_id = ?
        `

        try {
            const [result] = await pool.execute(queryString, [email, phone_number, teaching_levels, teaching_certificate_url, user_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing updateUser() query:', error);
            throw error;
        }
    }

    static async updateIdentificationByUser(user_id, identification) {
        const {
            id_type, id_value, fullname, id_image_url, id_image_with_person_url
        } = identification
        console.log(identification)

        const queryString = `
            UPDATE instructor_identifications
            SET 
                id_type = ?, 
                id_value = ?, 
                fullname = ?, 
                id_image_url = ?, 
                id_image_with_person_url = ?,
                is_verified = 0, 
                verified_by = NULL, 
                verified_at = NULL
            WHERE user_id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [
                id_type, id_value, fullname, id_image_url, id_image_with_person_url, user_id,
            ]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing updateUser() query:', error);
            throw error;
        }

    }

    // Tạo một bản ghi vô hiệu hóa người dùng
    static async createUserDisable({ user_id, disable_end, reason, note, created_by }) {
        const queryString = `
            INSERT INTO user_disable (user_id, disable_end, reason, note, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;

        try {
            const [result] = await pool.execute(queryString, [user_id, disable_end, reason, note, created_by]);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createUserDisable() query:', error);
            throw error;
        }
    }

    // Cập nhật một bản ghi vô hiệu hóa
    // static async updateUserDisable({ id, disable_end, reason, note, updated_by }) {
    //     const queryString = `
    //         UPDATE user_disable
    //         SET
    //             disable_end = COALESCE(?, disable_end),
    //             reason = COALESCE(?, reason),
    //             note = COALESCE(?, note),
    //             updated_by = COALESCE(?, updated_by),
    //             updated_at = NOW()
    //         WHERE
    //             id = ?
    //     `;

    //     try {
    //         const [result] = await pool.execute(queryString, [disable_end, reason, note, updated_by, id]);
    //         return result.affectedRows > 0;
    //     } catch (error) {
    //         console.error('Error executing updateUserDisable() query:', error);
    //         throw error;
    //     }
    // }

    // Lấy thông tin vô hiệu hóa của một người dùng
    static async getUserDisableByUserId(user_id) {
        const queryString = `
            SELECT
                id, user_id, disable_end, reason, note, created_by, created_at, updated_by, updated_at
            FROM
                user_disable
            WHERE
                user_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [user_id]);
            return rows;
        } catch (error) {
            console.error('Error executing getUserDisableByUserId() query:', error);
            throw error;
        }
    }

    // Lấy thông tin vô hiệu hóa còn hiệu lực của một người dùng
    static async getCurrentDisableByUserId(user_id) {
        const currentTime = new Date();

        const queryString = `
            SELECT *
            FROM user_disables
            WHERE user_id = ?
            AND disable_end > ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [user_id, currentTime]);
            return rows[0];
        } catch (error) {
            console.error('Error executing getCurrentDisableByUserId() query:', error);
            throw error;
        }
    }

    // Xóa thông tin vô hiệu hóa của một người dùng
    static async deleteUserDisable(id) {
        const queryString = `
            DELETE FROM user_disable
            WHERE
                id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing deleteUserDisable() query:', error);
            throw error;
        }
    }
}

module.exports = UserModel;