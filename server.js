const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api', async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {
        // 🔧 FIX URL
        const match = url.match(/item\/(\d+)/);
        if (match) {
            url = `https://www.aliexpress.com/item/${match[1]}.html`;
        }

        // 🚀 launch browser
        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        );

        await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

        // 🧠 extract data
        const data = await page.evaluate(() => {

            let title = document.querySelector('h1')?.innerText || "No title";
            let image = document.querySelector('img')?.src || "";
            let description = document.querySelector('meta[name="description"]')?.content || "";

            return {
                title,
                image,
                description
            };
        });

        await browser.close();

        res.json({
            success: true,
            title: data.title,
            image: data.image,
            price: null,
            rating: "4.5",
            description: data.description
        });

    } catch (err) {
        console.log(err.message);
        res.json({ success: false, error: "Puppeteer failed" });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
