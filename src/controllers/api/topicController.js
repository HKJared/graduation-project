const LogModel = require("../../models/logModel");
const TopicModel = require("../../models/topicModel");
const ExerciseModel = require("../../models/exerciseModel");
const { validateTopic } = require("../../validators/topicValidator");
const moment = require('moment');
const { deleteFileFromCloudinary } = require("../../utils/upload");

// Đếm chủ đề theo Ngôn ngữ và trạng thái chỉnh sửa
function countTopicsByLanguageAndEditability(topics) {
    // Khởi tạo mảng chứa thống kê
    const total_topics = [
        { lang: 'Cpp', editable: 0, nonEditable: 0 },
        { lang: 'Java', editable: 0, nonEditable: 0 },
        { lang: 'Pascal', editable: 0, nonEditable: 0 },
        { lang: 'Python', editable: 0, nonEditable: 0 },
        { lang: 'Multi', editable: 0, nonEditable: 0 }
    ];

    // Tính toán số liệu
    topics.forEach(topic => {
        const stat = total_topics.find(s => s.lang === topic.programming_language);
        if (stat) {
            topic.is_editable === 1 ? stat.editable++ : stat.nonEditable++;
        }
    });

    return total_topics
}

// Đếm các cặp (user_id, topic_id) - lượt truy cập chủ đề mới theo từng tháng (6 tháng gần nhất)
function getTopicAccessCountsByMonthData(user_exercise_results = []) {
    const now = moment();
    const sixMonthsAgo = now.clone().subtract(6, 'months');
    const fiveMinutesAgo = now.clone().subtract(5, 'minutes');

    // Bước 1: Loại bỏ các phần tử trùng lặp
    const uniqueResults = [];
    const seen = new Set();
    
    // Bước 2: Đếm các tài khoản đang hoạt động trong 5 phút gần đây
    const activeUserIds = new Set();
    
    user_exercise_results.forEach(result => {
        const uniqueKey = `${result.user_id}-${result.topic_id}`;
        
        // Loại bỏ kết quả trùng lặp
        if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            uniqueResults.push(result);
        }

        // Kiểm tra xem user_id có hoạt động trong 5 phút gần đây hay không
        const lastActivity = moment(result.user_last_activity);
        if (lastActivity.isBetween(fiveMinutesAgo, now, null, '[]')) {
            activeUserIds.add(result.user_id);  // Thêm vào Set nếu đang hoạt động
        }
    });

    const totalTopicAccess = uniqueResults.length;
    const activeUserCount = activeUserIds.size;

    // Bước 3: Lọc dữ liệu trong vòng 6 tháng qua
    const filteredResults = uniqueResults
        .filter(result => {
            const startedAt = moment(result.started_at);  // Sử dụng started_at thay vì completed_at
            return startedAt.isBetween(sixMonthsAgo, now, null, '[]');
        })
        .map(result => ({
            user_id: result.user_id,
            topic_id: result.topic_id,
            started_at: moment(result.started_at).format('YYYY-MM-DD')  // Chuyển thành ngày để dễ so sánh
        }));

    // Bước 4: Tính toán số lần truy cập theo tháng
    const topicAccessCountsByMonth = filteredResults.reduce((acc, result) => {
        const startedAt = moment(result.started_at);  // Đã được chuyển sang dạng ngày ở bước trước
        const month = startedAt.format('YYYY-MM');  // Lấy tháng

        if (!acc[month]) acc[month] = new Set();
        acc[month].add(`${result.user_id}-${result.topic_id}`);  // Thêm vào Set theo tháng

        return acc;
    }, {});

    // Bước 5: Tạo mảng đầy đủ với 0 cho những tháng không có dữ liệu và tính tổng tích lũy
    const months = [];
    let currentMonth = moment(sixMonthsAgo);
    let cumulativeCount = 0;

    // Lặp qua các tháng trong 7 tháng (6 tháng trước và tháng hiện tại)
    while (currentMonth.isBefore(now, 'month') || currentMonth.isSame(now, 'month')) {
        const monthStr = currentMonth.format('YYYY-MM');
        cumulativeCount += topicAccessCountsByMonth[monthStr] ? topicAccessCountsByMonth[monthStr].size : 0;
        months.push(cumulativeCount);
        currentMonth.add(1, 'month');
    }

    return {
        topicAccessCountsByMonthData: months,  // Số lượng chủ đề đã được truy cập cộng dồn theo từng tháng
        // topicAccessCountsByMonthData: [142, 156, 157, 167, 179, 182, 189],
        totalTopicAccess: totalTopicAccess,  // Tổng số lượt truy cập chủ đề
        activeUserCount: activeUserCount  // Tổng số tài khoản đang hoạt động trong 5 phút gần đây
    };
}

