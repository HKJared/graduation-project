//set view
$(document).ready(async function() {
    $('.menu .main').removeClass('active');
    $('#system-exercise-management').addClass('active');
    
    activateMenuWhenReady('#system-exercise-management');

    const response = await apiWithAccessToken('topic-statistics', 'GET');
    if (response && response.statistics) {
        displayChart(response.statistics);
    }

    if (!topics.length) {
        const response = await apiWithAccessToken('topics', 'GET')
        if (response && response.topics) {
            topics = response.topics;
            // Phát ra sự kiện tùy chỉnh 'topicsUpdated' sau khi topics đã được cập nhật
            $(document).trigger('topicsUpdated', [topics]);
        }
    }
            
    showTopics(topics);
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
        $('.topic-item.preview .name span').text(topicName);
    });

    $(document).on('input.wiseowlEvent', '#description', function () {
        const topicDescription = $(this).val();
        $('.topic-item.preview .description span').text(topicDescription);
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
                $('.topic-item.preview').css('background-image', `linear-gradient(
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

    $(document).on('click.wiseowlEvent', '.add-topic__container .submit-btn', function(event) {
        event.stopPropagation();

        if (!checkTopicInfo()) {
            return
        }

        showConfirm('Xác nhận thêm chủ đề mới.', 'Xác nhận', function(result) {
            if (result) {
                createTopic();
            }
        });
    });

    // ? Bộ sự kiện thao tác với chủ đề
    $(document).on('click.wiseowlEvent', '.topic-item .delete-topic-btn', function(event) {
        event.stopPropagation();

        const topic_id = $(this).attr('data-topic-id');

        showConfirm('Xác nhận xóa chủ đề.', 'Xác nhận', function(result) {
            if (result) {
                deleteTopic(topic_id)
            }
        });
    });

    $(document).on('click.wiseowlEvent', '.topic-item .lock-topic-btn', function(event) {
        event.stopPropagation();

        const topic_id = $(this).attr('data-topic-id');

        showConfirmWithNotice('Xác nhận khóa chỉnh sửa chủ đề.', 'Xác nhận', 'Khóa chỉnh sửa đồng nghĩa với việc chủ đề này sẽ được hiển thị ở phía người dùng', function(result) {
            if (result) {
                lockTopic(topic_id)
            }
        });
    });

    $(document).on('click.wiseowlEvent', '.topic-item .unlock-topic-btn', function(event) {
        event.stopPropagation();

        const topic_id = $(this).attr('data-topic-id');

        showConfirmWithNotice('Xác nhận  mở khóa chỉnh sửa chủ đề.', 'Xác nhận', 'Mở khóa chỉnh sửa đồng nghĩa với việc chủ đề này sẽ không còn hiển thị ở phía người dùng và dữ liệu bài làm của người dùng sẽ được xóa toàn bộ.', function(result) {
            if (result) {
                unlockTopic(topic_id)
            }
        });
    });
});

// TODO: Tạo biểu đồ 
function displayChart(statistics) {
    // * Biểu đồ thống kê số lượng chủ đề
    // Lấy phần tử canvas bằng jQuery
    const topic_ctx = $('#total_topics')[0].getContext('2d');

    new Chart(topic_ctx, {
        type: 'bar',
        data: {
            labels: statistics.total_topics.map(item => item.lang),
            datasets: [
                {
                label: 'Chủ đề đã hoàn thiện',
                data: statistics.total_topics.map(item => item.nonEditable),
                borderWidth: 1
            },
            {
                label: 'Chủ đề đang chỉnh sửa',
                data: statistics.total_topics.map(item => item.editable),
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
                data: statistics.topicAccessCountsByMonthData,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.4
            },
            {
                label: 'Chủ đề đã hoàn thiện',
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

// TODO: Tạo nội dung mới cho form thêm chủ đề
function createAddTopicBox($addTopicContainer) {
    const programming_language_options = [
        { value: 'Multi', text: 'Đa ngôn ngữ', is_selected: 1 },
        { value: 'Cpp', text: 'C/C++', is_selected: 0 },
        { value: 'Java', text: 'Java', is_selected: 0 },
        { value: 'Pascal', text: 'Pascal', is_selected: 0 },
        { value: 'Python', text: 'Python', is_selected: 0 }
    ];

    function createLevelOptions(topics) {
        // Tìm level cao nhất trong topics
        let maxLevel = topics.length ? Math.max(...topics.map(topic => topic.level)) : 0;

        // Tạo level options từ 1 đến maxLevel + 1
        const level_options = [];
    
        for (let level = 1; level <= maxLevel + 1; level++) {
            level_options.push({
                value: level.toString(),
                text: `Cấp độ ${level}`,
                is_selected: level === 1 ? 1 : 0  // Chọn Cấp độ 1 mặc định
            });
        }
    
        return level_options;
    }

    const level_options = createLevelOptions(topics);

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
                        <div class="topic-item preview" style="background-image: linear-gradient(
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
    $('.topic_list__container .panel__body').append(createListTopicComponent(topics))
}

// TODO: Tạo chủ đề mới
async function createTopic() {
    const newTopic = getTopicInfo();

    const formData = createFormData();

    const responseUrl = await upload(formData);

    if (!responseUrl) {
        return
    }

    newTopic.image_url = responseUrl.image_url || null;
    newTopic.document_url = responseUrl.document_url;

    const response = await apiWithAccessToken('topic', 'POST', { new_topic: newTopic });

    if (!response) {
        return
    }

    showNotification(response.message);
    showTopic(response.topic)

    const $addTopicContainer = $('.add-topic__container');

    $addTopicContainer.removeClass('show');

    setTimeout(function() {    
        $addTopicContainer.find('.add-topic__box').remove();
    }, 1000);
}

// TODO: Hiển thị chủ đề mới
function showTopic(topic) {
    const levelId = `#level_${topic.level}`;
    
    // Kiểm tra xem cấp độ đã tồn tại chưa, nếu chưa thì tạo mới
    let levelContainer = $(levelId);
    if (levelContainer.length === 0) {
        levelContainer = $(`
            <div class="level_container col gap-16" id="level_${topic.level}">
                <div class="level_title">Cấp độ ${topic.level}</div>
                <div class="level_topic_list">
                </div>
            </div>
        `);
        
        // Thêm cấp độ vào cuối danh sách
        $('.topic-list').append(levelContainer);
    }

    // Thêm topicItem vào level_topic_list
    levelContainer.find('.level_topic_list').append(createTopicComponent(topic));
}

// TODO: Khóa chỉnh sửa chủ đề
async function lockTopic(topic_id) {
    const response = await apiWithAccessToken('lock-topic', 'PUT', { topic_id: topic_id });

    if (!response) {
        return;
    }

    showNotification(response.message);

    const topicIndex = topics.findIndex(topic => topic.id == topic_id);

    if (topicIndex !== -1) {
        // Cập nhật is_editable của chủ đề
        topics[topicIndex].is_editable = 0;
    }

    $(`#topic_${ topic_id }`).addClass('non-editable');
    $lockBtn = $(`#topic_${ topic_id } .lock-topic-btn`);
    $lockBtn.after(`<button class="unlock-topic-btn center" data-topic-id="${ topic_id }"  title="Mở khóa chỉnh sửa"><ion-icon name="lock-open-outline"></ion-icon></button>`);
    $lockBtn.remove();
}

// TODO: Mở khóa chỉnh sửa chủ đề
async function unlockTopic(topic_id) {
    const response = await apiWithAccessToken('unlock-topic', 'PUT', { topic_id: topic_id });

    if (!response) {
        return;
    }

    showNotification(response.message);

    const topicIndex = topics.findIndex(topic => topic.id == topic_id);

    if (topicIndex !== -1) {
        // Cập nhật is_editable của chủ đề
        topics[topicIndex].is_editable = 1;
    }

    $(`#topic_${ topic_id }`).removeClass('non-editable');
    $unlockBtn = $(`#topic_${ topic_id } .unlock-topic-btn`);
    $unlockBtn.after(`<button class="lock-topic-btn center" data-topic-id="${ topic_id }"  title="Khóa chỉnh sửa"><ion-icon name="lock-closed-outline"></ion-icon></button>`);
    $unlockBtn.remove();
}

// TODO: Xóa chủ đề
async function deleteTopic(topic_id) {
    const response = await apiWithAccessToken('topic', 'DELETE', { topic_id: topic_id });

    if (!response) {
        return;
    }

    // Xóa chủ đề khỏi mảng topics
    topics = topics.filter(topic => topic.id != topic_id);

    // Tìm phần tử chủ đề trong DOM
    const $topicElement = $(`#topic_${ topic_id }`);
    const $levelContainer = $topicElement.closest('.level_container');

    // Sử dụng slideUp để ẩn phần tử chủ đề
    $topicElement.slideUp(300, function() {
        // Sau khi hiệu ứng slideUp hoàn thành, xóa phần tử khỏi DOM
        $topicElement.remove();

        // Kiểm tra xem trong levelContainer có còn .topic-item nào không, nếu không thì xóa đi
        if ($levelContainer.find('.topic-item').length === 0) {
            $levelContainer.slideUp(300, function() {
                $levelContainer.remove(); // Xóa levelContainer nếu không còn topic-item nào
            });
        }
    });
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

// TODO: Lấy tài liệu và ảnh (nếu có) để upload
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
        document_url: null,
        programming_language: $('#programming_language').attr('data-val'),
        level: parseInt($('#level').attr('data-val'), 10),
        unlock_condition_type: $('#unlock_condition_type').attr('data-val'),
        min_required_exercises: parseInt($('#min_required_exercises').val(), 10),
        min_required_score: parseInt($('#min_required_score').val(), 10),
        bonus_points: parseInt($('#bonus_points').attr('data-val'), 10),
    };
}

// TODO: Thêm chủ đề mới vào mảng chủ đề
function addTopicToArr(topic) {
    // Tìm vị trí chèn vào mảng topics sao cho mảng vẫn được sắp xếp theo topic.level
    const index = topics.findIndex(t => t.level > topic.level);
    
    // Nếu tìm được vị trí, chèn vào đó. Nếu không tìm thấy (chèn cuối cùng), thêm vào cuối mảng.
    if (index === -1) {
        topics.push(topic); // Chèn vào cuối mảng nếu không tìm thấy vị trí thích hợp.
    } else {
        topics.splice(index, 0, topic); // Chèn vào vị trí index
    }
}