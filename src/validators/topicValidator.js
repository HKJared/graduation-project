const ERROR_MESSAGES = {
    INVALID_NAME: "Tên không hợp lệ. Phải là một chuỗi không rỗng và tối đa 255 ký tự.",
    INVALID_DESCRIPTION: "Mô tả không hợp lệ. Độ dài tối đa là 1000 ký tự.",
    INVALID_PROGRAMMING_LANGUAGE: "Ngôn ngữ lập trình không hợp lệ. Các giá trị cho phép là Cpp, Java, Pascal, Python, Multi.",
    INVALID_UNLOCK_CONDITION_TYPE: "Loại điều kiện mở khóa không hợp lệ. Các giá trị cho phép là all, any, single, none.",
    INVALID_LEVEL: "Cấp độ không hợp lệ. Phải là số nguyên lớn hơn hoặc bằng 1.",
    INVALID_MIN_REQUIRED_EXERCISES: "Số bài tập yêu cầu tối thiểu không hợp lệ. Phải là số nguyên lớn hơn hoặc bằng 1.",
    INVALID_MIN_REQUIRED_SCORE: "Điểm yêu cầu tối thiểu không hợp lệ. Phải là số nguyên không âm.",
    INVALID_BONUS_POINTS: "Điểm thưởng không hợp lệ. Phải là số nguyên không âm."
};

// Kiểm tra name có tồn tại và độ dài tối đa là 255 ký tự
function isValidName(name) {
    return typeof name === 'string' && name.trim().length > 0 && name.length <= 255;
}

// Kiểm tra URL có đúng định dạng
function isValidUrl(url) {
    return typeof url === 'string' && (url === '');
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
    return Number.isInteger(bonusPoints) && bonusPoints >= 0;
}

// Hàm validate toàn bộ topic
function validateTopic(topic) {
    const errors = [];

    if (!isValidName(topic.name)) {
        errors.push(ERROR_MESSAGES.INVALID_NAME);
    }
    if (!isValidDescription(topic.description)) {
        errors.push(ERROR_MESSAGES.INVALID_DESCRIPTION);
    }
    if (!isValidProgrammingLanguage(topic.programming_language)) {
        errors.push(ERROR_MESSAGES.INVALID_PROGRAMMING_LANGUAGE);
    }
    if (!isValidUnlockConditionType(topic.unlock_condition_type)) {
        errors.push(ERROR_MESSAGES.INVALID_UNLOCK_CONDITION_TYPE);
    }
    if (!isValidLevel(topic.level)) {
        errors.push(ERROR_MESSAGES.INVALID_LEVEL);
    }
    if (!isValidMinRequiredExercises(topic.min_required_exercises)) {
        errors.push(ERROR_MESSAGES.INVALID_MIN_REQUIRED_EXERCISES);
    }
    if (!isValidMinRequiredScore(topic.min_required_score)) {
        errors.push(ERROR_MESSAGES.INVALID_MIN_REQUIRED_SCORE);
    }
    if (!isValidBonusPoints(topic.bonus_points)) {
        errors.push(ERROR_MESSAGES.INVALID_BONUS_POINTS);
    }

    return {
        isValid: errors.length === 0,
        errors: errors.join(' ')
    };
}

// Xuất các hàm và thông điệp lỗi để sử dụng ở các phần khác của dự án
module.exports = {
    ERROR_MESSAGES,
    isValidName,
    isValidUrl,
    isValidDescription,
    isValidProgrammingLanguage,
    isValidUnlockConditionType,
    isValidLevel,
    isValidMinRequiredExercises,
    isValidMinRequiredScore,
    isValidBonusPoints,
    validateTopic
};