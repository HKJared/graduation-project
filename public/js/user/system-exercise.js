var exerciseEditor;

$(document).ready(async function() {
    // Thêm lớp active vào nav-item tương ứng
    $('.nav-item').removeClass('active');
    $('#practice_nav').addClass('active');
    updateUnderline();

    setTitle('Bài tập luyện tập')

    if (!topics.length) {
        const response = await userApi('topics');

        if (response && response.topics) {
            topics = response.topics
        }
    }   

    const url = window.location.href;
    const urlParams = new URLSearchParams(new URL(url).search);
    const exerciseId = urlParams.get('id');

    const { exercise } = await userApi(`exercise?exercise_id=${ exerciseId }`);

    showExercise(exercise);
});

$(document).ready(function () {
    $(document).on('click.woEvent', '.question-option .icon', function () {
        const questionType = $(this).closest('.question-item').attr('data-question-type');
    
        // Nếu là câu hỏi loại single, xóa lớp is_selected ở các đáp án khác
        if (questionType == 'single') {
            $(this).closest('.question-options').find('.question-option').removeClass('is_selected');
        }
    
        // Thêm hoặc xóa lớp is_selected cho đáp án được nhấp
        $(this).closest('.question-option').toggleClass('is_selected');
    
        // Lấy id của câu hỏi
        const order = $(this).closest('.question-item').attr('id').split('_')[1];
    
        // Kiểm tra xem có đáp án nào được chọn hay không
        const hasSelectedAnswer = $(this)
            .closest('.question-item')
            .find('.question-option.is_selected')
            .length > 0;
    
        // Thêm hoặc xóa lớp is_selected cho #preview_question_id
        const previewElement = $(`#preview_question_${order}`);
        if (hasSelectedAnswer) {
            previewElement.addClass('selected');
        } else {
            previewElement.removeClass('selected');
        }

        updateSubmitBtn();
    });

    $(document).on('click.woEvent', '.preview-question-item', function () {
        // Lấy id của câu hỏi
        const order = $(this).attr('id').split('_')[2];
        // console.log(order)
        // Cuộn đến phần tử #question_{order}
        const target = $(`#question_${order}`);
        if (target.length) {
            $('html, body').animate({
                scrollTop: target.offset().top - 70
            }, 800); // Thời gian cuộn là 500ms
        }
    });

    $(document).on('click.woEvent', '.submit-btn:not(.not-allowed)', async function () {
        showConfirmWithNotice('Xác nhận chấm điểm.', 'Chấm điểm', 'Nếu bạn đã làm bài tập này trước đó và lần chấm điểm này có điểm số thấp hơn thì bài làm của bạn sẽ không được lưu.', async function(result) {
            if (result) {
                $(this).addClass('not-allowed');
                await submitExercise();
                $(this).removeClass('not-allowed');
            }
        });
    });

    $(document).on('click.woEvent', '.reset-btn', function () {
        showConfirm('Xác nhận loại bỏ những thay đổi của bạn.', 'Xác nhận', function(result) {
            if (result) {
                exerciseEditor.setValue(code_exercise.starter_code || '');
            }
        });
    });
});

function showExercise(exercise) {
    const $container = $('.user__container');

    $container.attr('data-exercise-id', exercise.id);
    $container.attr('data-topic-id', exercise.topic_id);

    if (exercise.type == "multiple_choice") {
        $container.attr('data-type', 'multiple_choice');
        $container.append(createDisplayMultipleChoiceExercise(exercise));
    } else {
        $container.attr('data-type', 'code');
        $container.append(createDisplayCodeExercise(exercise));

        setupCompiler();

        if (exercise.code_exercise.starter_code) {
            exerciseEditor.setValue(exercise.code_exercise.starter_code);
        }

        switch (exercise.code_exercise.language) {
            case 'Cpp':
                exerciseEditor.setOption("mode", "text/x-c++src");
                break;
            case 'Java':
                exerciseEditor.setOption("mode", "text/x-java");
                break;
            case 'Pascal':
                exerciseEditor.setOption("mode", "text/x-pascal");
                break;
            case 'Python':
                exerciseEditor.setOption("mode", "text/x-python");
                break;
            default:
                exerciseEditor.setOption("mode", "text/plain"); // Hoặc chế độ mặc định bạn muốn
                break;
        }
    }
}

