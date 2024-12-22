// TODO: Component chủ đề
function createTopicComponent(topic) {
    let actionHTML = `
        <a href="/admin/system-exercise-topic?name=${ topic.name }&id=${ topic.id }" class="spa-action center" title="Xem"><ion-icon name="scan-outline"></ion-icon></a>
    `;

    if (permissions.some(p => p.id === 12)) {
        if (topic.is_editable) {
            actionHTML += `
                <button class="lock-topic-btn center" data-topic-id="${ topic.id }"  title="Khóa chỉnh sửa"><ion-icon name="lock-closed-outline"></ion-icon></button>
            `;
        } else {
            actionHTML += `
                <button class="unlock-topic-btn center" data-topic-id="${ topic.id }"  title="Mở khóa chỉnh sửa"><ion-icon name="lock-open-outline"></ion-icon></button>
            `;
        }
    }

    if (permissions.some(p => p.id === 7)) {
        actionHTML += `
            <a href="/admin/edit-system-exercise-topic?name=${ topic.name }&id=${ topic.id }" class="edit-topic-btn center warning spa-action" data-topic-id="${ topic.id }" title="Chỉnh sửa"><ion-icon name="settings-outline"></ion-icon></a>
        `;
    }

    if (permissions.some(p => p.id === 8)) {
        actionHTML += `
            <button class="delete-topic-btn center danger" data-topic-id="${ topic.id }" title="Xóa"><ion-icon name="trash-outline"></ion-icon></button>
        `;
    }

    return `
        <div class="topic-item ${ topic.is_editable ? '' : 'non-editable' }"  id="topic_${ topic.id }"
            style="background-image: linear-gradient(
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
            <div class="action row gap-8">
                ${ actionHTML }
            </div>
        </div>
    `;
}

function createListTopicComponent(topics) {
    // Nhóm các topics theo level
    const groupedByLevel = topics.reduce((acc, topic) => {
        // Nếu chưa có nhóm cho level này thì tạo một nhóm mới
        if (!acc[topic.level]) {
            acc[topic.level] = [];
        }
        // Thêm topic vào nhóm tương ứng với level
        acc[topic.level].push(topic);
        return acc;
    }, {});

    // Tạo các phần tử HTML cho mỗi level
    const levelItems = Object.keys(groupedByLevel).map(level => {
        const levelTitle = `Cấp độ ${level}`;
        const levelTopicItems = groupedByLevel[level].map(topic => {
            return createTopicComponent(topic)
        }).join('');

        return `
            <div class="level_container col gap-16" id="level_${level}">
                <div class="level_title">${levelTitle}</div>
                <div class="level_topic_list">
                    ${levelTopicItems}
                </div>
            </div>
        `;
    }).join('');

    return `
    <div class="topic-list">
        ${levelItems}
    </div>
    `;
}