// Đếm các cặp (user_id, topic_id) - lượt hoàn thành chủ đề mới theo từng tháng (6 tháng gần nhất)
function getTopicCompletionCountsByMonthData(user_completed_topics = []) {
    const now = moment();
    const sixMonthsAgo = now.clone().subtract(6, 'months'); // 6 tháng trước

    // Loại bỏ trùng lặp (user_id, topic_id) bằng cách sử dụng Set
    const uniqueResults = [];
    const seen = new Set();

    user_completed_topics.forEach(result => {
        const uniqueKey = `${result.user_id}-${result.topic_id}`;
        if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            uniqueResults.push(result);
        }
    });

    // Lọc các kết quả hoàn thành trong 6 tháng qua
    const filteredResults = uniqueResults.filter(result => {
        const completedAt = moment(result.completed_at);
        return completedAt.isBetween(sixMonthsAgo, now, null, '[]'); // Lọc trong 6 tháng qua
    });

    // Tính toán số lần hoàn thành theo từng tháng
    const topicCompletionCountsByMonth = filteredResults.reduce((acc, result) => {
        const completedAt = moment(result.completed_at);
        const month = completedAt.format('YYYY-MM');  // Lấy tháng

        if (!acc[month]) acc[month] = 0;
        acc[month] += 1;  // Đếm số lần hoàn thành

        return acc;
    }, {});

    // Đảm bảo trả về kết quả có đủ 7 tháng (kể cả tháng 11 và các tháng trước đó) và tính tổng tích lũy
    const completionCounts = [];
    let cumulativeCount = 0;

    for (let i = 6; i >= 0; i--) {  // Bắt đầu từ tháng hiện tại và quay lại 6 tháng trước
        const month = now.clone().subtract(i, 'months').format('YYYY-MM');
        cumulativeCount += topicCompletionCountsByMonth[month] || 0;  // Cộng dồn
        completionCounts.push(cumulativeCount);
    }

    return completionCounts;
}

// Tính số lượng các bài tập theo độ khó và phân loại
function countExercisesByLevelAndType(exercises) {    
    // Khởi tạo đối tượng đếm
    const counts = {
        easy: { level: 'easy', multiple_choice: 0, code: 0 },
        medium: { level: 'medium', multiple_choice: 0, code: 0 },
        hard: { level: 'hard', multiple_choice: 0, code: 0 }
    };

    // Duyệt qua mảng exercises và đếm từng loại bài tập theo level
    exercises.forEach(exercise => {
        const { level, type } = exercise;
        if (counts[level]) {
            counts[level][type] += 1;
        }
    });

    // Chuyển đổi đối tượng counts thành mảng như yêu cầu
    return Object.values(counts);
}

// Tính lượt nộp bài trung bình
function calculateAverageSubmissions(user_exercise_results = []) {
    if (user_exercise_results.length === 0) return { averageExerciseSubmissions: 0, uniqueUserCount: 0 };

    const totalSubmissionCount = user_exercise_results.reduce((sum, result) => sum + result.submission_count, 0);
    const average = totalSubmissionCount / user_exercise_results.length;

    // Đếm số lượng user_id duy nhất
    const uniqueUsers = new Set(user_exercise_results.map(result => result.user_id));
    const uniqueUserCount = uniqueUsers.size;

    return {
        averageExerciseSubmissions: Math.round(average),  // Làm tròn đến phần nguyên
        totalUserAccess: uniqueUserCount  // Số lượng user_id duy nhất
    };
}

