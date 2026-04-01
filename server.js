const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// ==========================
// 🚀 LAUNCH BROWSER (Render Fix)
// ==========================
async function getBrowser() {
    return await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    });
}

// ==========================
// 📦 PRODUCT FETCH
// ==========================
app.get('/api/product', async (req, res) => {
    const productUrl = req.query.url;

    if (!productUrl) {
        return res.json({ success: false, error: "No URL" });
    }

    let browser;
    let page;

    try {
        browser = await getBrowser();
        page = await browser.newPage();

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119 Safari/537.36'
        );

        // ⚡ speed optimization
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(productUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // ==========================
        // 🧠 EXTRACT DATA
        // ==========================
        const data = await page.evaluate(() => {

            const clean = (txt) => txt?.trim() || "";

            const title =
                document.querySelector('h1')?.innerText ||
                document.title ||
                "Produit AliExpress 🔥";

            const price =
                document.querySelector('[class*="price"]')?.innerText || "";

            let image =
                document.querySelector('meta[property="og:image"]')?.content || "";

            if (image && image.startsWith("//")) {
                image = "https:" + image;
            }

            return {
                title: clean(title),
                price: clean(price),
                image
            };
        });

        res.json({
            success: true,
            title: data.title,
            price: data.price,
            image: data.image
        });

    } catch (err) {
        console.log("ERROR:", err.message);

        res.json({
            success: false,
            error: err.message
        });

    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
});

// ==========================
// 🧪 TEST
// ==========================
app.get('/', (req, res) => {
    res.send("🔥 Puppeteer API working");
});

// ==========================
app.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
});
