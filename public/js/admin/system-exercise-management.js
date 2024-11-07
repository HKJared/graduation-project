//set view
$(document).ready(async function() {
    $('.menu .main').removeClass('active');
    $('#system-exercise-management').addClass('active');
    
    activateMenuWhenReady('#system-exercise-management');

    if (!topics.length) {
        const response = await getTopics();
        if (response && response.topics) { console.log(response.topics)
            topics = response.topics;
            // Phát ra sự kiện tùy chỉnh 'topicsUpdated' sau khi topics đã được cập nhật
            $(document).trigger('topicsUpdated', [topics]);
        }
    }
            
    showTopics(topics);


    displayChart();
});

// xử lí sự kiện
$(document).ready(function() {

    // ? Bộ sự kiện thêm chủ đề mới
    $(document).on('click.wiseowlEvent', '.add-topic-btn', function(event) {
        event.stopPropagation();

        const $addTopicContainer = $('.add-topic__container');

        if ($addTopicContainer.find('.add-topic__box').length <= 0) {
            createAddTopicBox($addTopicContainer);
        }

        $addTopicContainer.addClass('show');
    });

    $(document).on('click.wiseowlEvent', '.add-topic__container .hide-btn', function(event) {
        event.stopPropagation();

        const $addTopicContainer = $('.add-topic__container');

        $addTopicContainer.removeClass('show')
    });

    $(document).on('input.wiseowlEvent', '#name', function () {
        const topicName = $(this).val();
        $('.topic-item .name span').text(topicName);
    });

    $(document).on('input.wiseowlEvent', '#description', function () {
        const topicDescription = $(this).val();
        $('.topic-item .description span').text(topicDescription);
    });

    $(document).on('change.wiseowlEvent', '#document_url', function() {
        var fileName = $(this)[0].files[0].name;
        if (fileName) {
            $('#file-name').text(fileName);
        } else {
            $('#file-name').text(''); 
        }
    });

    $(document).on('change.wiseowlEvent', '#unlock_condition_type', function () {
        // if (!topics.length) {
        //     // Gọi hàm showNotification để hiển thị thông báo
        //     showStackedNotification('Hiện tại không có chủ đề nào để yêu cầu điều kiện mở khóa.', 'err_unlock_condition_type');
            
        //     // Kích hoạt sự kiện click vào tùy chọn "Không yêu cầu"
        //     $('.unlock_condition_type__select .option__item[data-option-val="none"]').trigger('click');

        //     return
        // }

        if ($(this).attr('data-val') != 'none') {
            $('.topic_unlock_conditions').slideDown();
        } else {
            $('.topic_unlock_conditions').slideUp();
        }
    });

    $(document).on('change.wiseowlEvent', '#image_url', function(event) {
        const file = event.target.files[0]; // Lấy file được chọn
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Thay thế URL của background-image trong .topic-item
                $('.topic-item').css('background-image', `linear-gradient(
                                                                to bottom, 
                                                                rgba(0, 0, 0, 0.024) 0%, 
                                                                rgba(0, 0, 0, 0.174) 57%
                                                            ), url('${e.target.result}')`);
            };
    
            reader.readAsDataURL(file); // Đọc file và gọi onload
        }
    });

    $(document).on('click.wiseowlEvent', '.add-topic__container .cancel-btn', function(event) {
        event.stopPropagation();

        const $addTopicContainer = $('.add-topic__container');

        $addTopicContainer.removeClass('show');

        setTimeout(function() {    
            $addTopicContainer.find('.add-topic__box').remove();
        }, 1000);
    });

    $(document).on('click.wiseowlEvent', '.add-topic__container .submit-btn', async function(event) {
        event.stopPropagation();

        if (!checkTopicInfo()) {
            return
        }

        showConfirm('Xác nhận thêm chủ đề mới.', 'Xác nhận', async function(result) {
            if (result) {
                const newTopic = getTopicInfo();

                const formData = createFormData();

                const responseUrl = await upload(formData);

                if (!responseUrl) {
                    return
                }

                newTopic.image_url = responseUrl.image_url || null;
                newTopic.document_url = responseUrl.document_url;

                const response = await createTopic(newTopic);

                if (!response) {
                    return
                }

                showNotification(response.message);

                const $addTopicContainer = $('.add-topic__container');

                $addTopicContainer.removeClass('show');

                setTimeout(function() {    
                    $addTopicContainer.find('.add-topic__box').remove();
                }, 1000);
            }
        });
    });
});

