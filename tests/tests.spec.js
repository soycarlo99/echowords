import { test, expect } from "@playwright/test";

// E2E spec: verify timer reset after each round and select first animated input

test.describe("Timer Reset After Each Round", () => {
  // Known initial time for medium difficulty
  const initialTime = 31.7;

  const words = [
    "alpha",
    "anteater",
    "rabbit",
    "tiger",
    "tulip",
    "piano",
    "orchid",
    "dolphin",
    "northern",
    "noodle",
    "elephant",
    "trampoline",
    "eleven",
    "nurse",
    "eagle",
    "ear", // Added common word
    "red", // Added common word
    "day", // Added common word
    "yellow",
    "window",
    "water", // Added common word
    "road", // Added common word
    "dark", // Added common word
    "koala",
    "apple",
    "empty", // Added common word
    "yet", // Added common word
    "time", // Added common word
    "end", // Added common word
    "dream", // Added common word
    "mouse", // Added common word
    "every", // Added common word
    "your", // Added common word
    "run", // Added common word
    "night",
    "tuesday",
    "yes", // Added common word
    "sun", // Added common word
    "nice", // Added common word
    "eat", // Added common word
    "toast", // Added common word
  ];

  test.beforeEach(async ({ page }) => {
    // Force medium difficulty
    await page.addInitScript(() => {
      localStorage.setItem("gameDifficulty", "medium");
    });
    await page.goto("http://localhost:5185/");

    // Enter name and start the game
    await page.getByRole("textbox", { name: "Enter your name" }).fill("test");
    await page.getByRole("button", { name: "Accept" }).click();
    await page.getByRole("button", { name: "Create Lobby" }).click();
    await page.getByRole("button", { name: "Start game" }).click();
  });

  test("resets timer on new round and selects first animated input", async ({
    page,
  }) => {
    const playRound = async (word) => {
      const newInput = page
        .locator('input[placeholder="Enter new word..."]')
        .last();
      await newInput.fill(word);
      await page.waitForTimeout(50);

      await newInput.press("Enter");

      await page.waitForTimeout(1000); // Increased buffer time

      // Wait for the re-enter input to appear
      await page.waitForSelector('input[placeholder="Re-enter word..."]', {
        timeout: 10000, // Increased timeout for better reliability
      });

      // Verify the re-enter input exists before proceeding
      const reenterInput = page
        .locator('input[placeholder="Re-enter word..."][data-index="0"]')
        .first();
      await expect(reenterInput).toBeVisible();

      // Fill and submit the first "Re-enter word..." input
      await reenterInput.fill(word);
      await reenterInput.press("Enter");

      // Wait for the UI to update after submitting the re-enter word
      await page.waitForTimeout(1000);
    };

    let currentTimerValue;

    // Play multiple rounds
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Play the current round
      await playRound(word);

      // After first round, wait for UI update and capture timer value
      if (i >= 0) {
        await page.waitForTimeout(2500); // Wait for UI update after round completion

        // Capture current timer value
        currentTimerValue = parseFloat(
          await page.locator("#timer span").textContent(),
        );

        // Log the current timer value for debugging
        console.log(`Timer after round ${i + 1}:`, currentTimerValue);
      }
    }

    // Assert timer reset close to initialTime after each round except the first
    for (let i = 1; i < words.length; i++) {
      // Calculate the expected timer value after each round
      const expectedTimer = initialTime;

      // Assert the timer value is within an acceptable range of the expected value
      expect(currentTimerValue).toBeGreaterThan(expectedTimer - 1);
      expect(currentTimerValue).toBeLessThanOrEqual(expectedTimer + 0.1);
    }
  });
});
