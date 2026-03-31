const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

// 🧠 CACHE (speed x10)
const cache = new Map();

app.get('/api', async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    // 🔥 FIX LINK
    const match = url.match(/item\/(\d+)/);
    if (match) {
        url = `https://www.aliexpress.com/item/${match[1]}.html`;
    }

    // ⚡ CACHE HIT
    if (cache.has(url)) {
        console.log("⚡ CACHE HIT");
        return res.json({ success: true, ...cache.get(url) });
    }

    try {
        console.log("🔥 Fetching:", url);

        // 🧠 FAKE REAL BROWSER
        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html",
                "Referer": "https://www.google.com/",
            },
            timeout: 15000
        });

        const $ = cheerio.load(html);

        // =========================
        // 🔥 TITLE + IMAGE
        // =========================
        let title = $('meta[property="og:title"]').attr('content') || $('title').text();
        let image = $('meta[property="og:image"]').attr('content') || "";

        let description = $('meta[property="og:description"]').attr('content') || "";

        // =========================
        // 💰 PRICE
        // =========================
        let price = null;
        const priceMatch = html.match(/"price":"([\d.]+)"/);
        if (priceMatch) price = parseFloat(priceMatch[1]);

        // =========================
        // ⭐ RATING + REVIEWS + SOLD (ULTRA FIX)
        // =========================
        let rating = "0";
        let reviews = "0";
        let sold = "0";

        // الطريقة 1 (JSON)
        const r1 = html.match(/"averageStar":"([\d.]+)"/);
        if (r1) rating = r1[1];

        const r2 = html.match(/"totalReview":(\d+)/);
        if (r2) reviews = r2[1];

        const r3 = html.match(/"tradeCount":"?(\d+)"/);
        if (r3) sold = r3[1];

        // الطريقة 2 (fallback)
        if (reviews === "0") {
            const r = html.match(/(\d+)\s*Reviews/);
            if (r) reviews = r[1];
        }

        if (sold === "0") {
            const s = html.match(/(\d+)\s*Sold/);
            if (s) sold = s[1];
        }

        // =========================
        // 🧼 CLEAN
        // =========================
        if (description.length > 150) {
            description = description.substring(0, 150) + "...";
        }

        if (!title) title = "Produit AliExpress";
        if (!image) image = "https://via.placeholder.com/300";

        const result = {
            title,
            image,
            price,
            rating,
            reviews,
            sold,
            description
        };

        // 💾 SAVE CACHE
        cache.set(url, result);

        res.json({
            success: true,
            ...result
        });

    } catch (err) {
        console.log("❌ ERROR:", err.message);

        res.json({
            success: false,
            error: "Blocked or failed"
        });
    }
});

app.get('/', (req, res) => {
    res.send("🔥 ULTRA FAST API WORKING");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
