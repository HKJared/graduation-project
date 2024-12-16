$(document).ready(async function() {
    // Thêm lớp active vào nav-item tương ứng
    $('.nav-item').removeClass('active');
    $('#practice_nav').addClass('active');
    updateUnderline();

    setTitle('Chủ đề luyện tập')

    if (!topics.length) {
        const response = await userApi('topics');

        if (response && response.topics) {
            topics = response.topics
        }
    }   

    const url = window.location.href;
    const urlParams = new URLSearchParams(new URL(url).search);
    const topicId = urlParams.get('id');

    const { topic } = await userApi(`topic?topic_id=${ topicId }`);

    topic.next_topics = findNextTopics(topics, topic);

    showTopic(topic);
});

function showTopic(topic) { console.log(topic)
    const $container = $('.system_exercise_topic__container');

    if (!topic) {
        $container.append(createAlertNotFoundComponent('Không tìm thấy chủ đề!'))
        return;
    }

    $container.append(`
        <div class="topic_info row gap-48 center" style="
                        background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.174) 57%), url('${ topic.image_url || '/images/image.png'}');
                        background-repeat: no-repeat;
                        background-size: cover;
                        background-position: center;
        ">
            <div class="icon">
                <img src="/images/logo-oval.png" alt="">
            </div>
            <div class="col gap-8">
                <div class="topic_programming_language slide-left">
                    <span>${ topic.programming_language == 'Multi' ? 'Đa ngôn ngữ' : topic.programming_language }</span>
                </div>
                <div class="topic_name slide-left" style="--delay: 0.3s">
                    <span>${ topic.name }</span>
                </div>
                <div class="topic_description slide-left" style="--delay: 0.6s">
                    <span>${ topic.description }</span>
                </div>
            </div>
        </div>
        <div class="row gap-24 full-width">
            <div class="overview__container col">
                <div class="topic_conditions col panel full-width">
                    <div class="row">
                        <div class="icon"><ion-icon name="ellipse-outline"></ion-icon></div>
                        <div class="col slide-right" style="--delay: 0.2s">
                            <h3>Điểm thưởng</h3>
                            <span>Bạn sẽ nhận được ${ topic.bonus_points } điểm thưởng khi hoàn thành.</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="icon"><ion-icon name="ellipse-outline"></ion-icon></div>
                        <div class="col slide-right" style="--delay: 0.5s">
                            <h3>Điều kiện hoàn thành</h3>
                            <span>Phải hoàn thành tối thiểu ${ topic.min_required_exercises } bài tập và đạt được ít nhất ${ topic.min_required_score } điểm để hoàn thành chủ đề này.</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="icon"><ion-icon name="clipboard-outline"></ion-icon></div>
                        <div class="col slide-right" style="--delay: 0.8s">
                            <h3>Tài liệu</h3>
                            <p class="suggest">Hãy đọc kỹ tài liệu được cung cấp bởi WiseOwl cho chủ đề này, nó sẽ thực sự giúp ích cho bạn trong quá trình luyện tập.</p>
                            <a href="${ topic.document_url }" target="_blank">Xem tài liệu</a>
                        </div>
                    </div>
                </div>
                <div class="next-topics_container col gap-24">
                    <div class="side__header">
                        <h2>Các chủ đề tiếp theo</h2>
                    </div>
                    <div class="side__body col">
                        ${ createListTopicComponent(topic.next_topics) }
                    </div>
                </div>
            </div>
            <div class="exercise_container flex-1 col gap-16">
                <div class="panel_header flex-box">
                    <h2>Danh sách bài tập</h2>
                    ${ createProcessOverview(topic) }
                </div>
                <div class="panel_body">
                    ${ createListTopicExerciseComponent(topic.exercises) }
                </div>
            </div>
        </div>
    `);
}

function findNextTopics(topics, currentTopic) {
    const nextTopics = topics.filter(topic => 
        topic.unlock_conditions.includes(currentTopic.id)
    );

    if (nextTopics.length > 0) {
        return nextTopics;
    }

    // Nếu không có next_topics, tìm các topic thỏa điều kiện fallback
    const fallbackTopics = topics.filter(topic => 
        topic.unlock_conditions.length === 0 && topic.level >= currentTopic.level && topic.id != currentTopic.id
    );

    return fallbackTopics.slice(0, 7); // Trả về tối đa 7 topic
}

function createProcessOverview(topic) {
    let total_scores = 0;
    let total_success_exercise = 0;

    const exercises = topic.exercises;

    for (let i = 0; i < exercises.length; i++) {
        if (exercises[i].status == 2) {
            total_scores += exercises[i].bonus_scores;
            total_success_exercise++;
        }
    }

    return `
        <div class="process-overview row gap-24">
            <span>Điểm của bạn: <strong class="${ total_scores >= topic.min_required_score ? 'success' : '' }">${ total_scores }</strong></span>
            <span>Bài tập hoàn thành: <strong class="${ total_success_exercise >= topic.min_required_exercises ? 'success' : '' }">${ total_success_exercise }</strong>/${ topic.total_exercises }</span>
        </div>
    `
}