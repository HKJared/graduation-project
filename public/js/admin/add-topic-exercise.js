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
    const topicId = urlParams.get('topic_id');
    
    // Tìm topic dựa trên topicId
    const topic = topics.find(t => t.id == topicId);

    // Cập nhật breadcrumd
    $('ul.breadcrumb').append(`
        <li class="breadcrumb-item"><a href="/admin/system-exercise-topic?name=${ topic.name }&id=${ topic.id }" class="spa-action">Quản lý chủ đề</a></li>
        <li class="breadcrumb-item active" aria-current="page">Thêm bài tập chủ đề</li>
    `);

    // Hiển thị form thêm bài tập
    createAddForm(topic);

    createEditor('Đề bài');
    createCodeEditor(topic);

    if (topic.programming_language != 'Multi') {
        $('#language').addClass('unchangeable');
    }
});

// xử lí sự kiện
$(document).ready(function() {
    // thay đổi loại bài tập trắc nghiệm <--> lập trình
    $(document).on('change.wiseowlEvent', '#type', function() {
        const type = $(this).attr('data-val');

        $('.exercise-body').hide();

        $(`#${ type }_exercise`).show();
    });

    // TODO: Bộ sự kiện cho bài tập trắc nghiệm
    $(document).on('change.wiseowlEvent', '.type_col .wo-select', function() {
        const type = $(this).attr('data-val');

        const $icon = $(this).closest('.edit-question-item').find('.question-option .icon')

        if (type == 'multi') {
            $icon.empty().append('<ion-icon name="square"></ion-icon>');
        } else {
            $icon.empty().append('<ion-icon name="ellipse"></ion-icon>');

            const $questionOptionIsCorrects = $(this).closest('.edit-question-item').find('.is_correct');

            if ($questionOptionIsCorrects.length > 0) {
                $questionOptionIsCorrects.removeClass('is_correct');
                $($questionOptionIsCorrects[0]).addClass('is_correct');
            }
        }
    });

    $(document).on('click.wiseowlEvent', '.question-option .icon', function() {
        const questionType = $(this).closest('.edit-question-item').find('.type_col .wo-select').attr('data-val');
        if (questionType == 'single') {
            $(this).closest('.question-options').find('.question-option').removeClass('is_correct');
        }

        $(this).closest('.question-option').toggleClass('is_correct');
    });

    $(document).on('click.wiseowlEvent', '.add-option-btn', function() {
        const $question = $(this).closest('.edit-question-item');
        const $questionOptions = $question.find('.question-options');
        const questionType = $question.find('.type_col .wo-select').attr('data-val');
        const questionId = $question.attr('id').split('_')[1]; // Lấy số của câu hỏi từ id, ví dụ "1" từ "question_1"
    
        // Tìm giá trị lớn nhất của i trong các option hiện có
        const existingOptionIds = $questionOptions.find('input[type="file"]').map((_, input) => {
            const idParts = $(input).attr('id').split('_');
            return parseInt(idParts[idParts.length - 1]); // Lấy số cuối cùng trong id
        }).get();
        const nextIndex = existingOptionIds.length > 0 ? Math.max(...existingOptionIds) + 1 : 1;

        // Thêm một option mới với id duy nhất
        const newOptionHtml = `
            <div class="question-option row full-width item-center gap-16 scale-up-ver-top">
                <button class="icon" title="Đánh dấu là đáp án đúng">
                    <ion-icon name="${ questionType == 'multi' ? 'square' : 'ellipse' }"></ion-icon>
                </button>
                <div class="content col">
                    <div class="wo-textarea">
                        <textarea name="" class="option__text" placeholder="Đáp án"></textarea>
                    </div>
                </div>
                <div class="image center">
                    <label for="question_${questionId}_option_${nextIndex}" class="change-question-image center" title="">
                        <ion-icon name="image-outline"></ion-icon>
                    </label>
                    <input type="file" id="question_${questionId}_option_${nextIndex}">
                </div>
                <div class="option-action">
                    <button class="remove-option-btn center" title="Loại bỏ đáp án này">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
            </div>
        `;
        $questionOptions.append(newOptionHtml);
    });

    $(document).on('click.wiseowlEvent', '.remove-option-btn', function () {
        // Lấy danh sách option trong câu hỏi hiện tại
        const $question = $(this).closest('.edit-question-item');
        const $options = $question.find('.question-option');
    
        // Kiểm tra nếu có tối thiểu 2 option thì mới cho phép xóa
        if ($options.length <= 2) {
            showStackedNotification("Mỗi câu hỏi phải có tối thiểu 2 đáp án.");
            return; // Dừng không thực hiện xóa
        }
    
        // Xóa option được nhấn
        $(this).closest('.question-option').remove();
    });

    $(document).on('click.wiseowlEvent', '.add-question-btn', function () {
        // Tìm danh sách các ID hiện tại
        const questionIds = $('.edit-question-item')
            .map(function () {
                const idMatch = $(this).attr('id')?.match(/question_(\d+)/);
                return idMatch ? parseInt(idMatch[1], 10) : null;
            })
            .get();
    
        // Tìm i lớn nhất hiện tại và tăng lên 1
        const newId = Math.max(0, ...questionIds) + 1;
    
        // Tạo component câu hỏi mới
        const newQuestionHtml = createEditQuestionComponent({ id: newId });
    
        // Thêm câu hỏi mới vào cuối danh sách
        const newElement = $(newQuestionHtml).appendTo('.question-list');
    
        // Cuộn xuống phần câu hỏi vừa được thêm
        $('.main-body').animate({
            scrollTop: $('.main-body').scrollTop() + newElement.position().top
        }, 1000); // 500ms là thời gian chuyển động, có thể điều chỉnh theo ý muốn

        updateTotalQuestions();
    });

    // Xử lý ảnh cho câu hỏi
    $(document).on('change.wiseowlEvent', '.question_image_url', function () {
        const target = $(this).closest('.edit-row').find('.question_col');
        previewImage(this, target);
    });

    // Xử lý ảnh cho đáp án
    $(document).on('change.wiseowlEvent', '.question-option input[type="file"]', function () {
        const target = $(this).closest('.question-option').find('.content');
        previewImage(this, target);
    });

    // Xử lý nút xóa câu hỏi
    $(document).on("click.wiseowlEvent", ".remove-question-btn", function () {
        const $questionItem = $(this).closest(".edit-question-item");
        const $allQuestions = $(".edit-question-item");

        // Kiểm tra số lượng câu hỏi hiện tại
        if ($allQuestions.length > 25) {
            $questionItem.slideUp()
            setTimeout( function() {
                $questionItem.remove();
                updateTotalQuestions();
                updateTotalRequiredQuestions();
            }, 1000)
        } else {
            showStackedNotification(`Không thể xóa câu hỏi! Phải có tối thiểu 25 câu.`, 'min_question');
        }
    });

    // Xử lý toggle đánh dấu "bắt buộc"
    $(document).on("change.wiseowlEvent", ".wo-toggle input[type='checkbox']", function () {
        const $allChecked = $(".wo-toggle input[type='checkbox']:checked");

        if ($allChecked.length > 10) {
            showStackedNotification(`Chỉ cho phép tối đa 10 câu được đánh dấu là "Bắt buộc".`, 'max_required');
            $(this).prop("checked", false); // Bỏ chọn toggle hiện tại
        }

        updateTotalRequiredQuestions();
    });

    // TODO: Bộ sự kiện cho bài tập lập trình
    // Thay đổi ngôn ngữ
    $(document).on('change.woEvent', '#language', function() {
        const modes = {
            "Cpp": "text/x-c++src",
            "Java": "text/x-java",
            "Pascal": "text/x-pascal",
            "Python": "text/x-python"
        };

        const sampleCode = {
            "Cpp": '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
            "Java": 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
            "Pascal": `program HelloWorld;\nbegin\n    Writeln('Hello, World!');\nend.`,
            "Python": 'print("Hello, World!")'
        };

        var selectedLang = $(this).attr('data-val');
        var mode = modes[selectedLang] || "text/plain";

        // Cập nhật chế độ mode cho CodeMirror
        code_editor.setOption("mode", mode);
        var sample = sampleCode[selectedLang] || "";

        code_editor.setValue(sample);
    });

    // Thay đổi có hay không có code khởi đầu
    $(document).on('change.woEvent', '#has_starter_code', function() {
        if ($(this).attr('data-val') == '1') {
            $('.starter_code__container').removeClass('hide');
        } else {
            $('.starter_code__container').addClass('hide');
        }
    });

    $(document).on("click.wiseowlEvent", ".add-topic-exercise__container  .cancel-btn", function () {
        const topicId = $(this).attr('data-topic-id');

        const topic = topics.find(t => t.id == topicId);

        showConfirm('Xác hậy loại bỏ nội dung đã thêm trước đó.', 'Xác nhận', function(result) {
            if (result) {
                updateViewBasedOnPath(`/admin/system-exercise-topic?name=${ topic.name }&id=${topic.id}`)
            }
        })
    });

    // TODO: Lưu bài tập
    $(document).on("click.wiseowlEvent", ".submit-btn", function () {
        const is_valid_exercise = checkExercise();

        if (!is_valid_exercise) {
            return
        }

        const topicId = $(this).attr('data-topic-id');
        
        createExercise(topicId);
    });
});

