document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.animation-card');
    const previewBoxes = document.querySelectorAll('.preview-box');
    
    const currentAnimation = localStorage.getItem('selectedAnimation') || 'default';
    updateSelectedButton(currentAnimation);

    previewBoxes.forEach(box => {
        const animationType = box.closest('.animation-card').dataset.animation;
        box.setAttribute('data-preview', animationType);
        
        box.addEventListener('mouseenter', () => {
            const previewText = box.querySelector('.preview-text');
            previewText.style.animation = 'none';
            previewText.offsetHeight;
            
            let animationName;
            switch(animationType) {
                case 'confetti':
                    animationName = 'confettiBurst';
                    break;
                case 'gradient':
                    animationName = 'gradientWave';
                    break;
                    case 'wave':
                        animationClass = 'liquid-wave';
                        addBubbles(input);
                        break;
                case 'neon':
                    animationName = 'neonGlow';
                    break;
                case 'flip':
                    animationName = 'flip3D';
                    break;
            }
            previewText.style.animation = `${animationName} 1s forwards`;

            function addBubbles(element) {
                for(let i = 0; i < 12; i++) {
                    const bubble = document.createElement('span');
                    bubble.style.left = `${Math.random() * 100}%`;
                    bubble.style.width = bubble.style.height = 
                        `${Math.random() * 4 + 2}px`;
                    bubble.style.animationDelay = `${Math.random() * 0.5}s`;
                    element.appendChild(bubble);
                }
            }
        });



        box.addEventListener('mouseleave', () => {
            const previewText = box.querySelector('.preview-text');
            previewText.style.animation = 'none';
            previewText.offsetHeight;
            previewText.style.removeProperty('animation');
        });
    });

    cards.forEach(card => {
        const selectBtn = card.querySelector('.select-btn');
        const animationType = card.dataset.animation;

        selectBtn.addEventListener('click', () => {
            localStorage.setItem('selectedAnimation', animationType);
            updateSelectedButton(animationType);
        });
    });

    function updateSelectedButton(selectedAnimation) {
        document.querySelectorAll('.select-btn').forEach(btn => {
            btn.classList.remove('selected');
            btn.textContent = 'Select';
        });

        const selectedCard = document.querySelector(`[data-animation="${selectedAnimation}"]`);
        if (selectedCard) {
            const btn = selectedCard.querySelector('.select-btn');
            btn.classList.add('selected');
            btn.textContent = 'Selected';
        }
    }
});