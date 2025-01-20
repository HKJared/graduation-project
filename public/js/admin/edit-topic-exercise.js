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
    const exerciseId = urlParams.get('id');

    const response = await apiWithAccessToken(`exercise?id=${ exerciseId }`);

    if (!response || !response.exercise) {
        $('.admin__container').append(createAlertNotFoundComponent('Không tìm thấy bài tập'))    

        return
    }
    exercise = response.exercise
    
    // Tìm topic dựa trên topicId
    const topic = topics.find(t => t.id == exercise.topic_id);

    // Cập nhật breadcrumd
    $('ul.breadcrumb').append(`
        <li class="breadcrumb-item"><a href="/admin/system-exercise-topic?name=${ topic.name || '' }&id=${ topic.id || '' }" class="spa-action">Quản lý chủ đề</a></li>
        <li class="breadcrumb-item active" aria-current="page">Chỉnh sửa bài tập chủ đề</li>
    `);

    // Hiển thị form thêm bài tập
    createEditForm(exercise, topic);

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
    
        const exerciseId = $(this).attr('data-exercise-id');

        // Tạo component câu hỏi mới
        const newQuestionHtml = createEditQuestionComponent({
            id: -1,
            exercise_id: exerciseId,
            type: 'single',
            options: [{}, {}]
        });
    
        // Thêm câu hỏi mới vào cuối danh sách
        const newElement = $(newQuestionHtml).appendTo('.question-list');
        newElement.addClass('new-question')
    
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
        if ($allQuestions.length > 40) {
            $questionItem.slideUp()
            setTimeout( function() {
                $questionItem.remove();
                updateTotalQuestions();
                updateTotalRequiredQuestions();
            }, 1000)
        } else {
            showStackedNotification(`Không thể xóa câu hỏi! Phải có tối thiểu 40 câu.`, 'min_question');
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
        
        const topic = topics.find(t => t.id == topicId); console.log(topics)

        showConfirm('Xác nhận loại bỏ nội dung đã thêm trước đó.', 'Xác nhận', function(result) {
            if (result) {
                updateViewBasedOnPath(`/admin/system-exercise-topic?name=${ topic.name }&id=${topic.id}`)
            }
        })
    });

    // Xóa ảnh cũ của câu hỏi
    $(document).on("click.wiseowlEvent", ".remove-old-image-btn", function() {
        $(this).closest('.image-container').remove()
    });

    $(document).on("click.wiseowlEvent", ".submit-code-exercise-btn", async function () {
        const is_valid_exercise = checkCodeExercise();

        if (!is_valid_exercise) {
            return
        }

        const exercise_id = $(this).attr("data-exercise-id");
        let code_exercise = {
            exercise_id: parseInt(exercise_id, 10),
            content: '',
            language: '',
            starter_code: null,
            test_cases: []
        };

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

        const response = await apiWithAccessToken('/code-exercise', 'PUT', { code_exercise: code_exercise });

        if (response && response.message) {
            showNotification(response.message)
        }
    });

    // TODO: Lưu bài tập
    $(document).on("click.wiseowlEvent", ".submit-btn", async function () {
        const is_valid_exercise = checkExercise();

        if (!is_valid_exercise) {
            return
        }

        const exercise_id = $(this).attr("data-exercise-id");
        const exercise = {
            id: parseInt(exercise_id, 10),
            title: $('#title').val(),
            description: $('#description').val(),
            level: $('#level').attr('data-val'),
            bonus_scores: parseInt($('#bonus_scores').attr('data-val'), 10)
        }

        const response = await apiWithAccessToken('/exercise', 'PUT', { exercise: exercise });

        if (response && response.message) {
            showNotification(response.message)
        }
    });

    // TODO: Lưu câu hỏi
    $(document).on("click.wiseowlEvent", ".submit-question-btn", async function () {
        // const is_valid_exercise = checkExercise();

        // if (!is_valid_exercise) {
        //     return
        // }

        const question_id = $(this).attr('data-question-id');
        const exercise_id = $('.admin__container').attr('data-exercise-id')

        const $question = $(this).closest('.edit-question-item');

        function checkQuestionValid () {
            let isValid = true;

            const questionText = $question.find('textarea.question').val().trim();
            const hasImage = $question.find('.preview-image').length > 0;

            // Kiểm tra nội dung câu hỏi
            if (!questionText && !hasImage) {
                $question.find('textarea.question').addClass('danger-border');

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

                    showStackedNotification('Đáp án không được để trống, phải nhập nội dung hoặc thêm một hình ảnh minh họa.', 'option_err');
                    isValid = false; // Đặt cờ không hợp lệ
                    return false; // Dừng vòng lặp .each() hiện tại
                }
            });

            if (!isValid) return false; // Thoát vòng lặp nếu phát hiện lỗi trước đó

            // Kiểm tra đáp án đúng
            const $correctOption = $question.find('.question-option.is_correct');
            if (!$correctOption.length) {

                showStackedNotification('Câu hỏi phải có ít nhất một đáp án đúng.', 'option_correct_err');
                isValid = false; // Đặt cờ không hợp lệ
                return false; // Dừng vòng lặp .each() hiện tại
            }

            return isValid
        }

        if (!checkQuestionValid()) {
            return
        }
        
        const question = {
            id: question_id,
            exercise_id: exercise_id,
            type: $question.find('.type_col .wo-select').attr('data-val'),
            question: $question.find('textarea.question').val() || '',
            question_image_url: $question.find('.question_col .image-container img').attr('src') || '',
            options: [],
            is_required: $question.find('.is_required input[type="checkbox"]').is(':checked')
        }

        // Kiểm tra đáp án
        $question.find('.question-option').each(async function () {
            const $option = $(this);

            const option = {
                text: $option.find('.option__text').val(),
                image_url: null,
                is_correct: $option.hasClass('is_correct')
            }

            const $image = $option.find(`.content img`);
            if($image[0]) {
                option.image_url = $image.attr('src')
            }

            question.options.push(option)
        });

        const inputFile = $(`#question-image_${ question_id }`);
        if(inputFile[0].files && inputFile[0].files.length > 0) {
            let formData = new FormData();

            formData.append('files', inputFile[0].files[0]);
            formData.append('keys[]', `image_url`);

            const responseUrl = await upload(formData);
            // console.log(responseUrl)

            if (!responseUrl) {
                return
            }

            if (responseUrl.image_url) {
                question.question_image_url = responseUrl.image_url
            }
        }


        const body = {
            question: question
        }
    
        const response = await apiWithAccessToken('/mutiple-choice-exercise', 'PUT', body);
    
        if (response && response.message) {
            showNotification(response.message);
        }
    });
});