function createDisplayMultipleChoiceExercise(exercise) {
    return `
        <div class="row gap-24 full-width">
            <div class="overview__container col">
                <div class="preview-questions_container col gap-8 panel full-width sticky-top">
                    ${ createListPreviewQuestionComponent(20) }
                </div>
            </div>
            <div class="questions_container flex-1 col panel">
                ${ createListExerciseQuestionComponent(exercise.questions) }
                <div class="suggest_container col gap-4">
                    <p>Bạn cần hoàn thành tất cả câu hỏi để có thể tiến hành chấm điểm.</p>
                    <p>Hãy kiểm tra kỹ bài làm của bạn trước khi thực hiện chấm điểm.</p>
                    <p>Nếu bạn đã làm bài tập này trước đó, khi chấm điểm lần này nếu thấp hơn lần trước thì bài làm sẽ không được lưu.<p>
                </div>
                <div class="action_container center">
                    <button class="submit-btn success-bg not-allowed">Chấm điểm</button>
                </div>
            </div>
        </div>
    `;
}

function createDisplayCodeExercise(exercise) {
    code_exercise = exercise.code_exercise
    return `
       <div class="row gap-16 w-full-screen container">
            <div class="content__container col panel">
                <div class="panel_header row item-center gap-8">
                    <span class="center" style="padding-right: 8px; border-right: 1px solid var(--color-white-60);"><ion-icon name="clipboard-outline"></ion-icon></span>
                    <span>${ exercise.title }</span>
                </div>
                <div class="panel_body col flex-1 gap-16">
                    <div class="info-overview row gap-16">
                        <span class="${ exercise.level }">${ exercise.level }</span>
                        <span class="row gap-4 item-center warning"><ion-icon name="medal-outline"></ion-icon> ${ exercise.bonus_scores }</span>
                        <span class="row gap-4 item-center"><ion-icon name="code-working-outline"></ion-icon> ${ exercise.code_exercise.language }</span>
                    </div>
                    <div class="col gap-8">
                        <h3>Mô tả</h3>
                        <span>${ exercise.description }</span>
                    </div>
                    <div class="col gap-8">
                        <h3>Đề bài</h3>
                        <div>${ exercise.code_exercise.content }</div>
                    </div>
                </div>
            </div>
            <div class="compiler__container flex-1 col gap-16">
                <div class="editor__container flex-1 col panel">
                    <div class="panel_header col gap-8">
                        <div class="row item-center flex-box">
                            <span class="success row item-center gap-4"><ion-icon name="code-slash-outline"></ion-icon> Compiler</span>
                            <div class="row gap-8">
                                <button class="reset-btn center" data-starter-code="${ exercise.code_exercise.starter_code || "" }" title="Làm mới"><ion-icon name="reload-outline"></ion-icon></button>
                                <button class="submit-btn success-bg">Chấm điểm</button>
                            </div>
                        </div>
                        <div class="editor__header-main row">
                            <div class="language center" data-language="">
                                <span>${ exercise.code_exercise.language }</span>
                            </div>
                        </div>
                    </div>
                    <div class="panel_body full-width flex-1 col scale-up-ver-top" style="--scale: 0.6;">
                        <textarea name="" id="editor"></textarea>
                    </div>
                </div>
            </div>
        </div> 
    `
}

function updateSubmitBtn() {
    const unselectedQuestions = $('.preview-question-item:not(.selected)');

    if (!unselectedQuestions.length) {
        $('.submit-btn').removeClass('not-allowed');
    } else {
        $('.submit-btn').addClass('not-allowed');
    }
}

async function submitExercise() {
    const excerciseType = $('.user__container').attr('data-type');

    if (excerciseType == 'multiple_choice') {
        await submitMultipleChoiceExercise();
    } else {
        await submitCodeExercise();
    }
}

