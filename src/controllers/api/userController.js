const hashPassword = require("../../utils/hashPassword");
const JWTService = require("../../utils/jwtService");
const LogModel = require("../../models/logModel");
const UserModel = require("../../models/userModel");
const VerificationModel = require("../../models/verificationModel");
const { deleteFileFromCloudinary } = require("../../utils/upload");
const moment = require('moment');

function getLastChange(lastChange) {
    if (!lastChange) {
        return '-'
    }

    // Thời gian hiện tại
    const now = new Date();
    
    // Chuyển đổi last_activity từ chuỗi sang đối tượng Date
    const lastChangeDate = new Date(lastChange);
    
    // Tính toán thời gian trôi qua (số giây)
    const timeDifferenceInSeconds = Math.floor((now - lastChangeDate) / 1000);
    
    // Quy đổi các đơn vị
    const minutes = Math.floor(timeDifferenceInSeconds / 60);
    const hours = Math.floor(timeDifferenceInSeconds / 3600);
    const days = Math.floor(timeDifferenceInSeconds / 86400);
    const months = Math.floor(days / 30); // Trung bình 30 ngày mỗi tháng
    const years = Math.floor(months / 12); // 12 tháng mỗi năm

    // Kiểm tra và trả về chuỗi hiển thị phù hợp
    if (timeDifferenceInSeconds < 60) {
        return "1 phút trước";
    } else if (minutes < 60) {
        return `${minutes} phút trước`;
    } else if (hours < 24) {
        return `${hours} giờ trước`;
    } else if (days < 30) {
        return `${days} ngày trước`;
    } else if (months < 12) {
        return `${months} tháng trước`;
    } else {
        return `${years} năm trước`;
    }
}

class UserController {
    // hàm tạo tài khoản
    static async createUser(req, res) {
        try {
            const account = req.body.account; 

            const user_id = req.user_id || null;
            let log_id;
            if (req.log_id) {
                log_id = req.log_id;
            } else {
                log_id = await LogModel.createLog('Đăng ký tài khoản', 2);
            }            

            const user = await UserModel.getUserByUsernameOrPhoneNumber(account.username);
            if (user) {
                await LogModel.updateDetailLog(`Tài khoản ${ user.username } đã tồn tại.`, log_id);
                return res.status(400).json({ message: "Tài khoản đã tồn tại." })
            }

            let phone_verification;
            if (!user_id && account.role_id === 2) {
                phone_verification = await VerificationModel.getPhoneVerificationById(account.phone_verification_id);

                if (!phone_verification.is_verified) {
                    await LogModel.updateDetailLog(`Chưa xác thực số điện thoại.`, log_id);
                    return res.status(400).json({ message: "Số điện thoại của bạn chưa được xác thực, vui lòng quay lại trang đăng ký." })
                }

                account.phone_number = phone_verification.phone_number;

                delete account.phone_verification_id;
            }
            
            account.password = hashPassword(account.password);

            // const {
            //     username, password, role_id, email, phone_number, created_by
            // } = account

            // const new_user_id = await UserModel.createUser({
            //     username, password, role_id, email: email || "", phone_number, created_by
            // });

            const new_user_id = await UserModel.createUser(account);

            await LogModel.updateStatusLog(log_id);
            await LogModel.updateDetailLog(`Tạo tài khoản thành công.`, log_id);
            return res.status(200).json({ message: "Tạo tài khoản thành công.", new_user_id: new_user_id})
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async findOrCreateUser(req, res) {
        try {
            const user = req.user;
            let log_id;
    
            // Lấy provider và provider_id từ thông tin người dùng
            const provider = user.provider;
            const providerId = hashPassword(user.id);
    
            let existingUser = await UserModel.getUserByProviderAndId(provider, providerId);
    
            if (existingUser) {
                // Nếu người dùng đã tồn tại, trả về userId
                log_id = await LogModel.createLog(`Đăng nhập qua tài khoản ${ provider }`, existingUser.id);
                await LogModel.updateStatusLog(log_id);
                return existingUser.id; // Trả về userId
            }
            
            // Nếu người dùng chưa tồn tại, tạo một tài khoản mới
            const newUser = {
                username: user.username || user._json.email.split('@')[0], // Tạo username từ email
                password: null, // Không cần mật khẩu cho tài khoản Google
                fullname: user.displayName,
                email: user._json.email,
                avatar_url: user.photos[0].value || '', // Ảnh đại diện từ Google
                provider: provider, // Lưu provider
                provider_id: providerId, // Lưu provider ID
            };
    
            // Tạo người dùng mới trong cơ sở dữ liệu
            const newUserId = await UserModel.createUser(newUser);
            log_id = await LogModel.createLog(`Đăng ký tài khoản qua tài khoản ${ provider }`, newUserId);
            await LogModel.updateStatusLog(log_id);
    
            // Trả về userId cho route
            return newUserId; // Trả về userId
        } catch (error) {
            console.error(error);
            throw error; // Ném lỗi để có thể xử lý ở nơi gọi hàm này
        }
    }    

    static async getUserInfo(req, res) {
        try {
            const user_id = req.user_id;

            const user = await UserModel.getUserById(user_id);

            user.instructor = await UserModel.getInstructorByUserId(user_id);
            user.identification = await UserModel.getInstructorIdentificationByUserId(user_id);

            // user.address = await UserModel.getAddressByUserId(user_id);

            return res.status(200).json({ user: user });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.', code: 0 });
        }
    }

    static async getAdmins(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            const { keyword, page, itemsPerPage } = req.query;

            await LogModel.updateDetailLog('Tìm kiếm tài khoản quản trị viên.', log_id);


            const { users, totalPages } = await UserModel.getAdmins(keyword || '', page || 1, itemsPerPage || 15);

            return res.status(200).json({ admins: users, totalPages: totalPages });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.', code: 0 });
        }
    }

    static async getAdminById(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            const { id } = req.query;

            await LogModel.updateDetailLog('Lấy thông tin chi tiết tài khoản quản trị viên.', log_id);

            const admin = await UserModel.getUserById(id);

            return res.status(200).json({ admin: admin });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.', code: 0 });
        }
    }

