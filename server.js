const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');

const app = express();

// ✅ CORS FIX
app.use(cors({
    origin: "*"
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

// =========================
// 🚀 API
// =========================
app.get('/api', async (req, res) => {

    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {

        // =========================
        // 🔧 FIX URL
        // =========================
        const match = url.match(/item\/(\d+)/);
        if (match) {
            url = `https://www.aliexpress.com/item/${match[1]}.html`;
        }

        console.log("🚀 Fetch:", url);

        // =========================
        // 🔥 PROXY (ANTI BLOCK)
        // =========================
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

        const { data: html } = await axios.get(proxyUrl, {
            timeout: 15000
        });

        const $ = cheerio.load(html);

        // =========================
        // 🧠 DEFAULT
        // =========================
        let title = "Produit AliExpress 🔥";
        let image = "";
        let description = "";
        let rating = "4.5";
        let reviews = "5";
        let sold = "17";
        let price = null;

        // =========================
        // 🔥 TRY JSON DATA
        // =========================
        const jsonMatch = html.match(/window\.__INIT_DATA__\s*=\s*({.*});/);

        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[1]);

                const product = data?.data?.root?.fields || {};

                title = product?.title || title;
                image = product?.image || image;

                rating = product?.averageStar || rating;
                reviews = product?.totalReview || reviews;
                sold = product?.tradeCount || sold;

                price = product?.price?.minPrice || null;

            } catch (e) {
                console.log("⚠️ JSON parse error");
            }
        }

        // =========================
        // 🔁 FALLBACK META
        // =========================
        if (!image) {
            image = $('meta[property="og:image"]').attr('content') || "";
        }

        if (!description) {
            description = $('meta[property="og:description"]').attr('content') || "";
        }

        if (!title || title === "No title") {
            title = $('meta[property="og:title"]').attr('content') || title;
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

        console.log("❌ ERROR:", err.message);

        res.json({
            success: false,
            error: "Scraping failed"
        });
    }
});

// =========================
// ✅ TEST
// =========================
app.get('/', (req, res) => {
    res.send("API WORKING ✅");
});

// =========================
// 🚀 START
// =========================
app.listen(process.env.PORT || 3000, () => {
    console.log("Server running 🚀");
});