function createEditForm(exercise, topic) {
    const $adminContainer = $('.admin__container');

    $adminContainer.attr('data-exercise-id', exercise.id)

    const type_options = [
        { value: 'multiple_choice', text: 'Bài tập trắc nghiệm', is_selected: exercise.type == "code" ? 0 : 1 },
        { value: 'code', text: 'Bài tập lập trình', is_selected: exercise.type == "code" ? 1 : 0 }
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
    
    $adminContainer.append(`
        <div class="row gap-24 full-width">
            <div class="add-topic-exercise__container col gap-24 flex-1">
                <div class="full-width col panel">
                    <div class="panel__header row center">
                        <span>Thông tin bài tập chủ đề</span>
                    </div>
                    <div class="panel__body col gap-24">
                        <div class="main__form col gap-16">
                            <div class="edit-row row gap-16">
                                <div class="col">
                                    <label for="">Tiêu đề bài tập</label>
                                    <p>Tiêu đề phải phù hợp nội dung của bài tập yêu cầu.</p>
                                    <div class="wo-input">
                                        <input type="text" id="title" value="${ exercise.title }">
                                        <span class="char-count">0/50</span>
                                    </div>
                                </div>
                            </div>
                            <div class="edit-row row gap-16">
                                <div class="col">
                                    <label for="">Mô tả</label>
                                    <p>Mô tả ngắn gọn nội dung, kiến thức mà bài tập mang lại.</p>
                                    <div class="wo-textarea">
                                        <textarea name="" id="description" value="${ exercise.description }">${ exercise.description }</textarea>
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
                    </div>
                    <div class="action row gap-16 center">
                        <button class="cancel-btn"  data-exercise-id="${ exercise.id }" data-topic-id="${ exercise.topic_id }">Hủy</button>
                        <button class="submit-btn" data-exercise-id="${ exercise.id }"  data-topic-id="${ exercise.topic_id }">Lưu</button>
                    </div>
                </div>
                ${
                    exercise.type == "code" ?
                    createEditCodeExercise(exercise.code_exercise) :
                    createEditMultipleChoiceExercise(exercise.multiple_choice_exercise)
                }
            </div>
            ${ createSide() }
        </div>
    `);

    if (exercise.type == "code") {
        createEditor('Đề bài', exercise.code_exercise.content);
        createCodeEditor(exercise.code_exercise);
    }

    $('#type').trigger('change')
    // ?: Những thông tin không thể thay đổi
    $('#type').addClass('unchangeable');
}

function createEditMultipleChoiceExercise(multiple_choice_exercise) {
    return `
        <div class="col gap-16 exercise-body panel" id="multiple_choice_exercise">
            <div class="panel__header row center">
                <span>Danh sách câu hỏi trắc nghiệm</span>
            </div>
            <div class="panel__body col gap-24">
                ${ createListEditQuestionComponent(multiple_choice_exercise) }
                <div class="row flex-box item-center">
                    <button class="add-btn action-btn add-question-btn" data-exercise-id="${ multiple_choice_exercise.exercise_id }">Thêm câu hỏi</button>
                    <div class="row gap-16">
                        <p>Số câu hỏi: <span id="total_questions">${ multiple_choice_exercise.length }</span></p>
                        <p>Số câu hỏi bắt buộc: <span id="total_required_questions">0</span></p>
                    </div>
                </div>
            </div>
        </div>
    `
}

function createEditCodeExercise(code_exercise) {
    const language_options = [
        { value: 'Cpp', text: 'C/C++', is_selected: code_exercise.language == 'Cpp' ? 1 : 0 },
        { value: 'Java', text: 'Java', is_selected: code_exercise.language == 'Java' ? 1 : 0 },
        { value: 'Pascal', text: 'Pascal', is_selected: code_exercise.language == 'Pascal' ? 1 : 0 },
        { value: 'Python', text: 'Python', is_selected: code_exercise.language == 'Python' ? 1 : 0 }
    ];

    const starter_code_options = [
        { value: '0', text: 'Không', is_selected: code_exercise.starter_code ? 0 : 1 },
        { value: '1', text: 'Có', is_selected: code_exercise.starter_code ? 1 : 0 },
    ];

    return `
        <div id="code_exercise" class="full-width col panel">
            <div class="panel__header row center">
                <span>Thông tin bài tập lập trình</span>
            </div>
            <div class="panel__body col gap-24">
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
                    <div class="starter_code__container ${code_exercise.starter_code ? "" : "hide"} scale-up-ver-top">
                        <textarea id="code_editor"></textarea>
                    </div>
                    <div class="col">
                        <label>Test case</label>
                        ${ createListEditTestcaseComponent(code_exercise.test_cases) }
                    </div>
                </div>
            </div>
            <div class="action row gap-16 center">
                <button class="submit-code-exercise-btn" data-exercise-id="${ code_exercise.exercise_id }">Lưu</button>
            </div>
        </div>
    `
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
                        <div class="suggest-item suggest_5 row gap-8">
                            <i class="fa-solid fa-circle-check"></i>
                            <span class="suggest">Không thể thay đổi phân loại bài tập</span>
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
                            <p>- Bài tập trắc nghiệm cần tối thiểu 40 câu hỏi, 20 câu trong đó sẽ được lấy ra để làm nội dung bài tập ở phía người dùng.</p>
                            <p>- Có thể đánh dấu một câu hỏi là bắt buộc để luôn xuất hiện trong nội dung bài tập.</p>
                            <p>- Chỉ có thể đánh dấu 10 câu hỏi là bắt buộc.</p>
                        </div>
                        <div class="title row gap-8">
                            <h4>Câu hỏi trắc nghiệm</h4>
                        </div>
                        <div class="col full-width">
                            <p>- Với mỗi câu hỏi trắc nghiệm sau khi được chỉnh sửa hoặc thêm mới đều phải lưu.</p>
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
            // Tạo div bọc ảnh và nút xóa
            const $imageContainer = $('<div>', {
                class: 'relative image-container',
            });

            // Tạo ảnh xem trước
            const $imagePreview = $('<img>', {
                src: e.target.result,
                class: 'preview-image',
                alt: 'Preview',
            });

            // Tạo nút xóa ảnh
            const $removeButton = $('<button>', {
                class: 'absolute center remove-image-btn',
                html: '<ion-icon name="close-outline"></ion-icon>',
                click: function () {
                    // Xóa div chứa ảnh và nút xóa
                    $imageContainer.remove();
                    // Xóa file trong input
                    $(input).val('');
                },
            });

            // Xóa nội dung cũ nếu có
            $(target).find('.image-container').remove();

            // Thêm ảnh và nút xóa vào div, sau đó thêm div vào target
            $imageContainer.append($imagePreview).append($removeButton);
            $(target).append($imageContainer);
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

    return isValid; // Trả về trạng thái kiểm tra tổng quát
}

function checkCodeExercise() {
    const content = editor.getData();
        
    if (content == '') {
        scrollToElementInMainBody('#editor')
        showStackedNotification('Hãy nhập đề bài cho bài tập lập trình.', 'content_err');
        return false;
    }

    return true; 
}

function createCodeEditor(code_exercise) {
    // Xác định mode dựa trên language
    const languageModes = {
        Cpp: "text/x-c++src",
        Java: "text/x-java",
        Pascal: "text/x-pascal",
        Python: "text/x-python",
        Multi: "text/x-pascal" // Mặc định là Pascal nếu Multi
    };
    const mode = languageModes[code_exercise?.language || 'Multi']; // Nếu không tìm thấy, mặc định là Multi

    // Tạo CodeMirror
    code_editor = CodeMirror.fromTextArea(document.getElementById("code_editor"), {
        mode: mode, // Gán mode dựa trên code_exercise
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

    if (code_exercise.starter_code) {            
        code_editor.setValue(code_exercise.starter_code)
    }

    $('#language').trigger('change')
}