function createAddForm(topic) {
    const $addTopicContainer = $('.admin__container');

    const type_options = [
        { value: 'multiple_choice', text: 'Bài tập trắc nghiệm', is_selected: 1 },
        { value: 'code', text: 'Bài tập lập trình', is_selected: 0 }
    ];

    const level_options = [
        { value: 'easy', text: 'Dễ', is_selected: 1 },
        { value: 'medium', text: 'Trung bình', is_selected: 0 },
        { value: 'hard', text: 'Khó', is_selected: 0 }
    ];

    const bonus_scores_options = [
        { value: '50', text: '50 điểm', is_selected: 1 },
        { value: '60', text: '60 điểm', is_selected: 0 },
        { value: '70', text: '70 điểm', is_selected: 0 },
        { value: '80', text: '80 điểm', is_selected: 0 },
        { value: '90', text: '90 điểm', is_selected: 0 },
        { value: '100', text: '100 điểm', is_selected: 0 }
    ];

    let language_options;
    if (topic.programming_language == 'Multi') {
        language_options = [
            { value: 'Cpp', text: 'C/C++', is_selected: 0 },
            { value: 'Java', text: 'Java', is_selected: 0 },
            { value: 'Pascal', text: 'Pascal', is_selected: 1 },
            { value: 'Python', text: 'Python', is_selected: 0 }
        ];
    } else {
        language_options = [
            { value: 'Cpp', text: 'C/C++', is_selected: topic.programming_language == 'Cpp' ? 1 : 0 },
            { value: 'Java', text: 'Java', is_selected: topic.programming_language == 'Java' ? 1 : 0 },
            { value: 'Pascal', text: 'Pascal', is_selected: topic.programming_language == 'Pascal' ? 1 : 0 },
            { value: 'Python', text: 'Python', is_selected: topic.programming_language == 'Python' ? 1 : 0 }
        ];
    }

    const starter_code_options = [
        { value: '0', text: 'Không', is_selected: 1 },
        { value: '1', text: 'Có', is_selected: 0 },
    ];

    $addTopicContainer.append(`
        <div class="row gap-24 full-width">
            <div class="add-topic-exercise__container full-width col panel">
                <div class="panel__header row center">
                    <span>Thêm bài tập cho chủ đề: ${ topic.name }</span>
                </div>
                <div class="panel__body col gap-24">
                    <div class="main__form col gap-16">
                        <div class="edit-row row gap-16">
                            <div class="col">
                                <label for="">Tiêu đề bài tập</label>
                                <p>Tiêu đề phải phù hợp nội dung của bài tập yêu cầu.</p>
                                <div class="wo-input">
                                    <input type="text" id="title">
                                    <span class="char-count">0/50</span>
                                </div>
                            </div>
                        </div>
                        <div class="edit-row row gap-16">
                            <div class="col">
                                <label for="">Mô tả</label>
                                <p>Mô tả ngắn gọn nội dung, kiến thức mà bài tập mang lại.</p>
                                <div class="wo-textarea">
                                    <textarea name="" id="description"></textarea>
                                    <span class="char-count">0/500</span>
                                </div>
                            </div>
                        </div>
                        <div class="edit-row row gap-16">
                            <div class="col">
                                <label for="">Phân loại bài tập</label>
                                ${ createSelectComponent(type_options, 'type') }
                            </div>
                            <div class="col">
                                <label for="">Cấp độ</label>
                                ${ createSelectComponent(level_options, 'level') }
                            </div>
                            <div class="col">
                                <label for="">Điểm thưởng</label>
                                ${ createSelectComponent(bonus_scores_options, 'bonus_scores') }
                            </div>
                        </div>
                    </div>
                    <div class="col gap-16 exercise-body" id="multiple_choice_exercise">
                        <div class="box__title">
                            <span>Danh sách câu hỏi trắc nghiệm</span>
                        </div>
                        <div class="box__body">
                            ${ createListNewQuestionComponent(25) }
                        </div>
                        <div class="box__action row flex-box item-center">
                            <button class="add-btn action-btn add-question-btn">Thêm câu hỏi</button>
                            <div class="row gap-16">
                                <p>Số câu hỏi: <span id="total_questions">25</span></p>
                                <p>Số câu hỏi bắt buộc: <span id="total_required_questions">0</span></p>
                            </div>
                        </div>
                    </div>
                    <div class="col gap-16 exercise-body full-width" id="code_exercise" style="display: none">
                        <div class="box__title">
                            <span>Nội dung bài tập lập trình</span>
                        </div>
                        <div class="box__body scale-up-ver-top col gap-24 ">
                            <div class="edit-row row gap-16">
                                <div class="col">
                                    <textarea name="" id="editor"></textarea>
                                </div>
                            </div>
                            <div class="edit-row row gap-16">
                                <div class="col">
                                    <label for="">Ngôn ngữ</label>
                                    ${ createSelectComponent(language_options, 'language') }
                                </div>
                                <div class="col">
                                    <label for="">Code khởi đầu</label>
                                    ${ createSelectComponent(starter_code_options, 'has_starter_code') }
                                </div>
                            </div>
                            <div class="starter_code__container hide scale-up-ver-top">
                                <textarea id="code_editor"></textarea>
                            </div>
                            <div class="col">
                                <label>Test case</label>
                                ${ createListNewTestcaseComponent() }
                            </div>
                        </div>
                    </div>
                </div>
                <div class="action row gap-16 center sticky-bot">
                    <button class="cancel-btn"  data-topic-id="${ topic.id }">Hủy</button>
                    <button class="submit-btn" data-topic-id="${ topic.id }">Xác nhận</button>
                </div>
            </div>
            ${ createSide() }
        </div>
    `);
}

