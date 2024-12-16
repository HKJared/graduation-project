// Các thông điệp lỗi
const ERROR_MESSAGES = {
    INVALID_TOPIC_ID: 'Không có ID chủ đề được cung cấp.',
    INVALID_TITLE: "Tiêu đề bài tập không hợp lệ.",
    INVALID_DESCRIPTION: "Mô tả không hợp lệ, phải có ít nhất 100 ký tự.",
    INVALID_BONUS_SCORES: "Điểm thưởng phải là một số nguyên không âm."
};

// Kiểm tra ID chủ đề hợp lệ
function isValidTopicId(topicId) {
    return typeof topicId === 'number' && topicId > 0;
}

// Kiểm tra tiêu đề bài tập
function isValidTitle(title) {
    return typeof title === 'string' && title.trim().length > 0;
}

// Kiểm tra mô tả bài tập
function isValidDescription(description) {
    return typeof description === 'string' && description.trim().length >= 100;
}

// Kiểm tra điểm thưởng
function isValidBonusScores(bonusScores) {
    return Number.isInteger(bonusScores) && bonusScores >= 0;
}

function validateExerciseData(exercise) {
    const errors = [];

    // Kiểm tra ID chủ đề
    if (!isValidTopicId(exercise.topic_id)) {
        errors.push(ERROR_MESSAGES.INVALID_TOPIC_ID);
    }

    // Kiểm tra tiêu đề
    if (!isValidTitle(exercise.title)) {
        errors.push(ERROR_MESSAGES.INVALID_TITLE);
    }

    // Kiểm tra mô tả
    if (!isValidDescription(exercise.description)) {
        errors.push(ERROR_MESSAGES.INVALID_DESCRIPTION);
    }

    // Kiểm tra điểm thưởng
    if (!isValidBonusScores(exercise.bonus_scores)) {
        errors.push(ERROR_MESSAGES.INVALID_BONUS_SCORES);
    }

    return {
        isValid: errors.length === 0,
        errors: errors.join(' ')
    };
}

module.exports = {
    validateExerciseData
};