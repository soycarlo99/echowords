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
                case 'default':
                    animationName = 'defaultFade';
                    break;
                case 'bounce':
                    animationName = 'bounceSuccess';
                    break;
                case 'spiral':
                    animationName = 'wiggleSuccess';
                    break;
                case 'glitch':
                    animationName = 'pulseSuccess';
                    break;
            }
            previewText.style.animation = `${animationName} 1s forwards`;
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