function createSide() {
    return `
        <div class="side__container">
            <div class="col gap-16 sticky-top">
                <div class="side-body col panel">
                    <div class="side-header">
                        <div class="title">
                            <span>Hướng dẫn điền</span>
                        </div>
                    </div>
                    <div class="item-box__panel col">
                        <div class="suggest-item suggest_2 row gap-8">
                            <i class="fa-solid fa-circle-check"></i>
                            <span class="suggest">Tiêu đề bài tập nên có 25~70 ký tự</span>
                        </div>
                        <div class="suggest-item suggest_4 row gap-8">
                            <i class="fa-solid fa-circle-check"></i>
                            <span class="suggest">Mô tả bài tập phải có ít nhất 100 ký tự</span>
                        </div>
                    </div>
                </div>
                <div class="side-body suggest-message show panel col" data-suggest-id="multiple_choice">
                    <div class="side-header">
                        <div class="title">
                            <span>Gợi ý</span>
                        </div>
                        <div class="icon center">
                            <i class="fa-solid fa-feather-pointed"></i>
                        </div>
                    </div>
                    <div class="side-content col">
                        <div class="title row gap-8">
                            <h4>Bài tập trắc nghiệm</h4>
                        </div>
                        <div class="col full-width">
                            <p>- Bài tập trắc nghiệm cần tối thiểu 25 câu hỏi, 20 câu trong đó sẽ được lấy ra để làm nội dung bài tập ở phía người dùng.</p>
                            <p>- Có thể đánh dấu một câu hỏi là bắt buộc để luôn xuất hiện trong nội dung bài tập.</p>
                            <p>- Chỉ có thể đánh dấu 10 câu hỏi là bắt buộc.</p>
                        </div>
                    </div>
                </div>
                <div class="side-body suggest-message panel col" data-suggest-id="name">
                    <div class="side-header">
                        <div class="title">
                            <span>Gợi ý</span>
                        </div>
                        <div class="icon center">
                            <i class="fa-solid fa-feather-pointed"></i>
                        </div>
                    </div>
                    <div class="side-content col">
                        <div class="title row gap-8">
                            <h4>Bài tập lập trình</h4>
                        </div>
                        <div class="col full-width">
                            <p>- Dài tối thiểu 10 ký tự, sử dụng tiếng Việt có dấu.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// TODO: Hàm hiển thị ảnh
function previewImage(input, target) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const $imagePreview = $('<img>', {
                src: e.target.result,
                class: 'preview-image',
                alt: 'Preview',
            });

            // Xóa ảnh cũ nếu đã có
            $(target).find('.preview-image').remove();
            // Thêm ảnh mới
            $(target).append($imagePreview);
        };
        reader.readAsDataURL(file);
    }
}

function updateTotalQuestions() {
    $('#total_questions').text($('.edit-question-item').length);
}

function updateTotalRequiredQuestions() {
    $('#total_required_questions').text($(".wo-toggle input[type='checkbox']:checked").length)
}

function checkExercise() {
    let isValid = true; // Cờ kiểm tra trạng thái tổng quát

    // Kiểm tra thông tin chung
    if ($('#title').val() == '') {
        $('#title').addClass('danger-border');
        scrollToElementInMainBody('#title');
        showStackedNotification('Vui lòng điền tiêu đề bài tập.', 'title_err');
        return false; // Dừng kiểm tra hoàn toàn
    }
    if ($('#description').val().trim().length < 100) {
        $('#description').addClass('danger-border');
        scrollToElementInMainBody('#description')
        showStackedNotification('Mô tả cần tối thiểu 100 ký tự.', 'description_err');
        return false; // Dừng kiểm tra hoàn toàn
    }

    if ($('#type').attr('data-val') == 'multiple_choice') { // Kiểm tra điều kiện bài tập trắc nghiệm
        $('.edit-question-item').each(function () {
            if (!isValid) return false; // Thoát vòng lặp nếu phát hiện lỗi trước đó

            const $question = $(this);
            const questionText = $question.find('textarea.question').val().trim();
            const hasImage = $question.find('.preview-image').length > 0;

            // Kiểm tra nội dung câu hỏi
            if (!questionText && !hasImage) {
                $question.find('textarea.question').addClass('danger-border');

                // Cuộn đến câu hỏi không hợp lệ
                $('.main-body').animate({
                    scrollTop: $question.offset().top - 96
                }, 500);

                showStackedNotification('Vui lòng nhập nội dung câu hỏi hoặc thêm thêm một hình ảnh minh họa.', 'question_err');
                isValid = false; // Đặt cờ không hợp lệ
                return false; // Dừng vòng lặp .each() hiện tại
            }

            // Kiểm tra đáp án
            $question.find('.question-option').each(function () {
                if (!isValid) return false; // Thoát vòng lặp nếu phát hiện lỗi trước đó

                const $option = $(this);
                const optionText = $option.find('textarea').val().trim();
                const optionImage = $option.find('.preview-image').length > 0;

                // Đáp án phải có nội dung hoặc hình ảnh
                if (!optionText && !optionImage) {
                    $option.find('textarea').addClass('danger-border');

                    // // Cuộn đến câu hỏi không hợp lệ
                    // $('.main-body').animate({
                    //     scrollTop: $question.offset().top - 96
                    // }, 500);
                    let scrollPosition = $question.position().top + $('.main-body').scrollTop();
                    $('.main-body').animate({
                        scrollTop: scrollPosition - 96
                    }, 500);

                    showStackedNotification('Đáp án không được để trống, phải nhập nội dung hoặc thêm một hình ảnh minh họa.', 'option_err');
                    isValid = false; // Đặt cờ không hợp lệ
                    return false; // Dừng vòng lặp .each() hiện tại
                }
            });

            if (!isValid) return false; // Thoát vòng lặp nếu phát hiện lỗi trước đó

            // Kiểm tra đáp án đúng
            const $correctOption = $question.find('.question-option.is_correct');
            if (!$correctOption.length) {
                // Cuộn đến câu hỏi không hợp lệ
                $('.main-body').animate({
                    scrollTop: $question.offset().top - 96
                }, 500);

                showStackedNotification('Câu hỏi phải có ít nhất một đáp án đúng.', 'option_correct_err');
                isValid = false; // Đặt cờ không hợp lệ
                return false; // Dừng vòng lặp .each() hiện tại
            }
        });

        if (!isValid) return false; // Dừng kiểm tra hoàn toàn nếu có lỗi
    } else { 
        const content = editor.getData();
        
        if (content == '') {
            scrollToElementInMainBody('#editor')
            showStackedNotification('Hãy nhập đề bài cho bài tập lập trình.', 'content_err');
            return false;
        }
    }

    return isValid; // Trả về trạng thái kiểm tra tổng quát
}

async function createExercise(topicId) {
    const exercise = {
        topic_id: parseInt(topicId, 10),
        title: $('#title').val(),
        description: $('#description').val(),
        type: $('#type').attr('data-val'),
        level: $('#level').attr('data-val'),
        bonus_scores: parseInt($('#bonus_scores').attr('data-val'), 10)
    }

    let multiple_choice_exercises = [];
    let code_exercise = {
        content: '',
        language: '',
        starter_code: null,
        test_cases: []
    };

    if (exercise.type == 'multiple_choice') {
        $('.edit-question-item').each(function () {
            const $question = $(this);
            
            const multiple_choice_exercise = {
                type: $question.find('.type_col .wo-select').attr('data-val'),
                question: $question.find('textarea.question').val() || '',
                question_image_url: null,
                options: [],
                is_required: $question.find('.is_required input[type="checkbox"]').is(':checked')
            }

            // Kiểm tra đáp án
            $question.find('.question-option').each(function () {
                const $option = $(this);

                const option = {
                    text: $option.find('.option__text').val(),
                    image_url: null,
                    is_correct: $option.hasClass('is_correct')
                }

                multiple_choice_exercise.options.push(option)
            });

            multiple_choice_exercises.push(multiple_choice_exercise);
        });
    } else {
        code_exercise.content = editor.getData();
        code_exercise.language = $('#language').attr('data-val');

        if ($('#has_starter_code').attr('data-val') == '1') {
            code_exercise.starter_code = code_editor.getValue();
        }

        $('.edit-testcase-item').each(function() {
            $item = $(this);

            code_exercise.test_cases.push({
                input: $item.find('.input').val() || '',
                output: $item.find('.output').val()
            })
        });
    }

    const body = {
        exercise, multiple_choice_exercises, code_exercise
    }

    const response = await apiWithAccessToken('/exercise', 'POST', body);

    if (response && response.exercise_id) {
        showCreatedSuccessfully(response.exercise_id);
    }
}

function createCodeEditor(topic) {
    // Xác định mode dựa trên programming_language
    const languageModes = {
        Cpp: "text/x-c++src",
        Java: "text/x-java",
        Pascal: "text/x-pascal",
        Python: "text/x-python",
        Multi: "text/x-pascal" // Mặc định là Pascal nếu Multi
    };
    const mode = languageModes[topic?.programming_language || 'Multi']; // Nếu không tìm thấy, mặc định là Multi

    // Tạo CodeMirror
    code_editor = CodeMirror.fromTextArea(document.getElementById("code_editor"), {
        mode: mode, // Gán mode dựa trên topic
        theme: "default",
        tabSize: 4,
        indentWithTabs: true,
        lineWrapping: true,
        indentUnit: 4,
        autoCloseBrackets: true,
        extraKeys: {
            "Enter": function (cm) {
                // Lấy số lượng khoảng trắng cần thêm
                var tabSize = cm.getOption("tabSize");
                var indent = " ".repeat(tabSize); // Tạo chuỗi khoảng trắng
                cm.replaceSelection("\n" + indent, "end"); // Chèn newline và indent
                cm.execCommand("goLineEnd"); // Di chuyển con trỏ về cuối dòng
            }
        }
    });

    $('#language').trigger('change')
}

function showCreatedSuccessfully(exercise_id) {
    const exerciseTitle = $('#title'); 
    const $adminContainer = $('.admin__container');

    // Loại bỏ tất cả các phần tử con trừ `.breadcrumb`
    $adminContainer.children(':not(.breadcrumb)').remove();

    // Thêm thông báo thành công
    $adminContainer.append(createAlertSuccessComponent('Tạo bài tập thành công', [
        { href: '/admin/system-exercise-management', text: 'Quay về trang chủ', is_main: 0 },
        { href: `/admin/topic-exercise?title=${ exerciseTitle }&id=${ exercise_id }`, text: 'Xem', is_main: 1 }
    ]))
}