async function submitMultipleChoiceExercise() {
    const exerciseId = $('.user__container').attr('data-exercise-id');
    let multiple_choice_answers = [];

    $('.question-item').each(function() {
        const questionId = $(this).data('question-id'); // Lấy ID của câu hỏi
        let selectedOptions = [];

        // Duyệt qua các đáp án và lấy những đáp án đã được chọn (có class 'is_selected')
        $(this).find('.question-option.is_selected').each(function() {
            const optionText = $(this).find('.content span').text(); // Lấy text của đáp án đã chọn
            const optionImageUrl = $(this).find('img').attr('src') || null;
            selectedOptions.push({
                text: optionText,
                image_url: optionImageUrl
            });
        });
        
        multiple_choice_answers.push({
            question_id: questionId,
            selected_options: selectedOptions
        });
    });

    const body = {
        exercise_id: exerciseId,
        multiple_choice_answers: multiple_choice_answers
    }

    const { score, last_score, result_id, completed_topic_id } = await userApi('submit-multiple-choice-exercise', 'POST', body);

    showResponse(score, last_score, result_id, completed_topic_id);
}

async function submitCodeExercise() {
    const exerciseId = $('.user__container').attr('data-exercise-id');
    const code = exerciseEditor.getValue();

    const body = {
        exercise_id: exerciseId,
        code: code
    }
    console.log(body)

    const { score, last_score, result_id, completed_topic_id } = await userApi('submit-code-exercise', 'POST', body);
    showResponse(score, last_score, result_id, completed_topic_id);
}

function showResponse(score, last_score, result_id, completed_topic_id) {
    const $container = $('.user__container');

    const topicId = $container.attr('data-topic-id');

    const topic = topics.find(t => t.id == topicId);
    console.log(topic)

    let mainButton = {};
    let message = '';

    if (last_score === null || last_score < score) { // nộp bài lần đầu
        message = `Đã hoàn tất chấm điểm, bài làm của bạn đạt ${ score } điểm.`;
        mainButton = { href: `/system-exercise-result?id=${ result_id }`, text: 'Xem bài làm', is_main: 1 }
    } else {
        message = `Đã hoàn tất chấm điểm, bài làm của bạn đạt ${ score } điểm, bằng với lần nộp bài trước đó.`;
        mainButton = { href: `/system-exercise-result?id=${ result_id }`, text: 'Xem bài làm trước đó', is_main: 1 }
    }

    if (completed_topic_id) {
        const topic = topics.find(topic => topic.id === completed_topic_id);
        if (topic) {
            message += ' Chủ đề của bài tập này đã được hoàn thành.'
            topic.is_completed = true; // Cập nhật trạng thái hoàn thành
        }
    }

    $container.empty().append(createAlertSuccessComponent(message, [
        { href: `/system-exercise-topic?name=${ topic.name }&id=${ topicId }`, text: 'Quay về trang chủ đề.', is_main: 0 },
        mainButton
    ]))
}

function setupCompiler(){
    // Khởi tạo CodeMirror cho phần editor
    exerciseEditor = CodeMirror.fromTextArea(document.getElementById("editor"), {
        mode: "text/x-c++src",
        theme: "default",
        tabSize: 4,
        indentWithTabs: true,
        lineWrapping: true,
        indentUnit: 4,
        autoCloseBrackets: true,
        extraKeys: {
            "Enter": function(cm) {
                // Lấy số lượng khoảng trắng cần thêm
                var tabSize = cm.getOption("tabSize");
                var indent = " ".repeat(tabSize); // Tạo chuỗi khoảng trắng
                cm.replaceSelection("\n" + indent, "end"); // Chèn newline và indent
                cm.execCommand("goLineEnd"); // Di chuyển con trỏ về cuối dòng
            }
        }
    });

    exerciseEditor.getWrapperElement().style.fontSize = ".875rem";

    $('.content__container').resizable({
        handles: "e",
        minWidth: 360,
        maxWidth: 1180,
    });
}