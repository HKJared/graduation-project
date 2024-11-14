// TODO: Component chủ đề
function createTopicComponent(topic) {
    const baseStyle = `background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.024) 0%, rgba(0, 0, 0, 0.174) 57%), url('${ topic.image_url || '/images/image.png'}');`;
    const topicUrl = `/system-exercise-topic?name=${ topic.name }&id=${ topic.id }`;
    
    let actionText = 'Bắt đầu';
    let progressBar = '';

    if (topic.is_completed) {
        actionText = 'Xem lại';
        progressBar = '<div class="progress-bar"><div class="progress-bar__fill" style="width: 100%;"></div></div>';
    } else if (!topic.completed_exercises_percentage) {
        actionText = 'Tiếp tục';
        progressBar = `<div class="progress-bar"><div class="progress-bar__fill" style="width: ${ topic.completed_exercises_percentage }%;"></div></div>`;
    } else if (topic.is_locked) {
        return `
            <div class="topic-item locked" style="${baseStyle}">
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
        <div class="topic-item ${topic.is_completed ? 'continue' : ''}" style="${baseStyle}">
            <div class="name"><span>${ topic.name }</span></div>
            <div class="description"><span>${ topic.description }</span></div>
            <div class="action"><a href="${ topicUrl }" class="spa-action">${ actionText }</a></div>
            ${progressBar}
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
            return `
                <div class="topic-item" style="background-image: linear-gradient(
                        to bottom, 
                        rgba(0, 0, 0, 0.024) 0%, 
                        rgba(0, 0, 0, 0.174) 57%
                    ), url('${topic.imageUrl || '/images/image.png'}');">
                    <div class="name">
                        <span>${topic.name}</span>
                    </div>
                    <div class="description">
                        <span>${topic.description}</span>
                    </div>
                    <div class="action">
                        <button>Bắt đầu</button>
                    </div>
                </div>
            `;
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