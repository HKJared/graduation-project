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

    // lấy exercise_id
    const url = window.location.href;
    const urlParams = new URLSearchParams(new URL(url).search);
    const exerciseId = urlParams.get('id');

    const response = await apiWithAccessToken(`exercise?id=${ exerciseId }`);

    if (!response || !response.exercise) {
        $('.admin__container').append(createAlertNotFoundComponent('Không tìm thấy bài tập'))    

        return
    }
    const exercise = response.exercise
    showExercise(exercise);
    
    // Tìm topic dựa trên topicId
    const topic = topics.find(t => t.id == exercise.topic_id);

    // Cập nhật breadcrumd
    $('ul.breadcrumb').append(`
        <li class="breadcrumb-item"><a href="/admin/system-exercise-topic?name=${ topic.name || '' }&id=${ topic.id || '' }" class="spa-action">Quản lý chủ đề</a></li>
        <li class="breadcrumb-item active" aria-current="page">Bài tập chủ đề: ${ exercise.title }</li>
    `);
});

function showExercise(exercise) {
    const $adminContainer = $('.admin__container');

    // TODO: Hiển thị thông tin bài tập
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
            if (exercise.is_editable && permissions.some(p => p.id === 10)) {
                return `<a href="/admin/edit-topic-exercise?title=${ exercise.title }&id=${ exercise.id }" class="spa-action edit-btn action-btn">Chỉnh sửa</a>`
            }

            return ``;
        }
    }

    $adminContainer.append(`
        <div class="panel exercise-info__container col full-width scale-up-ver-top">
            <div class="panel__header row flex-box item-center">
                <span>Thông tin bài tập</span>
                <div>
                    ${ createEditBtn() }
                </div>
            </div>
            <div class="panel__body row gap-24">
                <div class="info__box col gap-8">
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Tiêu đề bài tập:</strong></span>
                        </div>
                        <div class="content">
                            <span>${ exercise.title }</span>
                        </div>
                    </div>
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Mô tả:</strong></span>
                        </div>
                        <div class="content">
                            <span>${ exercise.description }</span>
                        </div>
                    </div>
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Loại bài tập:</strong></span>
                        </div>
                        <div class="content">
                            <span>${ exercise.type === 'code' ? 'Lập trình' : 'Trắc nghiệm' }</span>
                        </div>
                    </div>
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Cấp độ:</strong></span>
                        </div>
                        <div class="content">
                            <span>${ exercise.level }</span>
                        </div>
                    </div>
                    <div class="row gap-8">
                        <div class="label">
                            <span><strong>Điểm thưởng:</strong></span>
                        </div>
                        <div class="content">
                            <span>${ exercise.bonus_scores }</span>
                        </div>
                    </div>
                    <div class="metadata row gap-16">
                        <p>Tạo bởi <strong>${ exercise.created_by_username }</strong> vào lúc <strong>${ exercise.created_at }</strong></p>
                        ${
                            exercise.updated_by ? 
                            '<p>Cập nhật bởi <strong>' + exercise.updated_by_username  + '</strong> vào lúc <strong>' + exercise.updated_at + '</strong></p>'
                            :
                            '' 
                        }
                    </div>
                </div>
            </div>
        </div> 
    `);

    if (exercise.type === 'code') {
        $adminContainer.append(createCodeExerciseInfo(exercise.code_exercise));
        createCodeEditor(exercise.code_exercise);
    } else {
        $adminContainer.append(createMultipleChoiceExerciseInfo(exercise.multiple_choice_exercise))
    }
}

function createCodeExerciseInfo (code_exercise) {
    const testCasesTable = `
        <table class="testcase-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Input</th>
                    <th>Output</th>
                </tr>
            </thead>
            <tbody>
                ${code_exercise.test_cases.map((testCase, index) => `
                    <tr>
                        <td><span class="center">${index + 1}</span></td>
                        <td><span>${testCase.input || ''}</span></td>
                        <td><span>${testCase.output || ''}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    return `
        <div class="row full-width gap-24">
            <div class="panel code-exercise-info__container col scale-up-ver-top" style="width: calc(50% - 12px)">
                <div class="panel__header row flex-box item-center">
                    <span>Thông tin bài tập lập trình</span>
                    <div>
                    </div>
                </div>
                <div class="panel__body col gap-24">
                    <div class="col gap-8">
                        <h3>Ngôn ngữ lập trình</h3>
                        <div>${ code_exercise.language }</div>
                    </div>
                    <div class="col gap-8">
                        <h3>Đề bài</h3>
                        <div>${ code_exercise.content }</div>
                    </div>
                    <div class="col gap-8">
                        <h3>Code khởi đầu</h3>
                        <div><textarea id="code_editor"></textarea></div>
                    </div>
                </div>
            </div>
            <div class="panel code-exercise-info__container col scale-up-ver-top" style="width: calc(50% - 12px)">
                <div class="panel__header row flex-box item-center">
                    <span>Danh sách testcase</span>
                    <div>
                    </div>
                </div>
                <div class="panel__body col gap-24">
                    ${testCasesTable}
                </div>
            </div>
        </div>
    `
}

function createMultipleChoiceExerciseInfo (multiple_choice_exercise) {
    return `
        <div class="panel emultiple-choice-xercise-info__container col full-width scale-up-ver-top">
            <div class="panel__header row flex-box item-center">
                <span>Danh sách câu hỏi trắc nghiệm</span>
                <div>
                </div>
            </div>
            <div class="panel__body col gap-24">
                ${ createListExerciseQuestionComponent(multiple_choice_exercise) }
            </div>
        </div> 
    `
}

function createCodeEditor(code_exercise) {
    // Xác định mode dựa trên programming_language
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
        mode: mode, // Gán mode dựa trên topic
        theme: "default",
        tabSize: 4,
        indentWithTabs: true,
        lineWrapping: true,
        indentUnit: 4,
        readOnly: true,
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

    code_editor.setValue(code_exercise.starter_code || 'Không')
}