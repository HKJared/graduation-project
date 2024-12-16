// TODO: Component chủ đề
function createTopicComponent(topic) {
    const baseStyle = `background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.024) 0%, rgba(0, 0, 0, 0.174) 57%), url('${ topic.image_url || '/images/image.png'}');`;
    const topicUrl = `/system-exercise-topic?name=${ topic.name }&id=${ topic.id }`;
    
    let actionText = 'Bắt đầu';
    let progressBar = '';

    if (topic.is_completed) {
        actionText = 'Xem lại';
        progressBar = '<div class="progress-bar"><div class="progress-bar__fill" style="width: 100%;"></div></div>';
    } else if (topic.completed_exercises_percentage) {
        actionText = 'Tiếp tục';
        progressBar = `<div class="progress-bar"><div class="progress-bar__fill" style="width: ${ topic.completed_exercises_percentage }%;"></div></div>`;
    } else if (topic.is_locked) {
        return `
            <div class="topic-item relative locked" style="${baseStyle}">
                <div class="name"><span>${ topic.name }</span></div>
                <div class="description"><span>${ topic.description }</span></div>
                <div class="action"><a href="${ topicUrl }" class="spa-action">${ actionText }</a></div>
                <div class="locked-screen">
                    <div class="locked-screen__body">
                        <span>LOCKED</span>
                        <div class="icon"><ion-icon name="lock-closed-outline"></ion-icon></div>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="topic-item relative ${topic.completed_exercises_percentage ? 'continue' : ''}" style="${baseStyle}">
            <div class="name"><span>${ topic.name }</span></div>
            <div class="description"><span>${ topic.description }</span></div>
            <div class="action"><a href="${ topicUrl }" class="spa-action">${ actionText }</a></div>
            ${progressBar}
        </div>
    `;
}

function createListTopicComponent(topics) {
    console.log(topics)
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
            // return `
            //     <div class="topic-item" style="background-image: linear-gradient(
            //             to bottom, 
            //             rgba(0, 0, 0, 0.024) 0%, 
            //             rgba(0, 0, 0, 0.174) 57%
            //         ), url('${topic.image_url || '/images/image.png'}');">
            //         <div class="name">
            //             <span>${topic.name}</span>
            //         </div>
            //         <div class="description">
            //             <span>${topic.description}</span>
            //         </div>
            //         <div class="action">
            //             <button>Bắt đầu</button>
            //         </div>
            //     </div>
            // `;
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

// TODO: Component bài tập chủ đề
function createTopicExerciseComponent(excercise) {
    // ? Tạo icon trạng thái và button hành động
    let iconHTML = '';
    let buttonHTML = '';
    switch (excercise.status) {
        case 0:
            iconHTML = '<span class="center"><ion-icon name="ellipse-outline"></ion-icon></span>';
            buttonHTML = `
                <a href="/system-exercise?title=${ excercise.title }&id=${ excercise.id }" class="warning-bg spa-action center" title="Bắt đầu làm">
                    <ion-icon name="play-outline"></ion-icon>
                </a>
            `
            break;
        case 1:
            iconHTML = '<span class="warning center"><ion-icon name="flame-outline"></ion-icon></span>';
            buttonHTML = `
                <a href="/system-exercise-result?title=${ excercise.title }&id=${ excercise.id }" class="warning-bg spa-action center" title="Xem lại bài làm">
                    <ion-icon name="scan-outline"></ion-icon>
                </a>
                <a href="/system-exercise?title=${ excercise.title }&id=${ excercise.id }" class="warning-bg spa-action center" title="Làm lại">
                    <ion-icon name="play-outline"></ion-icon>
                </a>
            `
            break;
        case 2:
            iconHTML = '<span class="success center"><ion-icon name="checkmark-circle-outline"></ion-icon></span>';
            buttonHTML = `
                <a href="/system-exercise-result?title=${ excercise.title }&id=${ excercise.id }" class="success-bg spa-action center" title="Xem lại bài làm">
                    <ion-icon name="scan-outline"></ion-icon>
                </a>
                <a href="/system-exercise?title=${ excercise.title }&id=${ excercise.id }" class="success-bg spa-action center" title="Làm lại">
                    <ion-icon name="play-outline"></ion-icon>
                </a>
            `
            break;
        default:
            iconHTML = '<span class="danger"><ion-icon name="alert-circle-outline"></ion-icon><span>';
            break;
    }

    // ? Phân loại bài tập
    let type = '';
    switch (excercise.type) {
        case 'multiple_choice':
            type = 'Trắc nghiệm';
            break;
        case 'code':
            type = 'Lập trình';
            break;
        default:
            break
    }

    return `
        <div class="topic-exercise-item row item-center">
            <div class="icon_col center">
                ${ iconHTML }
            </div>
            <div class="title_col">
                <span>${ excercise.title }</span>
            </div>
            <div class="type_col center">
                <span>${ type }</span>
            </div>
            <div class="bonus_scores_col center">
                <span>${ excercise.bonus_scores }</span>
            </div>
            <div class="level_col ${ excercise.level } center">
                <span>${ excercise.level }</span>
            </div>
            <div class="action_col row gap-16 item-center">
                ${ buttonHTML }
            </div>
        </div>
    `
}

function createListTopicExerciseComponent(excercises) {
    if (!excercises || !excercises.length) {
        return createAlertNotFoundComponent('Chủ đề này hiện chưa có bài tập.');
    }

    let listExercise = '';

    for (let i = 0; i < excercises.length; i++) {
        listExercise += createTopicExerciseComponent(excercises[i]);
    }

    return `
        <div class="topic-exercise-list">
            <div class="topic-exercise-header row item-center">
                <div class="icon_col center">
                </div>
                <div class="title_col">
                    <span>Tiêu đề</span>
                </div>
                <div class="type_col">
                </div>
                <div class="bonus_scores_col center">
                    <span>Điểm thưởng</span>
                </div>
                <div class="level_col">
                </div>
                <div class="action_col">
                </div>
            </div>
            ${ listExercise }
        </div>
    `;
}

// TODO: Component câu hỏi của bài tập trắc nghiệm
function createListPreviewQuestionComponent(numberQuestions) {
    let questionsHTML = '';

    for (let i = 1; i <= numberQuestions; i++) {
        questionsHTML += `
            <button id="preview_question_${ i }" class="preview-question-item col center">
                <span>${i}</span>
            </button>
        `
    }

    return `
        <div class="list-preview-question">
            ${ questionsHTML }
        </div>
    `
}

function createExerciseQuestionComponent(question, order) {
    console.log(question)
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