// TODO: Tạo biểu đồ 
function displayChart() {
    // * Biểu đồ thống kê số lượng chủ đề
    // Lấy phần tử canvas bằng jQuery
    const topic_ctx = $('#total_topics')[0].getContext('2d');

    new Chart(topic_ctx, {
        type: 'bar',
        data: {
            labels: ['C/C++', 'Java', 'Pascal', 'Python', 'Multi'],
            datasets: [
                {
                label: 'Chủ đề đã hoàn thiện',
                data: [12, 19, 3, 5, 2, 3],
                borderWidth: 1
            },
            {
                label: 'Chủ đề đang chỉnh sửa',
                data: [2, 1, 1, 3, 2, 2],
                borderWidth: 1
            }
        ]
        },
        options: {
            scales: {
                x: {
                    stacked: true // xếp chồng các cột trên trục x
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });

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
                label: 'Chủ đề được truy cập',
                data: [65, 59, 80, 81, 56, 55, 40],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'Chủ đề đã hoàn thiện',
                data: [15, 53, 10, 2, 16, 25, 10],
                fill: false,
                borderColor: 'rgb(0, 2, 92)',
                tension: 0.1
            }]
        }
    });

    // * Biểu đồ thống kê số lượng bài tập
    // Dữ liệu cho từng mức độ bài tập
    const exerciseData = {
        easy: [30, 20],    // Dữ liệu cho bài tập Dễ [code, trắc nghiệm]
        medium: [40, 15],  // Dữ liệu cho bài tập Trung Bình [code, trắc nghiệm]
        hard: [25, 10]     // Dữ liệu cho bài tập Khó [code, trắc nghiệm]
    };

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
}

// TODO: Tạo nội dung mới cho form thêm chủ đề
function createAddTopicBox($addTopicContainer) {
    const programming_language_options = [
        { value: 'Multi', text: 'Đa ngôn ngữ', is_selected: 1 },
        { value: 'Cpp', text: 'C/C++', is_selected: 0 },
        { value: 'Java', text: 'Java', is_selected: 0 },
        { value: 'Pascal', text: 'Pascal', is_selected: 0 },
        { value: 'Python', text: 'Python', is_selected: 0 }
    ];

    const level_options = [
        { value: '1', text: 'Cấp độ 1', is_selected: 1 },
    ];

    const unlock_condition_type_options = [
        { value: 'none', text: 'Không yêu cầu', is_selected: 1 },
        { value: 'all', text: 'Hoàn thành tất cả các chủ đề được yêu cầu', is_selected: 0 },
        { value: 'any', text: 'Hoàn thành một trong các chủ đề được yêu cầu', is_selected: 0 },
        { value: 'single', text: 'Hoàn thành một chủ đề được yêu cầu', is_selected: 0 }
    ];

    const bonus_points_options = [
        { value: '50', text: '50 điểm', is_selected: 1 },
        { value: '80', text: '80 điểm', is_selected: 0 },
        { value: '100', text: '100 điểm', is_selected: 0 },
        { value: '120', text: '120 điểm', is_selected: 0 }
    ];

    $addTopicContainer.append(`
        <div class="add-topic__box">
            <div class="title full-width row flex-box">
                <h2>Thêm Chủ Đề Mới</h2>
                <button class="hide-btn" title="Ẩn"><ion-icon name="chevron-forward-circle-outline"></ion-icon></button>
            </div>
            <div class="body row gap-48">
                <div class="main__form col gap-16">
                    <div class="edit-row row gap-16">
                        <div class="col">
                            <label for="">Tên chủ đề</label>
                            <p>Tên chủ đề phải phù hợp với các bài tập sẽ thêm vào sau khi chủ đề được tạo.</p>
                            <div class="wo-input">
                                <input type="text" id="name">
                                <span class="char-count">0/50</span>
                            </div>
                        </div>
                    </div>
                    <div class="edit-row row gap-16">
                        <div class="col">
                            <label for="">Mô tả</label>
                            <p>Mô tả ngắn gọn nội dung, kiến thức mà chủ đề mang lại.</p>
                            <div class="wo-textarea">
                                <textarea name="" id="description"></textarea>
                                <span class="char-count">0/500</span>
                            </div>
                        </div>
                    </div>
                    <div class="edit-row row gap-16">
                        <div class="col">
                            <label for="">Tài liệu</label>
                            <p>Chủ đề cần có tài liệu đi kèm, chứa nội dung chi tiết về kiến thức mà chủ đề mang lại.</p>
                            <div class="change-document__action row gap-16 item-center">
                                <label for="document_url">Chọn tài liệu</label>
                                <input type="file" id="document_url" accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt">
                                <span id="file-name"></span>
                            </div>
                        </div>
                    </div>
                    <div class="edit-row row gap-16">
                        <div class="col">
                            <label for="">Ngôn ngữ lập trình chủ đề</label>
                            ${ createSelectComponent(programming_language_options, 'programming_language') }
                        </div>
                        <div class="col">
                            <label for="">Cấp độ</label>
                            ${ createSelectComponent(level_options, 'level') }
                        </div>
                    </div>
                    <div class="edit-row row gap-16">
                        <div class="col">
                            <label for="">Điều kiện mở khóa</label>
                            <p>Một chủ đề có thể bị khóa (Không thể thực hiện luyện tập) nếu chưa vượt qua một hoặc nhiều chủ đề khác.</p>
                            ${ createSelectComponent(unlock_condition_type_options, 'unlock_condition_type') }
                        </div>
                    </div>
                    <div class="edit-row row gap-16 topic_unlock_conditions" style="display: none;">
                        <div class="col relative">
                            <label for="">Danh sách chủ đề yêu cầu</label>
                            <div class="wo-input">
                                <input type="text" id="topic_unlock_conditions" placeholder="Nhập tên chủ đề">
                                <span><ion-icon name="search-outline"></ion-icon></span>
                            </div>
                            <div class="topic_unlock_conditions__list row gap-8 absolute">
                            </div>
                        </div>
                    </div>
                    <div class="edit-row row gap-16">
                        <div class="col">
                            <label for="">Điều kiện hoàn thành</label>
                            <div class="row gap-16 required_conditions">
                                <div class="col">
                                    <span class="sub-label">Tổng số bài tập tối thiểu</span>
                                    <div class="wo-input">
                                        <input type="number" min="5" value="5" id="min_required_exercises">
                                    </div>
                                </div>
                                <div class="col">
                                    <span class="sub-label">Tổng số điểm tối thiểu</span>
                                    <div class="wo-input">
                                        <input type="number" min="50" value="50" id="min_required_score">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="edit-row row gap-16">
                        <div class="col">
                            <label for="">Điểm thưởng khi hoàn thành</label>
                            ${ createSelectComponent(bonus_points_options, 'bonus_points') }
                        </div>
                        <div></div>
                    </div>
                </div>
                <div class="side__form">
                    <div class="sticky-top col gap-16">
                        <div class="topic-item" style="background-image: linear-gradient(
                                                                                            to bottom, 
                                                                                            rgba(0, 0, 0, 0.024) 0%, 
                                                                                            rgba(0, 0, 0, 0.174) 57%
                                                                                        ), url('/images/image.png');">
                            <div class="name">
                                <span></span>
                            </div>
                            <div class="description">
                                <span></span>
                            </div>
                            <div class="action">
                                <button>Bắt đầu</button>
                            </div>
                        </div>
                        <div class="center change-image__action">
                            <label for="image_url">Chọn ảnh</label>
                            <input type="file" id="image_url" accept="image/*">
                        </div>
                    </div>
                </div>
            </div>
            <div class="action row gap-16 center">
                <button class="cancel-btn">Hủy</button>
                <button class="submit-btn">Xác nhận</button>
            </div>
        </div> 
    `);
}

