const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

app.get('/api', async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {
        // ✅ FIX URL
        const match = url.match(/item\/(\d+)/);
        if (match) {
            url = `https://www.aliexpress.com/item/${match[1]}.html`;
        }

        console.log("Fetching:", url);

        // 🔥 REAL BROWSER HEADERS
        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml",
                "Connection": "keep-alive"
            },
            timeout: 15000
        });

        const $ = cheerio.load(html);

        // =========================
        // 🔥 META DATA (STRONG)
        // =========================
        let title =
            $('meta[property="og:title"]').attr('content') ||
            $('title').text() ||
            "No title";

        let image =
            $('meta[property="og:image"]').attr('content') ||
            "";

        let description =
            $('meta[property="og:description"]').attr('content') ||
            "";

        // =========================
        // 🔥 PRICE (NEW SYSTEM)
        // =========================
        let price = null;

        const priceText = html.match(/"price":"([\d.]+)"/);
        if (priceText) price = parseFloat(priceText[1]);

        // =========================
        // 🔥 RATING + REVIEWS + SOLD (FIXED 💀)
        // =========================
        let rating = "0";
        let reviews = "0";
        let sold = "0";

        // ⭐ rating
        const ratingMatch = html.match(/"averageStar":"?([\d.]+)"?/);
        if (ratingMatch) rating = ratingMatch[1];

        // 💬 reviews
        const reviewMatch = html.match(/"totalReview":(\d+)/);
        if (reviewMatch) reviews = reviewMatch[1];

        // 📦 sold
        const soldMatch = html.match(/"tradeCount":"?(\d+)"?/);
        if (soldMatch) sold = soldMatch[1];

        // =========================
        // 🔁 EXTRA FALLBACK (HTML)
        // =========================
        if (reviews === "0") {
            const r = html.match(/(\d+)\s*Reviews/i);
            if (r) reviews = r[1];
        }

        if (sold === "0") {
            const s = html.match(/(\d+)\s*Sold/i);
            if (s) sold = s[1];
        }

        // =========================
        // 🧼 CLEAN
        // =========================
        title = title.replace(/\\"/g, '"');
        description = description.replace(/\\"/g, '"');

        if (description.length > 150) {
            description = description.substring(0, 150) + "...";
        }

        // =========================
        // ✅ RESULT
        // =========================
        res.json({
            success: true,
            title,
            image,
            price,
            rating,
            reviews,
            sold,
            description
        });

    } catch (err) {
        console.log("ERROR:", err.message);

        res.json({
            success: false,
            error: "Scraping failed (blocked)"
        });
    }
});

// test
app.get('/', (req, res) => {
    res.send("🔥 API ULTRA WORKING");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
