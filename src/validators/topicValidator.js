// topicValidator.js

// Kiểm tra name có tồn tại và độ dài tối đa là 255 ký tự
function isValidName(name) {
    return typeof name === 'string' && name.trim().length > 0 && name.length <= 255;
}

// Kiểm tra URL có đúng định dạng
function isValidUrl(url) {
    const urlPattern = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}([\/\w\-]*)*\/?$/;
    return !url || (typeof url === 'string' && (url === '' || urlPattern.test(url)));
}

// Kiểm tra description có độ dài tối đa là 1000 ký tự
function isValidDescription(description) {
    return typeof description === 'string' && description.length <= 1000;
}

// Kiểm tra programming_language có thuộc danh sách cho phép
function isValidProgrammingLanguage(language) {
    const allowedLanguages = ['Cpp', 'Java', 'Pascal', 'Python', 'Multi'];
    return allowedLanguages.includes(language);
}

// Kiểm tra unlock_condition_type có thuộc danh sách cho phép
function isValidUnlockConditionType(conditionType) {
    const allowedConditions = ['all', 'any', 'single', 'none'];
    return allowedConditions.includes(conditionType);
}

// Kiểm tra level có phải là số nguyên lớn hơn hoặc bằng 1
function isValidLevel(level) {
    return Number.isInteger(level) && level >= 1;
}

// Kiểm tra min_required_exercises có phải là số nguyên lớn hơn hoặc bằng 1
function isValidMinRequiredExercises(minRequiredExercises) {
    return Number.isInteger(minRequiredExercises) && minRequiredExercises >= 1;
}

// Kiểm tra min_required_score có phải là số nguyên không âm
function isValidMinRequiredScore(minRequiredScore) {
    return Number.isInteger(minRequiredScore) && minRequiredScore >= 0;
}

// Kiểm tra bonus_points có phải là số nguyên không âm
function isValidBonusPoints(bonusPoints) {
    const parsedPoints = parseInt(bonusPoints, 10);
    return Number.isInteger(parsedPoints) && parsedPoints >= 0;
}

// Hàm validate toàn bộ topic
function validateTopic(topic) {
    const errors = [];

    if (!isValidName(topic.name)) {
        errors.push('Tên không hợp lệ. Phải là một chuỗi không rỗng và tối đa 255 ký tự.');
    }
    if (!isValidUrl(topic.image_url)) {
        errors.push('URL của ảnh không hợp lệ.');
    }
    if (!isValidDescription(topic.description)) {
        errors.push('Mô tả không hợp lệ. Độ dài tối đa là 1000 ký tự.');
    }
    if (!isValidProgrammingLanguage(topic.programming_language)) {
        errors.push('Ngôn ngữ lập trình không hợp lệ. Các giá trị cho phép là Cpp, Java, Pascal, Python, Multi.');
    }
    if (!isValidUnlockConditionType(topic.unlock_condition_type)) {
        errors.push('Loại điều kiện mở khóa không hợp lệ. Các giá trị cho phép là all, any, single.');
    }
    if (!isValidLevel(topic.level)) {
        errors.push('Cấp độ không hợp lệ. Phải là số nguyên lớn hơn hoặc bằng 1.');
    }
    if (!isValidMinRequiredExercises(topic.min_required_exercises)) {
        errors.push('Số bài tập yêu cầu tối thiểu không hợp lệ. Phải là số nguyên lớn hơn hoặc bằng 1.');
    }
    if (!isValidMinRequiredScore(topic.min_required_score)) {
        errors.push('Điểm yêu cầu tối thiểu không hợp lệ. Phải là số nguyên không âm.');
    }
    if (!isValidBonusPoints(topic.bonus_points)) {
        errors.push('Điểm thưởng không hợp lệ. Phải là số nguyên không âm.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    isValidName,
    isValidUrl,
    isValidDescription,
    isValidProgrammingLanguage,
    isValidUnlockConditionType,
    isValidLevel,
    isValidMinRequiredExercises,
    isValidMinRequiredScore,
    isValidBonusPoints,
    validateTopic,
};