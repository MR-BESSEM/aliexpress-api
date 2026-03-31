const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());

app.get('/api', async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {
        // FIX URL
        const match = url.match(/item\/(\d+)/);
        if (match) {
            url = `https://www.aliexpress.com/item/${match[1]}.html`;
        }

        console.log("🔥 Opening browser...");

        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        );

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

        // ⏳ نستنى الصفحة تكمل
        await new Promise(r => setTimeout(r, 4000));

        const data = await page.evaluate(() => {
            let title = document.querySelector('meta[property="og:title"]')?.content || "";
            let image = document.querySelector('meta[property="og:image"]')?.content || "";
            let description = document.querySelector('meta[property="og:description"]')?.content || "";

            let rating = document.body.innerText.match(/([0-5]\.\d)\s*Stars/)?.[1] || "0";
            let reviews = document.body.innerText.match(/(\d+)\s*Reviews/)?.[1] || "0";
            let sold = document.body.innerText.match(/(\d+)\s*Sold/)?.[1] || "0";

            let price = document.body.innerText.match(/\$([\d.]+)/)?.[1] || null;

            return { title, image, description, rating, reviews, sold, price };
        });

        await browser.close();

        res.json({
            success: true,
            ...data
        });

    } catch (err) {
        console.log(err);

        res.json({
            success: false,
            error: "Puppeteer failed"
        });
    }
});

app.get('/', (req, res) => {
    res.send("🔥 Puppeteer API WORKING");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
