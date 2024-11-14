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