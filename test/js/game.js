const stages = [
    {
        id: 'start',
        title: 'The Ascending Path',
        text: 'Welcome to the 70th Anniversary of Chengdu University of Technology (CDUT). Over the decades, generations of scholars have climbed the peaks of knowledge, much like ascending a formidable mountain. Are you ready to retrace their steps?',
        progress: 0,
        mountainPeak: 'polygon(0 100%, 20% 60%, 50% 20%, 80% 60%, 100% 100%)',
        choices: [
            { text: 'Begin the Climb', next: 'stage1' }
        ]
    },
    {
        id: 'stage1',
        title: 'Stage 1: The Foundation (1956)',
        text: 'You stand at the foot of the mountain. It is 1956, the year Chengdu Institute of Geology is established to meet the nation\'s urgent need for geological talent. What was the driving spirit of this era?',
        progress: 25,
        mountainPeak: 'polygon(0 100%, 10% 70%, 50% 15%, 90% 70%, 100% 100%)',
        choices: [
            { text: '"Exploring the unknown, serving the nation."', next: 'stage2' },
            { text: '"Seeking personal glory."', next: 'stage1_fail' }
        ]
    },
    {
        id: 'stage1_fail',
        title: 'A Misstep',
        text: 'The true spirit of 1956 was rooted in national service and pioneering exploration. Let\'s try again.',
        progress: 0,
        mountainPeak: 'polygon(0 100%, 20% 60%, 50% 20%, 80% 60%, 100% 100%)',
        choices: [
            { text: 'Reflect and try again', next: 'stage1' }
        ]
    },
    {
        id: 'stage2',
        title: 'Stage 2: Broadening Horizons (1970s-1990s)',
        text: 'You have reached the mountainside. The institution expands beyond traditional geology into geophysics, environmental engineering, and more. The path diverges. Which branch will you explore to build a stronger foundation?',
        progress: 50,
        mountainPeak: 'polygon(0 100%, 5% 80%, 50% 10%, 95% 80%, 100% 100%)',
        choices: [
            { text: 'Delve into Geophysics', next: 'stage3' },
            { text: 'Focus on Environmental Engineering', next: 'stage3' }
        ]
    },
    {
        id: 'stage3',
        title: 'Stage 3: The Merger (2001)',
        text: 'You approach the shoulder of the mountain. It is 2001, a time of integration. Multiple institutions merge to form the modern Chengdu University of Technology. A deep chasm lies ahead. How will you cross it?',
        progress: 75,
        mountainPeak: 'polygon(0 100%, 0% 90%, 50% 5%, 100% 90%, 100% 100%)',
        choices: [
            { text: 'Build a bridge of interdisciplinary collaboration', next: 'stage4' },
            { text: 'Attempt to jump alone', next: 'stage3_fail' }
        ]
    },
    {
        id: 'stage3_fail',
        title: 'The Chasm is Too Wide',
        text: 'In the modern era, complex problems require interdisciplinary teamwork. The merger symbolized unity and shared strength.',
        progress: 50,
        mountainPeak: 'polygon(0 100%, 5% 80%, 50% 10%, 95% 80%, 100% 100%)',
        choices: [
            { text: 'Embrace collaboration', next: 'stage3' }
        ]
    },
    {
        id: 'stage4',
        title: 'Stage 4: The Peak (2017-Present)',
        text: 'You are nearing the summit. CDUT enters the "Double First-Class" era, aiming for world-class disciplines. The climb is steep, but the view is breathtaking. What is the ultimate goal of this ascent?',
        progress: 95,
        mountainPeak: 'polygon(0 100%, 0% 100%, 50% 0%, 100% 100%, 100% 100%)',
        choices: [
            { text: 'To stop and rest at the peak', next: 'stage4_fail' },
            { text: 'To reach new heights and envision the future', next: 'gallery_transition' }
        ]
    },
    {
        id: 'stage4_fail',
        title: 'A Limitless Sky',
        text: 'The pursuit of knowledge has no final peak. The "Double First-Class" initiative is a continuous journey of excellence.',
        progress: 75,
        mountainPeak: 'polygon(0 100%, 0% 90%, 50% 5%, 100% 90%, 100% 100%)',
        choices: [
            { text: 'Keep ascending', next: 'stage4' }
        ]
    }
];

let currentStageId = 'start';

function renderStage(stageId) {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    currentStageId = stageId;

    const titleEl = document.getElementById('stage-title');
    const textEl = document.getElementById('narrative-text');
    const choicesEl = document.getElementById('choices-container');
    const progressEl = document.getElementById('climb-progress');
    const mountainBg = document.getElementById('mountain-bg');
    const contentPanel = document.getElementById('game-content');

    // Animate out
    contentPanel.style.opacity = 0;
    contentPanel.style.transform = 'translateY(-20px)';

    setTimeout(() => {
        titleEl.textContent = stage.title;
        textEl.textContent = stage.text;
        
        choicesEl.innerHTML = '';
        stage.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            btn.onclick = () => handleChoice(choice.next);
            choicesEl.appendChild(btn);
        });

        progressEl.style.width = `${stage.progress}%`;
        mountainBg.style.clipPath = stage.mountainPeak;

        // Animate in
        contentPanel.style.opacity = 1;
        contentPanel.style.transform = 'translateY(0)';
    }, 400); // Wait for fade out
}

function handleChoice(nextStageId) {
    if (nextStageId === 'gallery_transition') {
        transitionToGallery();
    } else {
        renderStage(nextStageId);
    }
}

function transitionToGallery() {
    const progressEl = document.getElementById('climb-progress');
    progressEl.style.width = '100%';
    
    const mountainBg = document.getElementById('mountain-bg');
    mountainBg.style.clipPath = 'polygon(0 100%, 0% 100%, 50% -20%, 100% 100%, 100% 100%)';

    const gameContent = document.getElementById('game-content');
    gameContent.style.opacity = 0;

    setTimeout(() => {
        document.getElementById('game-view').classList.remove('active');
        document.getElementById('gallery-view').classList.add('active');
        
        // Initialize Gallery if not already
        if (window.initGallery) {
            window.initGallery();
        }
    }, 1500);
}

// Initialize game on load
document.addEventListener('DOMContentLoaded', () => {
    // slight delay for initial animation
    setTimeout(() => {
        renderStage('start');
    }, 500);
});
