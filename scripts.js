let quizData;
let currentQuestion = 0;
let choices = [];
let isNavigating = false; // Add this at the top with other variables

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('start-button').addEventListener('click', startQuiz);
    document.getElementById('back-button').addEventListener('click', goBack);
    // document.getElementById('restart-button').addEventListener('click', restartQuiz);
    document.getElementById('option1').addEventListener('click', () => selectOption('Regulier'));
    document.getElementById('option2').addEventListener('click', () => selectOption('Agora'));
});

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        quizData = data.onderdelen;
    });

function startQuiz() {
    showView('quiz-view');
    currentQuestion = 0;
    choices = [];
    showQuestion();
}

function showQuestion() {
    const question = quizData[currentQuestion];
    document.getElementById('progress').textContent = 
        `${currentQuestion + 1}. ${question.onderdeelnaam}`;
    document.getElementById('current-topic').textContent = question.vraag;
    // document.getElementById('current-topic').textContent = question.onderdeelnaam;
    // document.getElementById('progress').textContent = 
    //     `Vraag ${currentQuestion + 1} van ${quizData.length}`;
    
    // Show/hide back button based on question number
    document.getElementById('back-button').style.display = 
        currentQuestion > 0 ? 'inline-block' : 'none';

    const options = document.querySelectorAll('.option');
    ['Regulier', 'Agora'].forEach((type, index) => {
        options[index].querySelector('.child-text').textContent = 
            question.opties[type].kind;
        options[index].querySelector('.parent-text').textContent = 
            question.opties[type].ouder;
    });
}

function selectOption(choice) {
    if (isNavigating) return;
    isNavigating = true;
    
    // Add animation class
    const optionElement = choice === 'Regulier' ? 
        document.getElementById('option1') : 
        document.getElementById('option2');
    
    optionElement.classList.add('clicking');
    setTimeout(() => optionElement.classList.remove('clicking'), 300);
    
    choices[currentQuestion] = choice; // Set choice at current index instead of pushing
    
    if (currentQuestion < quizData.length - 1) {
        currentQuestion++;
        showQuestion();
    } else {
        showResults();
    }
    
    setTimeout(() => isNavigating = false, 300); // Allow next action after 300ms
}

function goBack() {
    if (isNavigating || currentQuestion <= 0) return;
    isNavigating = true;
    
    currentQuestion--;
    choices.length = currentQuestion; // Remove choices after current question
    showQuestion();
    
    setTimeout(() => isNavigating = false, 300);
}

function showResults() {
    showView('stats-view');
    
    // Calculate overall stats
    const regulierCount = choices.filter(c => c === 'Regulier').length;
    const agoraCount = choices.filter(c => c === 'Agora').length;
    const total = choices.length;

    // Show overall percentages
    const regulierPercentage = Math.round(regulierCount/total * 100);
    const agoraPercentage = Math.round(agoraCount/total * 100);

    document.getElementById('regulier-stat').style.height = `${regulierPercentage}%`;
    document.getElementById('agora-stat').style.height = `${agoraPercentage}%`;
    document.getElementById('regulier-percentage').textContent = `${regulierPercentage}%`;
    document.getElementById('agora-percentage').textContent = `${agoraPercentage}%`;

    // Calculate theme stats
    const themes = ['Structuur', 'Nieuwsgierigheid', 'Samenwerking', 'Motivatie'];
    themes.forEach(theme => {
        const themeQuestions = quizData.filter(q => q.thema === theme);
        const themeAnswers = themeQuestions.map(q => 
            choices[quizData.indexOf(q)]
        ).filter(c => c); // Filter out undefined answers
        
        if (themeAnswers.length > 0) {
            const themeAgora = themeAnswers.filter(c => c === 'Agora').length;
            const themePercentage = (themeAgora / themeAnswers.length) * 100;
            
            const percentElement = document.getElementById(`${theme.toLowerCase()}-percentage`);
            percentElement.style.left = `${themePercentage}%`;
            percentElement.innerHTML = `<span class="stat-value">${Math.round(themePercentage)}%</span>`;
        }
    });
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
}

function restartQuiz() {
    showView('welcome-view');
}

