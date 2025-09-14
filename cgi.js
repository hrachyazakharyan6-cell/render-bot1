const { chromium } = require('playwright');
const { exec } = require('child_process');

// Telegram bot config
const botToken = "7622442460:AAFkXoCXZYGdMgFmEgNyMJTN1IRGEyQtFk0";
const chatId = "7811644575"; // your chat ID

// Group 1 and Group 2
const group1 = [1, 2, 3, 4, 5, 6, 16, 17, 18, 19, 20, 21, 25, 26, 27, 34, 35, 36];
const group2 = [7, 8, 9, 10, 11, 12, 13, 14, 15, 22, 23, 24, 28, 29, 30, 31, 32, 33];

// Helper to send Telegram message
async function sendTelegramMessage(message) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
    const data = await res.json();
    if (data.ok) console.log("✅ Telegram message sent:", message);
    else console.error("❌ Telegram API error:", data);
  } catch (err) {
    console.error("❌ Fetch error:", err);
  }
}

// Helper to check if numbers all belong to a group
const checkGroup = (group, numbersToCheck) =>
  numbersToCheck.every(num => group.includes(parseInt(num)));

(async () => {
  while (true) {
    try {
      async function scrape(waitTime) {
        const browser = await chromium.launch({
          headless: true,
          args: ['--disable-blink-features=AutomationControlled']
        });

        const context = await browser.newContext({
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
          viewport: { width: 1280, height: 800 }
        });

        const page = await context.newPage();

        await page.addInitScript(() => {
          Object.defineProperty(navigator, "webdriver", { get: () => false });
        });

        await page.goto('https://gamblingcounting.com/immersive-roulette', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(waitTime);

        const text = await page.evaluate(() => document.body.innerText);

        const startRegex = /History of rounds\s*Last 200 spins/;
        const endRegex = /Immersive Roulette telegram bot/;

        const startMatch = text.match(startRegex);
        const endMatch = text.match(endRegex);

        if (startMatch && endMatch) {
          const startIndex = text.indexOf(startMatch[0]);
          const endIndex = text.indexOf(endMatch[0]);

          if (endIndex > startIndex) {
            const extracted = text.substring(startIndex + startMatch[0].length, endIndex).trim();
            const numbers = extracted.match(/\d+/g);
            await browser.close();
            return numbers;
          }
        }

        await browser.close();
        return null;
      }

      // First attempt
      let numbers = await scrape(5000);

      // Second attempt only if first failed
      if (!numbers) {
        console.log("⚠️ No numbers found first try, waiting longer and trying again...");
        numbers = await scrape(10000);
      }

      if (!numbers) {
        const msg = "❌ No numbers found after two attempts!";
        console.log(msg);
        exec(`termux-notification --title "Roulette Alert" --content "${msg}"`);
        await sendTelegramMessage(msg);
      } else {
        const firstNumbers = numbers.slice(0, 20);
        console.log("🔢 First 20 numbers:", firstNumbers.join(", "));

        const firstExtractedNumber = firstNumbers[0];

        for (let i = 5; i <= 20; i++) {
          const slice = firstNumbers.slice(0, i);
          const group1Check = checkGroup(group1, slice);
          const group2Check = checkGroup(group2, slice);

          if (group1Check) {
            const numbersText = slice.join(', ');
            exec(`termux-notification --title "Roulette Alert" --content "${numbersText}"`);
            await sendTelegramMessage(`✅ ${numbersText}`);
          } else if (group2Check) {
            const numbersText = slice.join(', ');
            exec(`termux-notification --title "Roulette Alert" --content "${numbersText}"`);
            await sendTelegramMessage(`❌ ${numbersText}`);
          }
        }
      }

    } catch (error) {
      const msg = `❌ Error during scraping: ${error.message}`;
      console.error(msg);
      exec(`termux-notification --title "Roulette Alert" --content "${msg}"`);
      await sendTelegramMessage(`❌ ${msg}`);
    }

    await new Promise(res => setTimeout(res, 2000));
  }
})();
