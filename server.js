const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// 🔑 حط API KEY متاعك هنا
const API_KEY = "ee9267c6e7819058946fe56b9c0bec52";

app.get('/api', async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {
        // =========================
        // 🔧 FIX URL (important)
        // =========================
        const match = url.match(/item\/(\d+)/);
        if (match) {
            url = `https://www.aliexpress.com/item/${match[1]}.html`;
        }

        // =========================
        // 🌐 REQUEST VIA SCRAPERAPI
        // =========================
        const apiUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(url)}`;

        const { data: html } = await axios.get(apiUrl);

        // =========================
        // 🧠 EXTRACTION (STRONG)
        // =========================

        // TITLE
        let title =
            html.match(/"subject":"(.*?)"/)?.[1] ||
            html.match(/<meta property="og:title" content="(.*?)"/)?.[1] ||
            "No title";

        // IMAGE
        let image =
            html.match(/<meta property="og:image" content="(.*?)"/)?.[1] ||
            "";

        // DESCRIPTION
        let description =
            html.match(/<meta property="og:description" content="(.*?)"/)?.[1] ||
            "";

        // PRICE
        let price =
            html.match(/"minPrice":"(.*?)"/)?.[1] ||
            null;

        // RATING
        let rating =
            html.match(/"averageStar":"(.*?)"/)?.[1] ||
            "4.5";

        // =========================
        // 🧼 CLEAN DATA
        // =========================
        title = title.replace(/\\"/g, '"');
        description = description.replace(/\\"/g, '"');

        // shorten description
        if (description.length > 200) {
            description = description.substring(0, 200) + "...";
        }

        // =========================
        // 📦 RESULT
        // =========================
        res.json({
            success: true,
            title,
            image,
            price,
            rating,
            description
        });

    } catch (err) {
        console.log(err.message);

        res.json({
            success: false,
            error: "API failed"
        });
    }
});

// test route
app.get('/', (req, res) => {
    res.send("API WORKING ✅");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