// TODO: Hiển thị danh sách chủ đề
function showTopics(topics) {

}

function showTopic(topic) {
    
}

// TODO: Kiểm tra tính hợp lệ của chủ đề mới
function checkTopicInfo() {
    if ($('#name').val() == '') {
        showStackedNotification('Tên chủ đề không được để trống.', 'err_name');

        $('#name').addClass('danger-border');

        return false
    }

    if ($('#description').val() == '') {
        showStackedNotification('Mô tả không được để trống.', 'err_des');

        $('#description').addClass('danger-border');

        return false
    }

    if ($('#document_url')[0].files.length == 0) {
        showStackedNotification('Vui lòng chọn file tài liệu.', 'err_doc');

        return false
    }

    return true
}

// TODO: Lấy ảnh để upload
function createFormData() {
    let formData = new FormData();

    if ($('#image_url')[0].files.length > 0) {
        formData.append('files', $('#image_url')[0].files[0]);
        formData.append('keys[]', `image_url`);
    }

    formData.append('files', $('#document_url')[0].files[0]);
    formData.append('keys[]', `document_url`);

    return formData;
}

// TODO: Lấy thông tin chủ đề mới trong form tạo
function getTopicInfo() {
    return {
        name: $('#name').val(),
        image_url: null,
        description: $('#description').val() || null,
        programming_language: $('#programming_language').attr('data-val'),
        level: parseInt($('#level').attr('data-val'), 10),
        unlock_condition_type: $('#unlock_condition_type').attr('data-val'),
        min_required_exercises: parseInt($('#min_required_exercises').val(), 10),
        min_required_score: parseInt($('#min_required_score').val(), 10),
        bonus_points: parseInt($('#bonus_points').attr('data-val'), 10),
    };
}

// TODO: Thêm chủ đề mới vào mảng chủ đề, cập nhật giao diện
function addTopicToArr(topic) {

}


// hàm gọi API
async function getTopics() {
    const token = localStorage.getItem('wiseowlAdminAccessToken');
    if (!token) {
        return null
    }

    try {
        const response = await fetch(`/api/admin/topics`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authentication": token
            }
        });

        const result = await response.json();

        if (!response.ok) {
            showNotification(result.message);
            throw new Error('Network response was not ok');
        }
        
        return result; 
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return [];
    }
}

async function createTopic(topic, topic_unlock_conditions) {
    const token = localStorage.getItem('wiseowlAdminAccessToken');
    if (!token) {
        return null
    }

    try {
        const response = await fetch(`/api/admin/topic`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "authentication": token
            },
            body: JSON.stringify({
                new_topic: topic,
                topic_unlock_conditions: topic_unlock_conditions
            })
        });

        const result = await response.json();

        if (!response.ok) {
            showNotification(result.message);
            throw new Error('Network response was not ok');
        }
        
        return result; 
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return [];
    }
}