// set view
$(document).ready(async function() {
    $('.menu .main').removeClass('active');
    $('#system-exercise-management').addClass('active');
    
    activateMenuWhenReady('#system-exercise-management');

    // cập nhật topics nếu chưa có 
    if (!topics.length) {
        const response = await apiWithAccessToken('topics', 'GET')
        if (response && response.topics) {
            topics = response.topics;
            // Phát ra sự kiện tùy chỉnh 'topicsUpdated' sau khi topics đã được cập nhật
            $(document).trigger('topicsUpdated', [topics]);
        }
    }

    // lấy topic_id
    const url = window.location.href;
    const urlParams = new URLSearchParams(new URL(url).search);
    const topicId = urlParams.get('id');

    const response = await apiWithAccessToken(`/topic?topic_id=${ topicId }`);

    if (response && response.topic) {
        showDetailTopic(response.topic);

        const responseExercise = await apiWithAccessToken(`/topic-exercises?topic_id=${ topicId }`);

        if (responseExercise && responseExercise.exercises) {
            showTocpicExercises(responseExercise.exercises);
        }
    } else {
        showDetailTopic();
    }

    
});

function showDetailTopic(topic) {
    const $adminContainer = $('.admin__container');

    if (!topic.is_editable) {
        $adminContainer.addClass('topic-non-editable');
    }

    if (!topic) {
        $adminContainer.append(createAlertNotFoundComponent('Không tìm thấy chủ đề!'));

        return
    }

    // TODO: Hiển thị thông tin chủ đề
    {
        const programming_language_options = [
            { value: 'Multi', text: 'Đa ngôn ngữ', is_selected: 1 },
            { value: 'Cpp', text: 'C/C++', is_selected: 0 },
            { value: 'Java', text: 'Java', is_selected: 0 },
            { value: 'Pascal', text: 'Pascal', is_selected: 0 },
            { value: 'Python', text: 'Python', is_selected: 0 }
        ];
        const unlock_condition_type_options = [
            { value: 'none', text: 'Không yêu cầu', is_selected: 1 },
            { value: 'all', text: 'Hoàn thành tất cả các chủ đề được yêu cầu', is_selected: 0 },
            { value: 'any', text: 'Hoàn thành một trong các chủ đề được yêu cầu', is_selected: 0 },
            { value: 'single', text: 'Hoàn thành một chủ đề được yêu cầu', is_selected: 0 }
        ];
        function getProgrammingLanguageText(value) {
            const option = programming_language_options.find(opt => opt.value === value);
            return option ? option.text : value; // Trả về `value` nếu không tìm thấy giá trị
        }
        function getUnlockConditionTypeText(value) {
            const option = unlock_condition_type_options.find(opt => opt.value === value);
            return option ? option.text : value;
        }
        function createEditBtn() {
            if (topic.is_editable && permissions.some(p => p.id === 7)) {
                return `<a href="/admin/edit-system-exercise-topic?name=${ topic.name }&id=${ topic.id }" class="spa-action edit-btn action-btn">Chỉnh sửa</a>`
            }

            return ``;
        }
    }

    $adminContainer.append(`
        <div class="panel topic-info__container col full-width scale-up-ver-top">
            <div class="panel__header row flex-box item-center">
                <span>Thông tin chủ đề</span>
                <div>
                    ${ createEditBtn() }
                </div>
            </div>
            <div class="panel__body row gap-24">
                <div class="info__box col gap-8">
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Tên chủ đề:</strong></span>
                        </div>
                        <div class="content">
                            <span>${ topic.name }</span>
                        </div>
                    </div>
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Mô tả:</strong></span>
                        </div>
                        <div class="content">
                            <span>${ topic.description }</span>
                        </div>
                    </div>
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Tài liệu:</strong></span>
                        </div>
                        <div class="content">
                            <a href="${ topic.document_url }" target="_blank">Xem</a>
                        </div>
                    </div>
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Ngôn ngữ lập trình:</strong></span>
                        </div>
                        <div class="content">
                            <span>${ getProgrammingLanguageText(topic.programming_language) }</span>
                        </div>
                    </div>
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Điều kiện mở khóa:</strong></span>
                        </div>
                        <div class="content col gap-8">
                            <span>${ getUnlockConditionTypeText(topic.unlock_condition_type) }</span>
                        </div>
                    </div>
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Cấp độ:</strong></span>
                        </div>
                        <div class="content">
                            <span>${ topic.level }</span>
                        </div>
                    </div>
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Điều kiện hoàn thành:</strong></span>
                        </div>
                        <div class="content col">
                            <span>Số bài tập tối thiểu: ${ topic.min_required_exercises }</span>
                            <span>Số điểm tối thiểu: ${ topic.min_required_score }</span>
                        </div>
                    </div>
                    <div class="metadata row gap-16">
                        <p>Tạo bởi <strong>${ topic.created_by_username }</strong> vào lúc <strong>${ topic.created_at }</strong></p>
                        ${
                            topic.updated_by ? 
                            '<p>Cập nhật bởi <strong>' + topic.updated_by_username  + '</strong> vào lúc <strong>' + topic.updated_at + '</strong></p>'
                            :
                            '' 
                        }
                    </div>
                </div>
                <div class="preview">
                    <div class="topic-item preview" style="background-image: linear-gradient(
                                                                                            to bottom, 
                                                                                            rgba(0, 0, 0, 0.024) 0%, 
                                                                                            rgba(0, 0, 0, 0.174) 57%
                                                                                        ), url('${ topic.image_url || '/images/image.png' }');">
                        <div class="name">
                            <span>${ topic.name }</span>
                        </div>
                        <div class="description">
                            <span>${ topic.description }</span>
                        </div>
                        <div class="action">
                            <button>Bắt đầu</button>
                        </div>
                    </div>
                </div>
            </div>
        </div> 
    `);

    // TODO: Hiển thị thông tin tiến độ người dùng nếu có
    if (!topic.is_editable && topic.statistics) {
        const statistics = topic.statistics;

        $adminContainer.append(`
            <div class="topic-statistics__chart row gap-24">
                <div class="main-view__chart col gap-24">
                    <div class="user_progress__container panel full-width col slide-right" style="--slide-distance: 40px; --delay: 0.2s">
                        <div class="panel__header">
                            <span>Tiến Độ Của Người Dùng</span>
                        </div>
                        <div class="panel__body center">
                            <canvas id="user_progress" height="200" width="500"></canvas>
                        </div>
                    </div>
                    <div class="row gap-24">
                        <div class="panel col flex-1 slide-top" style="--slide-distance: 40px; --delay: 0.2s">
                            <div class="panel__body row gap-16 item-center">
                                <div class="image_icon center"><ion-icon name="cellular-outline"></ion-icon></div>
                                <div class="user_statistics col gap-8">
                                    <span class="statistics" id="totalTopicAccess">0</span>
                                    <span>Lượt truy cập chủ đề</span>
                                </div>
                            </div>
                            <div class="panel__footer row gap-4">
                                <span id="totalTopicCompleted">0</span>
                                <span>lượt hoàn thành chủ đề</span>
                            </div>
                        </div>
                        <div class="panel col flex-1 slide-top" style="--slide-distance: 40px; --delay: 0.4s">
                            <div class="panel__body row gap-16 item-center">
                                <div class="image_icon center"><ion-icon name="people-outline"></ion-icon></div>
                                <div class="user_statistics col gap-8">
                                    <span class="statistics" id="totalUserAccess">0</span>
                                    <span>Người dùng tham gia</span>
                                </div>
                            </div>
                            <div class="panel__footer row gap-4">
                                <span id="activeUserCount">0</span>
                                <span>người đang hoạt động</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="side__chart col gap-24">
                    <div class="total_exercises__container panel full-width col slide-left" style="--slide-distance: 40px; --delay: 0.4s">
                        <div class="panel__header">
                            <span>Số Lượng Bài Tập</span>
                        </div>
                        <div class="panel__body center col gap-16">
                            <div class="panel__nav row full-width">
                                <button class="easy" data-difficulty="easy">Dễ</button>
                                <button class="medium" data-difficulty="medium">Trung Bình</button>
                                <button class="hard" data-difficulty="hard">Khó</button>
                            </div>
                            <canvas id="total_exercises" height="200" width="500"></canvas>
                        </div>
                        <div class="panel__footer col gap-8">
                            <span>Số lượng bài tập được truy cập: <strong id="totalExerciseResults">0</strong></span>
                            <span>Số lần nộp bài trung bình: <strong id="averageExerciseSubmissions">0</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // * Biểu đồ thống kê tiến độ của người dùng trong 6 tháng gần đây
        // Lấy phần tử canvas bằng jQuery
        const user_process_ctx = $('#user_progress')[0].getContext('2d');

        // Sử dụng hàm để lấy 6 tháng gần đây
        const months = getLastSixMonths();
        new Chart(user_process_ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Lượt truy cập mới',
                    data: statistics.topicAccessCountsByMonthData,
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.4
                },
                {
                    label: 'Lượng người dùng đã hoàn thiện',
                    data: statistics.topicCompletionCountsByMonthData,
                    fill: false,
                    borderColor: 'rgb(0, 2, 92)',
                    tension: 0.4
                }]
            },
            options: {
                scales: {
                    y: {
                        min: 0  // Đảm bảo trục Y không có giá trị âm
                    }
                }
            }
        });

        // * Biểu đồ thống kê số lượng bài tập
        // Dữ liệu cho từng mức độ bài tập
        const exerciseData = statistics.total_exercises.reduce((acc, item) => {
            acc[item.level] = [item.code, item.multiple_choice];
            return acc;
        }, {});

        const total_exercises_ctx = $('#total_exercises')[0].getContext('2d');

        const exerciseChart = new Chart(total_exercises_ctx, {
            type: 'doughnut',
            data: {
                labels: ['Code', 'Trắc nghiệm'],
                datasets: [{
                    data: exerciseData.easy, // Bộ dữ liệu mặc định là "Dễ"
                    backgroundColor: ['#36A2EB', '#FF6384']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        $('.panel__nav button').click(function() {
            const difficulty = $(this).data('difficulty');
            
            // Cập nhật dữ liệu của biểu đồ dựa trên mức độ đã chọn
            exerciseChart.data.datasets[0].data = exerciseData[difficulty];
            
            // Cập nhật biểu đồ
            exerciseChart.update();
        });

        // Dữ liệu các phần tử và giá trị cần đếm
        const elementsData = [
            { elementId: '#activeUserCount', value: statistics.activeUserCount },
            { elementId: '#averageExerciseSubmissions', value: statistics.averageExerciseSubmissions },
            { elementId: '#totalExerciseResults', value: statistics.totalExerciseResults },
            { elementId: '#totalTopicAccess', value: statistics.totalTopicAccess },
            { elementId: '#totalTopicCompleted', value: statistics.totalTopicCompleted },
            { elementId: '#totalUserAccess', value: statistics.totalUserAccess },
        ];

        // Lặp qua các phần tử và tạo CountUp cho từng phần tử
        $.each(elementsData, function(index, data) {
            const $element = $(data.elementId);  // Sử dụng jQuery để chọn phần tử
            countUp($element[0], 0, data.value, 1000);  // 1s để đếm từ 0 đến data.value
        });
    }

    // TODO: Hiển thị danh sách bài tập của đề
    $adminContainer.append(`
        <div class="panel col full-width">
            <div class="panel__header row flex-box">
                <span>Danh sách bài tập</span>
                <div>
                    <a href="/admin/add-topic-exercise?topic_name=${ topic.name }&topic_id=${ topic.id }" class="spa-action action-btn add-btn">Thêm bài tập</a>
                </div>
            </div>
            <div class="panel__body exercise__container"></div>
        </div>
    `);
}

function showTocpicExercises(exercises) {
    $('.exercise__container').append(createListTopicExerciseComponent(exercises));
}