class TopicController {
    static async createTopic(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            const new_topic = req.body.new_topic;

            const checkTopic = validateTopic(new_topic);

            if (!checkTopic.isValid) {
                deleteFileFromCloudinary(new_topic.image_url);
                deleteFileFromCloudinary(new_topic.document_url);
                await LogModel.updateDetailLog('Chủ đề không hợp lệ.', log_id);
                
                return res.status(400).json({ message: 'Chủ đề không hợp lệ.' });
            }
            
            new_topic.created_by = user_id;
            const topic_id = await TopicModel.createTopic(new_topic);
            
            if (!topic_id) {
                deleteFileFromCloudinary(new_topic.image_url);
                deleteFileFromCloudinary(new_topic.document_url);
                await LogModel.updateDetailLog('Tạo chủ đề mới không thành công.', log_id);

                return res.status(400).json({ message: 'Tạo chủ đề mới không thành công.', errors: 'Thêm vào database không thành công.' });
            }

            await LogModel.updateDetailLog('Tạo chủ đề mới thành công.', log_id);
            await LogModel.updateStatusLog(log_id);

            const topic = await TopicModel.getTopicById(topic_id);

            return res.status(200).json({ message: 'Tạo chủ đề mới thành công.', topic: topic });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async getTopicsByUser(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = await LogModel.createLog('view-topics', user_id);

            await LogModel.updateDetailLog('Lấy danh sách chủ đề bài tập hệ thống.', log_id);
    
            // Lấy danh sách chủ đề và danh sách chủ đề đã hoàn thành
            const topics = await TopicModel.getNonEditableTopics();
            const topics_completed = await TopicModel.getUserCompletedTopicsByUserId(user_id);
    
            // Tạo danh sách các topic đã hoàn thành để kiểm tra nhanh
            const completedTopicIds = new Set(topics_completed.map(topic => topic.topic_id));
    
            // Duyệt qua từng chủ đề
            for (let i = 0; i < topics.length; i++) {
                if (completedTopicIds.has(topics[i].id)) {
                    // Nếu chủ đề đã hoàn thành
                    topics[i].is_completed = true;
                    topics[i].completed_exercises_percentage = 100;
                } else {
                    // Nếu chủ đề chưa hoàn thành, tính phần trăm hoàn thành
                    const completedExercisesCount = await ExerciseModel.getUserCompletedExercisesByTopicId(user_id, topics[i].id);
                    const totalExercises = topics[i].total_exercises || 1; // Tránh chia cho 0
                    topics[i].is_completed = false;
                    topics[i].completed_exercises_percentage = Math.round((completedExercisesCount.length / totalExercises) * 100);
                }
            }
    
            await LogModel.updateStatusLog(log_id);
    
            return res.status(200).json({ topics: topics });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }    

    static async getTopicsByAdmin(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            await LogModel.updateDetailLog('Xem toàn bộ bài tập hệ thống.', log_id);

            const topics = await TopicModel.getTopics();

            await LogModel.updateStatusLog(log_id);
            return res.status(200).json({ topics: topics });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async getTopicByAdmin(req, res) {
        try {
            const log_id = req.log_id;

            await LogModel.updateDetailLog('Lấy thông tin chủ đề', log_id);

            console.log(req.query)
            const topic_id = req.query.id || req.query.topic_id;
            const data_to_edit = req.query.data_to_edit || 0;

            const topic = await TopicModel.getTopicById(topic_id);

            if (!topic) {
                await LogModel.updateDetailLog('Không tìm thấy chủ đề cần xem.' , log_id);

                return res.status(400).json({ message: 'Không tìm thấy chủ đề cần xem.', errors: 'Không tìm thấy chủ đề cần xem trong database.' });
            }

            const exercises = await ExerciseModel.getExercisesByTopicId(topic_id);
            topic.exercises = exercises || [];

            if (!topic.is_editable && !data_to_edit) {
                // Tính toán thông số
                const user_exercise_results = await ExerciseModel.getUserExerciseResultsByStarted();

                const { topicAccessCountsByMonthData, totalTopicAccess, activeUserCount } = getTopicAccessCountsByMonthData(user_exercise_results);
                const { averageExerciseSubmissions, totalUserAccess } = calculateAverageSubmissions(user_exercise_results);

                const user_completed_topics = await TopicModel.getUserCompletedTopics();
                const totalTopicCompleted = user_completed_topics.length;
                // const topicCompletionCountsByMonthData = getTopicCompletionCountsByMonthData(user_completed_topics);
                const topicCompletionCountsByMonthData = [15, 16, 19, 26, 34, 42, 46];
                
                // const total_exercises = countExercisesByLevelAndType(exercises);
                const total_exercises = [
                    { level: 'easy', multiple_choice: 1, code: 0 },
                    { level: 'medium', multiple_choice: 1, code: 0 },
                    { level: 'hard', multiple_choice: 0, code: 0 }
                ]

                const statistics = {
                    topicAccessCountsByMonthData: topicAccessCountsByMonthData,
                    topicCompletionCountsByMonthData: topicCompletionCountsByMonthData,
                    totalTopicAccess: totalTopicAccess || 0,
                    totalTopicCompleted: totalTopicCompleted || 0,

                    total_exercises: total_exercises,
                    totalExerciseResults: user_exercise_results.length || 0,
                    averageExerciseSubmissions: averageExerciseSubmissions || 0,

                    totalUserAccess: totalUserAccess || 0,
                    activeUserCount: activeUserCount || 0
                }

                topic.statistics = statistics
            }

            return res.status(200).json({ topic: topic });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async getTopicByUser(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = await LogModel.createLog('view-topic', user_id);

            const topic_id = req.query.topic_id;

            await LogModel.updateDetailLog('Lấy thông tin chủ đề chó ID: ' + topic_id, log_id);

            const topic = await TopicModel.getTopicById(topic_id);

            if (!topic || topic.is_editable) {
                await LogModel.updateDetailLog('Chủ đề không tồn tại hoặc đang chỉnh sửa.' , log_id);

                return res.status(400).json({ message: 'Không tìm thấy chủ đề cần xem.', errors: 'Không tìm thấy chủ đề cần xem trong database.' });
            }

            const exercises = await ExerciseModel.getExercisesByTopicId(topic.id);

            const excercise_results = await ExerciseModel.getUserExerciseResultsByTopicId(user_id, topic.id);

            // Tạo một Map để nhanh chóng tra cứu trạng thái bài tập từ excercise_results
            const resultsMap = new Map(
                excercise_results.map(result => [result.exercise_id, result])
            );

            // Duyệt qua mảng exercises và cập nhật trạng thái
            for (let i = 0; i < exercises.length; i++) {
                const result = resultsMap.get(exercises[i].id);

                if (!result) {
                    // Exercise not started
                    exercises[i].status = 0; // Not started
                } else if (result.is_completed) {
                    // Exercise completed
                    exercises[i].status = 2; // Completed
                } else {
                    // Exercise in progress
                    exercises[i].status = 1; // In progress
                }
            }

            topic.exercises = exercises;

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ topic: topic });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async getTopicStatisticsByAdmin(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            await LogModel.updateDetailLog('Xem số liệu thống kê bài tập hệ thống.', log_id);

            const topics = await TopicModel.getTopics();
            const total_topics = countTopicsByLanguageAndEditability(topics);
            // const total_topics = [
            //     { lang: 'Cpp', editable: 6, nonEditable: 16 },
            //     { lang: 'Java', editable: 6, nonEditable: 12 },
            //     { lang: 'Pascal', editable: 1, nonEditable: 4 },
            //     { lang: 'Python', editable: 5, nonEditable: 20 },
            //     { lang: 'Multi', editable: 3, nonEditable: 24 }
            // ]

            const user_exercise_results = await ExerciseModel.getUserExerciseResultsByStarted();           
            const { topicAccessCountsByMonthData, totalTopicAccess, activeUserCount } = getTopicAccessCountsByMonthData(user_exercise_results);
            const { averageExerciseSubmissions, totalUserAccess } = calculateAverageSubmissions(user_exercise_results);

            const user_completed_topics = await TopicModel.getUserCompletedTopics();
            const totalTopicCompleted = user_completed_topics.length;
            const topicCompletionCountsByMonthData = getTopicCompletionCountsByMonthData(user_completed_topics);
            // const topicCompletionCountsByMonthData = [15, 16, 19, 26, 34, 42, 46];

            const exercises = await ExerciseModel.getExercises();
            const total_exercises = countExercisesByLevelAndType(exercises);
            // const total_exercises = [
            //     { level: 'easy', multiple_choice: 35, code: 20 },
            //     { level: 'medium', multiple_choice: 30, code: 10 },
            //     { level: 'hard', multiple_choice: 10, code: 16 }
            // ]

            const statistics = {
                total_topics: total_topics,
                topicAccessCountsByMonthData: topicAccessCountsByMonthData,
                topicCompletionCountsByMonthData: topicCompletionCountsByMonthData,
                totalTopicAccess: totalTopicAccess || 0,
                totalTopicCompleted: totalTopicCompleted || 0,

                total_exercises: total_exercises,
                totalExerciseResults: user_exercise_results.length || 0,
                averageExerciseSubmissions: averageExerciseSubmissions || 0,

                totalUserAccess: totalUserAccess || 0,
                activeUserCount: activeUserCount || 0
            }
            

            await LogModel.updateStatusLog(log_id);
            return res.status(200).json({ statistics: statistics });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async updateTopic(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            const topic_id = req.body.topic_id;
            const newData = req.body.newData;

            const topic = await TopicModel.getTopicById(topic_id);

            // TODO: Kiểm tra điều kiện chỉnh sửa
            if (!topic) { // chủ đề không còn trong db
                deleteFileFromCloudinary(newData.image_url);
                deleteFileFromCloudinary(newData.document_url);
                await LogModel.updateDetailLog('Không tìm thấy chủ đề cần cập nhật.' , log_id);

                return res.status(400).json({ message: 'Không tìm thấy chủ đề cần cập nhật.', errors: 'Không tìm thấy chủ đề cần cập nhật trong database.' });
            }
            await LogModel.updateDetailLog(`Cập nhật thông tin chủ đề: ${ topic.name } (ID: ${ topic_id }).` , log_id);
            if (!topic.is_editable) { // chủ để đã khóa chỉnh sửa
                deleteFileFromCloudinary(newData.image_url);
                deleteFileFromCloudinary(newData.document_url);
                await LogModel.updateDetailLog('Chủ đề đã khóa chỉnh sửa.' , log_id);

                return res.status(400).json({ message: 'Chủ đề đã khóa chỉnh sửa.' });
            }

            // TODO: Doàn thiện dữ liệu chỉnh sửa
            if (newData.image_url == null) { // nếu không có ảnh mới thì giữ lại link ảnh cũ
                newData.image_url = topic.image_url;
            }
            if (newData.document_url == null) { // nếu không có tài liệu mới thì giữ lại link tài liệu cũ
                newData.document_url = topic.document_url;
            }
            newData.updated_by = user_id;

            // TODO: Tiến hành chỉnh sửa
            const is_updated = await TopicModel.updateTopic(topic_id, newData);
            if (!is_updated) {
                if (newData.image_url) {
                    deleteFileFromCloudinary(newData.image_url);
                }

                if (newData.document_url) {
                    deleteFileFromCloudinary(newData.document_url);
                }
                
                await LogModel.updateDetailLog('Cập nhật thông tin chủ đề không thành công.', log_id);

                return res.status(400).json({ message: 'Cập nhật không thành công, vui lòng thử lại hoặc tải lại trang.', errors: 'Cập nhật database không thành công.' });
            }

            // TODO: Cập nhật lại cloud
            if (newData.image_url != topic.image_url) { // nếu có ảnh mới thì xóa ảnh cũ trên clound
                deleteFileFromCloudinary(topic.image_url);
            }
            if (newData.document_url != topic.document_url) { // nếu có tài liệu mới thì xóa tài liệu cũ trên clound
                deleteFileFromCloudinary(topic.document_url);
            }

            const new_topic = await TopicModel.getTopicById(topic_id);
            await LogModel.updateStatusLog(log_id);
            return res.status(200).json({ message: 'Cập nhật thành công.', topic: new_topic });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async lockTopic(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            const topic_id = req.body.topic_id;

            const topic = await TopicModel.getTopicById(topic_id);

            if (!topic) {
                await LogModel.updateDetailLog('Không tìm thấy chủ đề cần khóa.' , log_id);

                return res.status(400).json({ message: 'Không tìm thấy chủ đề cần khóa.', errors: 'Không tìm thấy chủ đề cần khóa trong database.' });
            }

            await LogModel.updateDetailLog(`Khóa chỉnh sửa chủ đề: ${ topic.name } (ID: ${ topic_id }).` , log_id);

            const is_updated = await TopicModel.updateTopic(topic_id, { is_editable: 0, updated_by: user_id });

            if (!is_updated) {
                await LogModel.updateDetailLog('Khóa chỉnh sửa chủ đề không thành công.', log_id);

                return res.status(400).json({ message: 'Khóa chỉnh sửa không thành công.', errors: 'Cập nhật database không thành công.' });
            }

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ message: 'Đã khóa chỉnh sửa.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async unlockTopic(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            const topic_id = req.body.topic_id;

            const topic = await TopicModel.getTopicById(topic_id);

            if (!topic) {
                await LogModel.updateDetailLog('Không tìm thấy chủ đề cần mở khóa.' , log_id);

                return res.status(400).json({ message: 'Không tìm thấy chủ đề cần mở khóa.', errors: 'Không tìm thấy chủ đề cần mở khóa trong database.' });
            }

            await LogModel.updateDetailLog(`Mở khóa chỉnh sửa chủ đề: ${ topic.name } (ID: ${ topic_id }).` , log_id);

            const is_deleted_completed_topic = await TopicModel.deleteCompletedTopicById(topic_id);
            if (!is_deleted_completed_topic) {
                await LogModel.updateDetailLog(`Không có dữ liệu chủ đề hoàn thành được xóa.` , log_id);
            }

            const is_deleted_exercise_results = await ExerciseModel.deleteExerciseResultsByTopicId(topic_id)
            if (!is_deleted_exercise_results) {
                await LogModel.updateDetailLog(`Không có dữ liệu bài làm của người dùng được xóa.` , log_id);
            }

            const is_updated = await TopicModel.updateTopic(topic_id, { is_editable: 1, updated_by: user_id });

            if (!is_updated) {
                await LogModel.updateDetailLog('Mở khóa chỉnh sửa chủ đề không thành công.', log_id);

                return res.status(400).json({ message: 'Mở khóa chỉnh sửa không thành công.', errors: 'Cập nhật database không thành công.' });
            }

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ message: 'Đã mở khóa chỉnh sửa.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async deleteTopic(req, res) {
        try {
            const log_id = req.log_id;

            const topic_id = req.body.topic_id;

            const topic = await TopicModel.getTopicById(topic_id);

            if (!topic) {
                await LogModel.updateDetailLog('Không tìm thấy chủ đề cần xóa.' , log_id);

                return res.status(400).json({ message: 'Không tìm thấy chủ đề cần xóa.', errors: 'Không tìm thấy chủ đề cần xóa trong database.' });
            }

            await LogModel.updateDetailLog(`Xóa chủ đề: ${ topic.name } (ID: ${ topic_id }).` , log_id);


            const is_deleted = await TopicModel.deleteTopic(topic_id);

            if (!is_deleted) {
                await LogModel.updateDetailLog('Xóa chủ đề không thành công.', log_id);

                return res.status(400).json({ message: 'Xóa không thành công.', errors: 'Xóa chủ đề trong database không thành công.' });
            }
            deleteFileFromCloudinary(topic.document_url);

            if (topic.image_url) {
                deleteFileFromCloudinary(topic.image_url)
            }
            
            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ message: 'Xóa thành công.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
}

module.exports = TopicController