    static async updateAdmin(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            
            const account = req.body.account;

            const admin = await UserModel.getUserById(account.  id);

            if (!admin || admin.role_id == 2) {
                await LogModel.updateDetailLog("Không tìm thấy tài khoản quản trị viên cần cập nhật.", log_id);
                return res.status(404).json({ message: "Không tìm thấy tài khoản quản trị viên cần cập nhật, vui lòng thử lại hoặc tải lại trang." });
            }

            if (account.avatar_url === null){
                account.avatar_url = admin.avatar_url
            }

            const is_update = await UserModel.updateUser(account);

            if (!is_update) {
                await LogModel.updateDetailLog("Cập nhật thông tin tài khoản quản trị viên không thành công.", log_id);
                return res.status(404).json({ message: "Cập nhật thông tin tài khoản quản trị viên không thành công." });
            }

            if (account.avatar_url !== admin.avatar_url) {
                deleteFileFromCloudinary(admin.avatar_url)
            }

            await LogModel.updateStatusLog(log_id)

            return res.status(200).json({ message: "Cập nhật thông tin tài khoản quản trị viên thành công." });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.', code: 0 });
        }
    }

    static async deleteAdmin(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            const id = req.body.id;

            const admin = await UserModel.getUserById(id);

            if (!admin || admin.role_id == 2) {
                await LogModel.updateDetailLog("Không tìm thấy tài khoản quản trị viên cần xóa.", log_id);
                return res.status(404).json({ message: "Không tìm thấy tài khoản quản trị viên cần xóa, vui lòng thử lại hoặc tải lại trang." });
            }

            const is_deleted = await UserModel.deleteUser(id);

            if (!is_deleted) {
                await LogModel.updateDetailLog("Xóa tài khoản quản trị viên không thành công.", log_id);
                return res.status(404).json({ message: "Xóa tài khoản quản trị viên không thành công, vui lòng thử lại hoặc tải lại trang." });
            }

            await LogModel.updateStatusLog(log_id)

            return res.status(200).json({ message: "Xóa tài khoản quản trị viên thành công." });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.', code: 0 });
        }
    }

    static async getAdminInfo(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            await LogModel.updateDetailLog('Thấy thông tin cá nhân', log_id);

            const user = await UserModel.getUserById(user_id);

            if (user.role_id == 2) {
                await LogModel.updateDetailLog('Tài khoản không phải quản trị viên.', log_id);

                return ré.status(400).json({ message: 'Tài khoản không phải quản trị viên.' });
            }

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ admin: user });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async changePassword(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = await LogModel.createLog('Đổi mật khẩu', user_id);

            const { old_password, new_password } = req.body;
            
            if (!old_password || !new_password) {
                await LogModel.updateDetailLog('Thiếu thông tin mật khẩu cũ và mật khẩu mới.', log_id);
                return res.status(400).json({ message: 'Đổi mật khẩu không thành công, vui lòng thử lại hoặc tải lại trang.' });
            }

            const user = await UserModel.getUserById(user_id);

            if (hashPassword(old_password) != user.password) {
                await LogModel.updateDetailLog('Mật khẩu cũ không chính xác.', log_id);
                return res.status(400).json({ message: 'Mật khẩu cũ không chính xác.' });
            }

            const password_is_exist = await UserModel.getOldPassword(hashPassword(new_password), user_id);

            if (password_is_exist) {
                await LogModel.updateDetailLog('Mật khẩu đã tồn tại.', log_id);
                return res.status(400).json({ message: `Mật khẩu này đã được sử dụng và thay đổi vào ${ getLastChange(password_is_exist.changed_at) }.` });
            }

            const account = {id: user_id, password: hashPassword(new_password)}
            console.log(account)
            const is_changed = await UserModel.updateUser(account);

            if (!is_changed) {
                await LogModel.updateDetailLog('Đổi mật khẩu không thành công.', log_id);
                return res.status(400).json({ message: 'Đổi mật khẩu không thành công, vui lòng thử lại hoặc tải lại trang.' });
            }

            await UserModel.createOldPassword(hashPassword(old_password), user_id);

            await LogModel.updateStatusLog(log_id);
            await LogModel.updateDetailLog('Đổi mật khẩu thành công.', log_id);
            return res.status(200).json({ message: 'Đổi mật khẩu thành công.', code: 1 });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // Đăng ký trở thành giảng viên
    static async instructorRegister(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = await LogModel.createLog('instructor-registor', user_id);

            const { instructor, instructor_identification } = req.body;

            if (!instructor || !instructor_identification) {
                await LogModel.updateDetailLog('Thông tin không đầy đủ', log_id);

                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin', code: 0 })
            }

            if (!instructor.teaching_certificate_url || !instructor_identification.id_image_url || !instructor_identification.id_image_with_person_url) {
                await LogModel.updateDetailLog('Lỗi trong quá trình tải file', log_id);

                return res.status(400).json({ message: 'Đã có lỗi trong quá trình tải file (Có thể có kích thước file quá lớn)', code: 0 })
            }

            await UserModel.createInstructor(user_id, instructor);
            await UserModel.createInstructorIdentification(user_id, instructor_identification);

            await LogModel.updateStatusLog(log_id);

            const instructorData = await UserModel.getInstructorByUserId(user_id);
            const identificationData = await UserModel.getInstructorIdentificationByUserId(user_id);

            return res.status(200).json({ message: "Đăng ký thành công.", code: 1, instructor_registor: { instructorData, identificationData } });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.', code: 0 });
        }
    }

    // đăng nhập
    static async login(req, res) {
        try {
            const account = req.body.account; 

            const user = await UserModel.getUserByUsernameOrPhoneNumber(account.username);

            if (!user || user.role_id != 2) {
                return res.status(400).json({ message: "Tài khoản không tồn tại." });
            }

            const log_id = await LogModel.createLog('Đăng nhập', user.id);
            const password = hashPassword(account.password);

            const old_password = await UserModel.getOldPassword(password, user.id);

            if (old_password) {
                await LogModel.updateDetailLog(`Đăng nhập với mật khẩu cũ.`, log_id);
                return res.status(400).json({ message: `Bạn đã đăng nhập với mật khẩu cũ, đã được thay đổi vào ${ getLastChange(old_password.changed_at) }.` })
            }

            if (password != user.password) {
                await LogModel.updateDetailLog(`Mật khẩu không chính xác.`, log_id);
                return res.status(400).json({ message: "Mật khẩu không chính xác." })
            }

            const access_token = await JWTService.generateToken(user.id);
            const refresh_token = await JWTService.generateRefreshToken(user.id);

            const now = new Date();
            const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
            const is_login = await UserModel.updateUser({id: user.id, last_activity: vietnamTime.toISOString() });

            if (!is_login) {
                await LogModel.updateDetailLog(`Đăng nhập không thành công.`, log_id);
                return res.status(400).json({ message: "Đăng nhập không thành công, vui lòng thử lại." })
            }

            await LogModel.updateStatusLog(log_id);
            await LogModel.updateDetailLog(`Đăng nhập thành công.`, log_id);
            return res.status(200).json({ message: "Đăng nhập thành công", access_token: access_token, refresh_token: refresh_token })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // admin đăng nhập
    static async adminLogin(req, res) {
        try {
            const account = req.body.account; 

            const admin = await UserModel.getUserByUsernameOrPhoneNumber(account.username);
            // console.log(admin)
            if (!admin || admin.role_id == 2) {
                return res.status(400).json({ message: "Tài khoản không tồn tại." });
            }

            const log_id = await LogModel.createLog('Đăng nhập với tư cách quản trị viên', admin.id);
            const password = hashPassword(account.password);

            const old_password = await UserModel.getOldPassword(password, admin.id);
            
            if (old_password) {
                await LogModel.updateDetailLog(`Đăng nhập với mật khẩu cũ.`, log_id);
                return res.status(400).json({ message: `Bạn đã đăng nhập với mật khẩu cũ, đã được thay đổi vào ${ getLastChange(old_password.changed_at) }.` })
            }

            if (password != admin.password) {
                await LogModel.updateDetailLog(`Mật khẩu không chính xác.`, log_id);
                return res.status(400).json({ message: "Mật khẩu không chính xác." })
            }

            const access_token = await JWTService.generateToken(admin.id);
            const refresh_token = await JWTService.generateRefreshToken(admin.id);


            await LogModel.updateStatusLog(log_id);
            await LogModel.updateDetailLog(`Đăng nhập thành công.`, log_id);
            return res.status(200).json({ message: "Đăng nhập thành công", access_token: access_token, refresh_token: refresh_token })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // cập nhật thông tin cá nhân
    static async updateInfo(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = await LogModel.createLog(`info-update`, user_id);

            const info = req.body.info;

            if (info.date_of_birth) {
                // Chuyển đổi giá trị ngày sinh thành đối tượng Date
                const dateOfBirth = new Date(info.date_of_birth);
                
                // Tăng thêm một ngày
                dateOfBirth.setDate(dateOfBirth.getDate() + 1);
            
                // Cập nhật lại giá trị date_of_birth
                info.date_of_birth = dateOfBirth.toISOString().slice(0, 10); // Định dạng lại thành 'YYYY-MM-DD'
            }

            if (!info) {
                await LogModel.updateDetailLog('Không có dữ liệu.', log_id);
                return res.status(404).json({ message: 'Không có dữ liệu, vui lòng thử lại hoặc tải lại trang.' });
            }

            const user = await UserModel.getUserById(user_id);

            if (info.avatar_url == null) {
                info.avatar_url = user.avatar_url
            }

            info.id = user_id;
            const is_update = await UserModel.updateUser(info);

            if (!is_update) {
                await LogModel.updateDetailLog('Cập nhật không thành công.', log_id);
                return res.status(404).json({ message: 'Đã có lỗi xảy ra, vui lòng thử lại hoặc tải lại trang.' });
            }

            if (info.avatar_url != user.avatar_url) {
                deleteFileFromCloudinary(user.avatar_url);
            }

            const newInfo = await UserModel.getUserById(user_id);console.log(info, newInfo)
            newInfo.instructor = await UserModel.getInstructorByUserId(user_id);
            newInfo.identification = await UserModel.getInstructorIdentificationByUserId(user_id);

            await LogModel.updateDetailLog('Cập nhật thành công.', log_id);
            await LogModel.updateStatusLog(log_id);
            return res.status(200).json({ message: 'Cập nhật thành công.', newInfo: newInfo });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // cập nhật thông tin giảng dạy
    static async updateInstructor(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = await LogModel.createLog(`instructor-update`, user_id);

            const instructor = req.body.instructor;

            if (!instructor) {
                await LogModel.updateDetailLog('Không có dữ liệu.', log_id);
                return res.status(404).json({ message: 'Không có dữ liệu, vui lòng thử lại hoặc tải lại trang.' });
            }

            const userInstructor = await UserModel.getInstructorByUserId(user_id);

            if (instructor.teaching_certificate_url == null) {
                instructor.teaching_certificate_url = userInstructor.teaching_certificate_url
            }
            
            const is_update = await UserModel.updateInstructorByUser(user_id, instructor);

            if (!is_update) {
                await LogModel.updateDetailLog('Cập nhật không thành công.', log_id);
                return res.status(404).json({ message: 'Đã có lỗi xảy ra, vui lòng thử lại hoặc tải lại trang.' });
            }

            if (instructor.teaching_certificate_url != userInstructor.teaching_certificate_url) {
                deleteFileFromCloudinary(userInstructor.teaching_certificate_url);
            }

            const newInfo = await UserModel.getUserById(user_id);
            newInfo.instructor = await UserModel.getInstructorByUserId(user_id);
            newInfo.identification = await UserModel.getInstructorIdentificationByUserId(user_id);

            await LogModel.updateDetailLog('Cập nhật thành công.', log_id);
            await LogModel.updateStatusLog(log_id);
            return res.status(200).json({ message: 'Cập nhật thành công.', newInfo: newInfo });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // cập nhật thông tin định danh
    static async updateIdentification(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = await LogModel.createLog(`info-update`, user_id);

            const { instructor_identification } = req.body;

            if (!instructor_identification) {
                await LogModel.updateDetailLog('Không có dữ liệu.', log_id);
                return res.status(404).json({ message: 'Không có dữ liệu, vui lòng thử lại hoặc tải lại trang.' });
            }

            const user_identification = await UserModel.getInstructorIdentificationByUserId(user_id);

            if (instructor_identification.id_image_url == null) {
                instructor_identification.id_image_url = user_identification.id_image_url;
            }
            
            if (instructor_identification.id_image_with_person_url == null) {
                instructor_identification.id_image_with_person_url = user_identification.id_image_with_person_url;
            }

            const is_update = await UserModel.updateIdentificationByUser(user_id, instructor_identification);

            if (!is_update) {
                await LogModel.updateDetailLog('Cập nhật không thành công.', log_id);
                return res.status(404).json({ message: 'Đã có lỗi xảy ra, vui lòng thử lại hoặc tải lại trang.' });
            }

            if (instructor_identification.id_image_url !== user_identification.id_image_url) {
                deleteFileFromCloudinary(user_identification.id_image_url);
            }
            
            if (instructor_identification.id_image_with_person_url !== user_identification.id_image_with_person_url) {
                deleteFileFromCloudinary(user_identification.id_image_with_person_url);
            }

            const newInfo = await UserModel.getUserById(user_id);
            newInfo.instructor = await UserModel.getInstructorByUserId(user_id);
            newInfo.identification = await UserModel.getInstructorIdentificationByUserId(user_id);

            await LogModel.updateDetailLog('Cập nhật thành công.', log_id);
            await LogModel.updateStatusLog(log_id);
            return res.status(200).json({ message: 'Cập nhật thành công.', newInfo: newInfo });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // tạo access token mới
    static async refreshToken(req, res) {
        try {
            const user_id = req.user_id;

            const user = await UserModel.getUserById(user_id);
            
            if (!user) {
                return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." });
            }

            const now = new Date();
            const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
            const is_active = await UserModel.updateUser({ id: user_id, last_activity: vietnamTime.toISOString() });
            if (!is_active) {
                return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." });
            }

            const access_token = await JWTService.generateToken(user_id);

            return res.status(200).json({ access_token: access_token })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // thêm địa chỉ mới
    static async addNewAddress(req, res) {
        try {
            const user_id = req.user_id;

            const log_id = await LogModel.createLog('Thêm địa chỉ mới.', user_id);

            const address = req.body.address;
            
            const address_id = await UserModel.createAddress(address, user_id);
            
            if (!address_id) {
                await LogModel.updateDetailLog('Thêm địa chỉ mới không thành công.', log_id);

                return res.status(400).json({ message: 'Đã có lỗi xảy ra, vui lỏng thử lại hoặc tải lại trang.' });
            }

            const new_address = await UserModel.getAddressById(address_id);

            await LogModel.updateDetailLog('Thêm địa chỉ mới thành công.', log_id);
            await LogModel.updateStatusLog(log_id);
            return res.status(200).json({ new_address: new_address });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // Cập nhật địa chỉ
    static async updateAddress(req, res) {
        try {
            const user_id = req.user_id;
            const address = req.body.address;
            
            const log_id = await LogModel.createLog(`Cập nhật địa chỉ với ID: ${address.address_id}.`, user_id);

            const has_address = await UserModel.getAddressById(address.address_id);

            if (!has_address) {
                await LogModel.updateDetailLog('Không tìm thấy địa chỉ muốn cập nhật.', log_id);
                return res.status(404).json({ message: 'Không tìm thấy địa chỉ muốn cập nhật, vui lòng thử lại hoặc tải lại trang.' });
            }

            const is_update = await UserModel.updateAddress(address, user_id); 

            if (!is_update) {
                await LogModel.updateDetailLog('Cập nhật không thành công.', log_id);
                return res.status(404).json({ message: 'Đã có lỗi xảy ra, vui lòng thử lại hoặc tải lại trang.' });
            }

            await LogModel.updateDetailLog('Cập nhật địa chỉ thành công.', log_id);
            await LogModel.updateStatusLog(log_id);
            return res.status(200).json({ message: 'Cập nhật thành công.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // Xóa địa chỉ
    static async deleteAddress(req, res) {
        try {
            const address_id = req.body.address_id;
            const user_id = req.user_id; // Lấy user_id từ yêu cầu

            const log_id = await LogModel.createLog(`Xóa địa chỉ với ID: ${address_id}.`, user_id);

            const has_address = await UserModel.getAddressById(address_id);

            if (!has_address) {
                await LogModel.updateDetailLog('Không tìm thấy địa chỉ muốn xóa.', log_id);
                return res.status(404).json({ message: 'Không tìm thấy địa chỉ muốn xóa, vui lòng thử lại hoặc tải lại trang.' });
            }
            
            const is_deleted = await UserModel.deleteAddress(address_id, user_id); // Giả định bạn đã tạo hàm deleteAddress trong UserModel

            if (!is_deleted) {
                await LogModel.updateDetailLog('Không thành công: Địa chỉ không tồn tại hoặc không thuộc về người dùng này.', log_id);
                return res.status(404).json({ message: 'Không tìm thấy địa chỉ muốn xóa, vui lòng thử lại hoặc tải lại trang.' });
            }

            await LogModel.updateDetailLog('Xóa địa chỉ thành công.', log_id);
            await LogModel.updateStatusLog(log_id);
            return res.status(200).json({ message: 'Đã xóa địa chỉ.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
}

module.exports = UserController;