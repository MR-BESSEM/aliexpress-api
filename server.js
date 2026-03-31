const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/api", async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {
        // ✅ FIX LINK
        const match = url.match(/item\/(\d+)/);
        if (match) {
            url = `https://www.aliexpress.com/item/${match[1]}.html`;
        }

        console.log("🌍 Opening:", url);

const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu"
  ]
});

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        );

        await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 60000
        });

        // ⏳ نستنى الداتا تتشحن
        await page.waitForTimeout(3000);

        // 🔥 EXTRACT REAL DATA
        const data = await page.evaluate(() => {
            let title = document.querySelector("h1")?.innerText || "";

            let image =
                document.querySelector("img")?.src ||
                "";

            let price =
                document.querySelector(".product-price-value")?.innerText ||
                "";

            let rating =
                document.querySelector(".overview-rating-average")?.innerText ||
                "";

            let reviews =
                document.querySelector(".overview-rating-count")?.innerText ||
                "";

            let sold =
                document.body.innerText.match(/(\d+)\s*sold/i)?.[1] ||
                document.body.innerText.match(/(\d+)\s*vendus/i)?.[1] ||
                "0";

            return { title, image, price, rating, reviews, sold };
        });

        await browser.close();

        res.json({
            success: true,
            ...data
        });

    } catch (err) {
        console.log(err.message);

        res.json({
            success: false,
            error: "Scraping failed"
        });
    }
});

app.get("/", (req, res) => {
    res.send("PUPPETEER API WORKING 🚀");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
