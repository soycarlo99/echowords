document.addEventListener("DOMContentLoaded", () => {
  const difficultyBtns = document.querySelectorAll(".difficulty-btn");
  const initialTimeText = document.getElementById("initialTime");
  const correctBonusText = document.getElementById("correctBonusValue");
  const rewriteBonusText = document.getElementById("rewriteBonusValue");

  const difficultySettings = {
    easy: {
      initialTime: 60,
      correctWordBonus: 3,
      rewriteWordBonus: 1.5,
    },
    medium: {
      initialTime: 30,
      correctWordBonus: 2,
      rewriteWordBonus: 1,
    },
    hard: {
      initialTime: 15,
      correctWordBonus: 1,
      rewriteWordBonus: 0.5,
    },
    extreme: {
      initialTime: 10,
      correctWordBonus: 0.5,
      rewriteWordBonus: 0.25,
    },
  };

  // Get saved difficulty or default to medium
  let selectedDifficulty = localStorage.getItem("gameDifficulty") || "medium";

  function updateDifficultyDisplay(difficulty) {
    const settings = difficultySettings[difficulty];
    initialTimeText.textContent = `Initial Time: ${settings.initialTime} seconds`;
    correctBonusText.textContent = `+${settings.correctWordBonus} seconds`;
    rewriteBonusText.textContent = `+${settings.rewriteWordBonus} seconds`;

    // Update active button
    difficultyBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.difficulty === difficulty);
    });

    // Update game settings
    if (window.gameState) {
      window.gameState.remainingSeconds = settings.initialTime;
      window.gameState.correctWordBonus = settings.correctWordBonus;
      window.gameState.rewriteWordBonus = settings.rewriteWordBonus;
    }
  }

  difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedDifficulty = btn.dataset.difficulty;
      localStorage.setItem("gameDifficulty", selectedDifficulty);
      updateDifficultyDisplay(selectedDifficulty);
    });
  });

  // Set initial difficulty display
  updateDifficultyDisplay(selectedDifficulty);
});