// TODO: Component câu hỏi trắc nghiệm
function createEditQuestionComponent(question) {
    if (!question || !question.id) {
        return ``;
    }

    if (question.exercise_id) { // nếu là câu hỏi đã có dữ liệu
        const type_options = [
            { value: 'single', text: 'Chọn một đáp án', is_selected: question.type == 'single' ? 1 : 0 },
            { value: 'multi', text: 'Chọn nhiều đáp án', is_selected: question.type == 'multi' ? 1 : 0 }
        ];

        // Tạo HTML cho các lựa chọn câu trả lời (options)
        const optionsHTML = question.options.map((option, index) => {
            return `
                <div class="question-option row full-width item-center gap-16 ${ option.is_correct ? 'is_correct' : '' }">
                    <button class="icon" title="Đánh dấu là đáp án đúng">
                        <ion-icon name="${ question.type == 'multi' ? 'square' : 'ellipse' }"></ion-icon>
                    </button>
                    <div class="content col">
                        <div class="wo-textarea">
                            <textarea name="" class="option__text" placeholder="Đáp án">${option.text}</textarea>
                        </div>
                        ${option.image_url ? `<img src="${option.image_url}" alt="Option Image" class="option-image">` : ''}
                    </div>
                    <div class="image center">
                        <label for="question_${question.id}_option_${index}" class="change-question-image center">
                            <ion-icon name="image-outline"></ion-icon>
                        </label>
                        <input type="file" id="question_${question.id}_option_${index}" ${option.image_url ? `data-image-url="${option.image_url}"` : ''}>
                    </div>
                    <div class="option-action">
                        <button class="remove-option-btn center"  title="Loại bỏ đáp án này">
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="edit-question-item col scale-up-ver-top" id="question_${question.id}">
                <div class="edit-row row gap-16">
                    <div class="col question_col">
                        <label for="">Nội dung câu hỏi <span>*</span></label>
                        <div class="wo-textarea">
                            <textarea name="" class="question">${question.question}</textarea>
                        </div>
                    </div>
                    <div class="col center image_col">
                        <label for="question-image_${question.id}" class="change-question-image">
                            <ion-icon name="image-outline"></ion-icon>
                        </label>
                        <input type="file" accept="" class="question_image_url" id="question-image_${question.id}" ${question.question_image_url ? `data-image-url="${question.question_image_url}"` : ''}>
                    </div>
                    <div class="col type_col">
                        <label for="">Loại câu hỏi</label>
                        ${createSelectComponent(type_options, 'question_type_' + question.id)}
                    </div>
                </div>
                <div class="question-options col full-width">
                    ${optionsHTML}
                </div>
                <div class="question__action row gap-16 item-center">
                    <button class="add-option-btn" title="Thêm đáp án"><ion-icon name="add-circle-outline"></ion-icon></button>
                    <button class="remove-question-btn" title="Xóa câu hỏi"><ion-icon name="trash-outline"></ion-icon></button>
                    <div class="row gap-4 item-center is_required">
                        <span>Bắt buộc</span>
                        <div class="wo-toggle center" title="Đánh dấu là bắt buộc">
                            <input type="checkbox"/>
                            <label for="">Toggle</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Nếu là câu hỏi chưa có dữ liệu
    const type_options = [
        { value: 'single', text: 'Chọn một đáp án', is_selected: 1 },
        { value: 'multi', text: 'Chọn nhiều đáp án', is_selected: 0 }
    ];
    return `
        <div class="edit-question-item col scale-up-ver-top" id="question_${question.id}">
            <div class="edit-row row gap-16">
                <div class="col question_col">
                    <label for="">Nội dung câu hỏi <span>*</span></label>
                    <div class="wo-textarea">
                        <textarea name="" class="question"></textarea>
                    </div>
                </div>
                <div class="col center image_col">
                    <label for="question-image_${question.id}" class="change-question-image" title="Thêm hình ảnh minh họa">
                        <ion-icon name="image-outline"></ion-icon>
                    </label>
                    <input type="file" accept="" class="question_image_url" id="question-image_${question.id}">
                </div>
                <div class="col type_col">
                    <label for="">Loại câu hỏi</label>
                    ${createSelectComponent(type_options, 'question_type_' + question.id)}
                </div>
            </div>
            <div class="question-options col full-width">
                <div class="question-option row full-width item-center gap-16">
                    <button class="icon" title="Đánh dấu là đáp án đúng">
                        <ion-icon name="ellipse"></ion-icon>
                    </button>
                    <div class="content col">
                        <div class="wo-textarea">
                            <textarea name="" class="option__text" placeholder="Đán án"></textarea>
                        </div>
                    </div>
                    <div class="image center">
                        <label for="question_${question.id}_option_1" class="change-question-image center" title>
                            <ion-icon name="image-outline"></ion-icon>
                        </label>
                        <input type="file" id="question_${question.id}_option_1">
                    </div>
                    <div class="option-action">
                        <button class="remove-option-btn center" title="Loại bỏ đáp án này">
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>
                </div>
                <div class="question-option row full-width item-center gap-16">
                    <button class="icon" title="Đánh dấu là đáp án đúng">
                        <ion-icon name="ellipse"></ion-icon>
                    </button>
                    <div class="content col">
                        <div class="wo-textarea">
                            <textarea name="" class="option__text" placeholder="Đán án"></textarea>
                        </div>
                    </div>
                    <div class="image center">
                        <label for="question_${question.id}_option_2" class="change-question-image center" title>
                            <ion-icon name="image-outline"></ion-icon>
                        </label>
                        <input type="file" id="question_${question.id}_option_2">
                    </div>
                    <div class="option-action">
                        <button class="remove-option-btn center" title="Loại bỏ đáp án này">
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                    </div>
                </div>
            </div>
            <div class="question__action row gap-16 item-center">
                <button class="add-option-btn" title="Thêm đáp án"><ion-icon name="add-circle-outline"></ion-icon></button>
                <button class="remove-question-btn" title="Xóa câu hỏi"><ion-icon name="trash-outline"></ion-icon></button>
                <div class="row gap-4 item-center is_required">
                    <span>Bắt buộc</span>
                    <div class="wo-toggle center" title="Đánh dấu là bắt buộc">
                        <input type="checkbox"/>
                        <label for="">Toggle</label>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createListNewQuestionComponent(quantity = 40) {
    let listNewQuestionComponent = ``
    for (let i = 1; i <= quantity; i++) {
        listNewQuestionComponent += createEditQuestionComponent({ id: i });
    }

    return `
        <div class="question-list col gap-48">
            ${ listNewQuestionComponent }
        </div>
    `
}

function createExerciseQuestionComponent(question, order) {
    if (!question || !question.id) {
        return ``;
    }

    // Tạo HTML cho các lựa chọn câu trả lời (options)
    const optionsHTML = question.options.map((option, index) => {
        return `
            <div class="question-option row full-width item-center gap-16 ">
                <button class="icon" title="Đánh dấu là đáp án đúng">
                    <ion-icon name="${ question.type == 'multi' ? 'square' : 'ellipse' }"></ion-icon>
                </button>
                <div class="content col">
                    <span>${option.text}</span>
                    ${option.image_url ? `<img src="${option.image_url}" alt="Option Image" class="option-image">` : ''}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="question-item col gap-8 scale-up-ver-top" id="question_${order}" data-question-id="${ question.id }" data-question-type="${ question.type }">
            <div class="edit-row col gap-8">
                <div class="col question_col">
                    <span class="question">Câu hỏi ${ order }: ${question.question} (${ question.type == 'single' ? 'Chọn một đáp án' : 'Chọn nhiều đáp án' })</span>
                </div>
                ${ question.question_image_url ? '<div><img src="' + question.question_image_url + '"></img></div>' : '' }
            </div>
            <div class="question-options col gap-8 full-width">
                ${optionsHTML}
            </div>
        </div>
    `;
}

function createListExerciseQuestionComponent(excercises) {
    if (!excercises || excercises.length == 0) {
        return createAlertNotFoundComponent('Danh sách câu hỏi trống')
    }

    let listExerciseHTML = ''

    for (let i = 0; i < excercises.length; i++) {
        listExerciseHTML += createExerciseQuestionComponent(excercises[i], i+1)
    }

    return `
        <div class="list-exercise-question col gap-24 scale-up-ver-top">
            ${ listExerciseHTML }
        </div>
    `
}

// TODO: Component testcase
function createEditTestcaseComponent(testcase) {
    if (testcase) {
        return `
            <div class="edit-testcase-item row gap-16 item-center">
                <div class="wo-textarea">
                    <textarea name="" class="input" placeholder="input">${ testcase.input }</textarea>
                </div>
                <div class="wo-textarea">
                    <textarea name="" class="output" placeholder="output">${ testcase.output }</textarea>
                </div>
            </div>
        `
    } else {
        return `
            <div class="edit-testcase-item row gap-16 item-center">
                <div class="wo-textarea">
                    <textarea name="" class="input" placeholder="input"></textarea>
                </div>
                <div class="wo-textarea">
                    <textarea name="" class="output" placeholder="output"></textarea>
                </div>
            </div>
        `
    }
}

function createListNewTestcaseComponent(quantity = 10) {
    let listNewQuestionComponent = '';
    for (let i = 1; i <= quantity; i++) {
        listNewQuestionComponent += createEditTestcaseComponent();
    }

    return `
        <div class="testcase-list col gap-8">
            ${ listNewQuestionComponent }
        </div>
    `
}

// TODO: Component bài tập của chủ đề
function createTopicExerciseComponent(exercise) {
    function createDisplayType(type) {
        if (type == 'multiple_choice') {
            return `
                <span>Trắc nghiệm</span>
            `
        }
        
        return `
            <span>Lập trình</span>
        `
    }

    function createDisplayLevel(level) {
        let displayLevel = ''
        switch(level) {
            case 'easy':
                displayLevel = `<span class="easy">Dễ</span>`;
                break;
            case 'medium':
                displayLevel = `<span class="medium">Trung bình</span>`;
                break;
            case 'hard':
                displayLevel = `<span class="hard">Khó</span>`;
                break;    
            default:
                displayLevel = `<span>Không xác định</span>`;
                break;
        }

        return displayLevel;
    }

    function createDisplayAction() {
        let actionContainer = `
            <a href="/admin/topic-exercise?title=${ exercise.title }&id=${ exercise.id }" class="spa-action success-bg center" title="Xem bài tập"><ion-icon name="scan-outline"></ion-icon></a>
        `;

        if (exercise.is_editable) {
            if (permissions.some(p => p.id === 10)) {
                actionContainer += `
                    <a href="/admin/edit-topic-exercise?title=${ exercise.title }&id=${ exercise.id }" class="edit-exercise-btn center warning-bg spa-action" title="Chỉnh sửa"><ion-icon name="settings-outline"></ion-icon></a>
                `;
            }

            if (permissions.some(p => p.id === 11)) {
                actionContainer += `
                    <button class="delete-exercise-btn center danger-bg" data-exercise-id="${ exercise.id }"  title="Xóa bài tập"><ion-icon name="trash-outline"></ion-icon></button>
                `;
            }
        }

        return `
            <div class="row gap-8">
                ${ actionContainer }
            </div>
        `
    }

    return `
        <div class="topic-exercise-item row full-width item-center">
            <div class="id_col">
                <span>${ exercise.id }</span>
            </div>
            <div class="title_col">
                <span>${ exercise.title }</span>
            </div>
            <div class="type_col center">
                ${ createDisplayType(exercise.type) }
            </div>
            <div class="level_col center">
                ${ createDisplayLevel(exercise.level) }
            </div>
            <div class="bonus_scores_col center">
                <span>${ exercise.bonus_scores }</span>
            </div>
            <div class="action_col">
                ${ createDisplayAction() }
            </div>
        </div>
    `
}

function createListTopicExerciseComponent(exercises = []) {
    if (!exercises.length) {
        
    }

    let listExercise = '';
    for (let i = 0; i < exercises.length; i++) {
        listExercise += createTopicExerciseComponent(exercises[i]);
    }

    return `
        <div class="topic-exercise-list col scale-up-ver-top">
            <div class="topic-exercise-header row full-width item-center">
                <div class="id_col">
                    <span>ID</span>
                </div>
                <div class="title_col">
                    <span>Tiêu đề</span>
                </div>
                <div class="type_col center">
                    <span>Phân loại</span>
                </div>
                <div class="level_col center">
                    <span>Cấp độ</span>
                </div>
                <div class="bonus_scores_col center">
                    <span>Điểm thưởng</span>
                </div>
                <div class="action_col">
                    <span>Hành động</span>
                </div>
            </div>
            ${ listExercise }
        </div>
    `
}