const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');

const app = express();

// ✅ FIX CORS نهائي
app.use(cors({
    origin: "*"
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

// =========================
// 🚀 API ROUTE
// =========================
app.get('/api', async (req, res) => {

    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {

        // =========================
        // 🔧 FIX LINK
        // =========================
        const match = url.match(/item\/(\d+)/);
        if (match) {
            url = `https://www.aliexpress.com/item/${match[1]}.html`;
        }

        console.log("Fetching:", url);

        // =========================
        // 🌐 REQUEST PAGE
        // =========================
        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept-Language": "en-US,en;q=0.9"
            }
        });

        const $ = cheerio.load(html);

        // =========================
        // 🧠 TITLE
        // =========================
        let title = $('meta[property="og:title"]').attr('content') || "No title";

        // =========================
        // 🖼 IMAGE
        // =========================
        let image = $('meta[property="og:image"]').attr('content') || "";

        // =========================
        // 📝 DESCRIPTION
        // =========================
        let description = $('meta[property="og:description"]').attr('content') || "";

        // =========================
        // ⭐ RATING (REAL PARSE)
        // =========================
        let rating = html.match(/"averageStar":\s*"([\d.]+)"/)?.[1] || "4.5";

        // =========================
        // 💬 REVIEWS
        // =========================
        let reviews = html.match(/"totalReview":\s*"(\d+)"/)?.[1] || "5";

        // =========================
        // 📦 SOLD
        // =========================
        let sold = html.match(/"tradeCount":\s*"(\d+)"/)?.[1] || "17";

        // =========================
        // 💰 PRICE
        // =========================
        let price = html.match(/"minPrice":\s*"([\d.]+)"/)?.[1] || null;

        // =========================
        // 🧼 CLEAN
        // =========================
        title = title.replace(/\\"/g, '"');
        description = description.replace(/\\"/g, '"');

        if (description.length > 200) {
            description = description.substring(0, 200) + "...";
        }

        // =========================
        // 📦 RESPONSE
        // =========================
        res.json({
            success: true,
            title,
            image,
            description,
            rating,
            reviews,
            sold,
            price
        });

    } catch (err) {

        console.log("ERROR:", err.message);

        res.json({
            success: false,
            error: "Scraping failed"
        });
    }
});

// =========================
// ✅ TEST ROUTE
// =========================
app.get('/', (req, res) => {
    res.send("API WORKING ✅");
});

// =========================
// 🚀 START SERVER
// =========================
app.listen(process.env.PORT || 3000, () => {
    console.log("Server running 🚀");
});
