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
        // 🔧 FIX URL
        // =========================
        const match = url.match(/item\/(\d+)/);
        if (match) {
            url = `https://www.aliexpress.com/item/${match[1]}.html`;
        }

        // =========================
        // 🌐 REQUEST (ScraperAPI)
        // =========================
        const apiUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(url)}`;

        const { data: html } = await axios.get(apiUrl);

        // =========================
        // 🧠 DEFAULT VALUES
        // =========================
        let title = "No title";
        let image = "";
        let description = "";
        let price = null;
        let rating = "4.5";
        let reviews = "0";
        let sold = "0";

        // =========================
        // 🔥 EXTRACT JSON (REAL DATA)
        // =========================
        const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);

        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[1]);

                const product = data?.product || {};

                title = product?.title || title;
                image = product?.image || image;

                rating = product?.averageStar || rating;
                reviews = product?.totalReview || reviews;
                sold = product?.tradeCount || sold;

                price = product?.minPrice || null;

            } catch (e) {
                console.log("JSON parse error");
            }
        }

        // =========================
        // 🔁 FALLBACK (META TAGS)
        // =========================
        if (!title || title === "No title") {
            title = html.match(/<meta property="og:title" content="(.*?)"/)?.[1] || "No title";
        }

        if (!image) {
            image = html.match(/<meta property="og:image" content="(.*?)"/)?.[1] || "";
        }

        description = html.match(/<meta property="og:description" content="(.*?)"/)?.[1] || "";

        // =========================
        // 🧼 CLEAN DATA
        // =========================
        title = title.replace(/\\"/g, '"');
        description = description.replace(/\\"/g, '"');

        if (description.length > 200) {
            description = description.substring(0, 200) + "...";
        }

        // =========================
        // 📦 FINAL RESPONSE
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
