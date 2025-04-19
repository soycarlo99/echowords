import { test, expect } from "@playwright/test";



test.describe("Timer Reset After Each Round", () => {
  
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
    "ear", 
    "red", 
    "day", 
    "yellow",
    "window",
    "water", 
    "road", 
    "dark", 
    "koala",
    "apple",
    "empty", 
    "yet", 
    "time", 
    "end", 
    "dream", 
    "mouse", 
    "every", 
    "your", 
    "run", 
    "night",
    "tuesday",
    "yes", 
    "sun", 
    "nice", 
    "eat", 
    "toast", 
  ];

  test.beforeEach(async ({ page }) => {
    
    await page.addInitScript(() => {
      localStorage.setItem("gameDifficulty", "medium");
    });
    await page.goto("http:

    
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

      await page.waitForTimeout(1000); 

      
      await page.waitForSelector('input[placeholder="Re-enter word..."]', {
        timeout: 10000, 
      });

      
      const reenterInput = page
        .locator('input[placeholder="Re-enter word..."][data-index="0"]')
        .first();
      await expect(reenterInput).toBeVisible();

      
      await reenterInput.fill(word);
      await reenterInput.press("Enter");

      
      await page.waitForTimeout(1000);
    };

    let currentTimerValue;

    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      
      await playRound(word);

      
      if (i >= 0) {
        await page.waitForTimeout(2500); 

        
        currentTimerValue = parseFloat(
          await page.locator("#timer span").textContent(),
        );

        
        console.log(`Timer after round ${i + 1}:`, currentTimerValue);
      }
    }

    
    for (let i = 1; i < words.length; i++) {
      
      const expectedTimer = initialTime;

      
      expect(currentTimerValue).toBeGreaterThan(expectedTimer - 1);
      expect(currentTimerValue).toBeLessThanOrEqual(expectedTimer + 0.1);
    }
  });
});
