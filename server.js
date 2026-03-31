const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// 🔑 API KEY (متاع ScraperAPI)
const API_KEY = "ee9267c6e7819058946fe56b9c0bec52";

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

        // =========================
        // 🌐 SCRAPER API REQUEST
        // =========================
        const apiUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(url)}`;

        const { data: html } = await axios.get(apiUrl);

        // =========================
        // 🧠 DEFAULT VALUES
        // =========================
        let title = "Produit AliExpress";
        let image = "";
        let description = "";
        let price = null;
        let rating = "4.5";
        let reviews = "20";
        let sold = "50";

        // =========================
        // 🔥 TRY REAL JSON (NEW STRUCTURE)
        // =========================
        const jsonMatch = html.match(/window\.__INIT_DATA__\s*=\s*({.*?});/);

        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[1]);

                const product = data?.data?.root?.fields?.productInfoComponent?.data || {};

                title = product?.subject || title;
                image = product?.imageUrl || image;

                rating = product?.evaluationStar || rating;
                reviews = product?.evaluationCount || reviews;
                sold = product?.tradeCount || sold;

                price = product?.skuPriceList?.[0]?.skuVal?.skuAmount?.value || null;

            } catch (e) {
                console.log("❌ JSON parse error");
            }
        }

        // =========================
        // 🔁 FALLBACK META TAGS
        // =========================
        if (!title || title === "Produit AliExpress") {
            title = html.match(/<meta property="og:title" content="(.*?)"/)?.[1] || title;
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
        // 🖼 FIX IMAGE
        // =========================
        if (image && image.startsWith("//")) {
            image = "https:" + image;
        }

        if (!image) {
            image = "https://dummyimage.com/300x300/1e293b/ffffff&text=AliExpress";
        }

        // =========================
        // 🎯 FINAL RESPONSE
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
        console.log("🔥 ERROR:", err.message);

        res.json({
            success: false,
            error: "API failed"
        });
    }
});

// TEST ROUTE
app.get('/', (req, res) => {
    res.send("API WORKING ✅");
});

// SERVER START
app.listen(process.env.PORT || 3000, () => {
    console.log("🚀 Server running...");
});
