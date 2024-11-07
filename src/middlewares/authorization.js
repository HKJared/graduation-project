const pool = require('../configs/connectDB');
const JWTService = require('../utils/jwtService');
const LogModel = require('../models/logModel');
const UserModel = require('../models/userModel');
const RoleModel = require('../models/roleModel');


function hasPermission(user_permissions, permissionName) {
    return user_permissions.some(permission => permission.name === permissionName);
}
  
// Middleware xác thực quyền
const authorize = async (req, res, permission, next) => {
    try {
        // Lấy token từ header của request
        const token = req.headers.authentication;

        let log_id;

        if (!token) {
            log_id = await LogModel.createLog(permission, 2);
            await LogModel.updateDetailLog('Không xác định được đối tượng thực hiện', log_id);
            return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" });
        }
        // Giải mã token
        const decoded = await JWTService.decodeToken(token);

        if (!decoded) {
            log_id = await LogModel.createLog(permission, 2);
            await LogModel.updateDetailLog('Mã xác thực hết hạn', log_id);
            return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" }); 
        }

        const user_id = decoded.user_id;
        
        log_id = await LogModel.createLog(permission, user_id);

        const user_disable = await UserModel.getCurrentDisableByUserId(user_id);
        
        if (user_disable) {
            await LogModel.updateDetailLog('Tài khoản đang bị vô hiệu hóa.', log_id);
            return res.status(401).json({ message: `Tài khoản đang bị vô hiệu hóa đến ${user_disable.disable_end}, hãy liên hệ với quản trị viên để được hỗ trợ.` });
        }

        const user = await UserModel.getUserById(user_id);
        
        const user_permissions = await RoleModel.getPermissionsByRoleId(user.role_id);
        
        if (hasPermission(user_permissions, permission)) {
            req.role = user.role_name;
            req.user_id = user_id;
            req.log_id = log_id;
            next(); // Người dùng có quyền
        } else {
            await LogModel.updateDetailLog('Tài khoản không được cấp quyền.', log_id);
            res.status(403).json({ message: 'Từ chối truy cập' }); // Người dùng không có quyền
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi từ phía server.' });
    }
};

module.exports = authorize;