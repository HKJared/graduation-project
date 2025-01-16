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

    const response = await apiWithAccessToken(`/topic?id=${ topicId }&data_to_edit=1`);

    if (response && response.topic) {
        showTopic(response.topic);

        $('#programming_language').addClass('unchangeable')
    } else {
        showTopic();
    }
});

// xử lí sự kiện
$(document).ready(function() {
    $(document).on('click.wiseowlEvent', '.edit-topic__container .hide-btn', function(event) {
        event.stopPropagation();

        const $addTopicContainer = $('.edit-topic__container');

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

    $(document).on('click.wiseowlEvent', '.edit-topic__container .cancel-btn', function(event) {
        event.stopPropagation();

        showConfirm('Xác nhận bỏ những thông tin đã thay đổi.', 'Xác nhận', function(result) {
            if (result) {
                // updateViewBasedOnPath('/admin/system-exercise-management');
                history.back();
            }
        })
    });

    $(document).on('click.wiseowlEvent', '.edit-topic__container .submit-btn', function(event) {
        event.stopPropagation();

        if (!checkTopicInfo()) {
            return
        }

        const topicId = $(this).data('topic-id') || null;

        showConfirm('Xác nhận thay đổi thông tin chủ đề.', 'Xác nhận', function(result) {
            if (result) {
                updateTopic(topicId);                
            }
        });
    });
});

// TODO: Hiển thị thông tin cũ của chủ đề
function showTopic(topic) {
    const $adminContainer = $('.admin__container');

    if (!topic) {
        $adminContainer.append(createAlertNotFoundComponent('Không tìm thấy chủ đề!'));

        return 
    }

    // Thiết lập các tùy chọn đã có sẵn
    const programming_language_options = [
        { value: 'Multi', text: 'Đa ngôn ngữ', is_selected: topic.programming_language == 'Multi' ? 1 : 0 },
        { value: 'Cpp', text: 'C/C++', is_selected: topic.programming_language == 'Cpp' ? 1 : 0 },
        { value: 'Java', text: 'Java', is_selected: topic.programming_language == 'Java' ? 1 : 0 },
        { value: 'Pascal', text: 'Pascal', is_selected: topic.programming_language == 'Pascal' ? 1 : 0 },
        { value: 'Python', text: 'Python', is_selected: topic.programming_language == 'Python' ? 1 : 0 }
    ];

    const unlock_condition_type_options = [
        { value: 'none', text: 'Không yêu cầu', is_selected: topic.unlock_condition_type == 'none' ? 1 : 0 },
        { value: 'all', text: 'Hoàn thành tất cả các chủ đề được yêu cầu', is_selected: topic.unlock_condition_type == 'all' ? 1 : 0 },
        { value: 'any', text: 'Hoàn thành một trong các chủ đề được yêu cầu', is_selected: topic.unlock_condition_type == 'any' ? 1 : 0 },
        { value: 'single', text: 'Hoàn thành một chủ đề được yêu cầu', is_selected: topic.unlock_condition_type == 'single' ? 1 : 0 }
    ];

    const bonus_points_options = [
        { value: '50', text: '50 điểm', is_selected: topic.bonus_points == 50 ? 1 : 0 },
        { value: '80', text: '80 điểm', is_selected: topic.bonus_points == 80 ? 1 : 0 },
        { value: '100', text: '100 điểm', is_selected: topic.bonus_points == 100 ? 1 : 0 },
        { value: '120', text: '120 điểm', is_selected: topic.bonus_points == 120 ? 1 : 0 }
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
                is_selected: level == topic.level ? 1 : 0  // Chọn Cấp độ 1 mặc định
            });
        }
    
        return level_options;
    }

    const level_options = createLevelOptions([{ level: topic.level }]);

    $adminContainer.append(`
        <div class="system-exercise-topic__box full-width col panel scale-up-ver-top" style="--scale: 0.5;">
            <div class="panel__header row center">
                <span>Chỉnh sửa thông tin chủ đề</span>
            </div>
            <div class="panel__body edit-topic__container center">
                <div class="edit-topic__box">
                    <div class="body row gap-48">
                        <div class="main__form col gap-16">
                            <div class="edit-row row gap-16">
                                <div class="col">
                                    <label for="">Tên chủ đề</label>
                                    <p>Tên chủ đề phải phù hợp với các bài tập sẽ thêm vào sau khi chủ đề được tạo.</p>
                                    <div class="wo-input">
                                        <input type="text" id="name" value="${ topic.name }">
                                        <span class="char-count">0/50</span>
                                    </div>
                                </div>
                            </div>
                            <div class="edit-row row gap-16">
                                <div class="col">
                                    <label for="">Mô tả</label>
                                    <p>Mô tả ngắn gọn nội dung, kiến thức mà chủ đề mang lại.</p>
                                    <div class="wo-textarea">
                                        <textarea name="" id="description">${ topic.description }</textarea>
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
                                    <a href="${ topic.document_url }" target="_blank" class="view-document" title="Xem">Tài liệu hiện tại</a>
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
                                                <input type="number" min="5" value="${ topic.min_required_exercises }" id="min_required_exercises">
                                            </div>
                                        </div>
                                        <div class="col">
                                            <span class="sub-label">Tổng số điểm tối thiểu</span>
                                            <div class="wo-input">
                                                <input type="number" min="50" value="${ topic.min_required_score }" id="min_required_score">
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
                                                                                                ), url('${ topic.image_url || '/images/image.png'}');">
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
                                <div class="center change-image__action">
                                    <label for="image_url">Chọn ảnh</label>
                                    <input type="file" id="image_url" accept="image/*">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="action row gap-16 center">
                        <button class="cancel-btn">Hủy</button>
                        <button class="submit-btn" data-topic-id="${ topic.id }">Xác nhận</button>
                    </div>
                </div> 
            </div>
        </div>
    `);
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

    return true
}

// TODO: Lấy thông tin mới của chủ đề trong form chỉnh sửa
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

// TODO: Lấy tài liệu và ảnh (nếu có) để upload
function createFormData() {
    let formData = new FormData();

    if ($('#image_url')[0].files.length > 0) {
        formData.append('files', $('#image_url')[0].files[0]);
        formData.append('keys[]', `image_url`);
    }

    if ($('#document_url')[0].files.length > 0) {
        formData.append('files', $('#document_url')[0].files[0]);
        formData.append('keys[]', `document_url`);
    }

    return formData;
}

// TODO: Cập nhật chủ đề
async function updateTopic(topicId) {
    const newTopic = getTopicInfo();

    if ($('#image_url')[0].files.length > 0 || $('#document_url')[0].files.length > 0) {
        const formData = createFormData();

        const responseUrl = await upload(formData);
        // console.log(responseUrl)

        if (!responseUrl) {
            return
        }

        newTopic.image_url = responseUrl.image_url || null;
        newTopic.document_url = responseUrl.document_url || null;
    }

    const response = await apiWithAccessToken('topic', 'PUT', { topic_id: topicId, newData: newTopic });

    if (!response) {
        return
    }

    const topic = response.topic;

    topics = topics.map(item => item.id == topic.id ? topic : item);

    $('.system-exercise-topic__box').empty();

    $('.admin__container').append(createAlertSuccessComponent('Cập nhật thành công', [
        { href: '/admin/system-exercise-management', text: 'Quay về trang chủ', is_main: 0 },
        { href: `/admin/system-exercise-topic?name=${ topic.name }&id=${ topic.id }`, text: 'Xem', is_main: 1 }
    ]))
}