const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const API_KEY = "ee9267c6e7819058946fe56b9c0bec52"; // 🔑 حط key

app.get('/api', async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.json({ success: false });
    }

    try {

        // 🔥 FIX LINK
        const match = url.match(/item\/(\d+)/);
        if (match) {
            url = `https://www.aliexpress.com/item/${match[1]}.html`;
        }

        const apiUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${url}&render=true`;

        const { data: html } = await axios.get(apiUrl);

        let title = "";
        let image = "";
        let price = null;
        let rating = "4.5";
        let reviews = "0";
        let sold = "0";
        let description = "";

        // =========================
        // 🔥 METHOD 1: JSON STATE
        // =========================
        const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);

        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[1]);

                const product = data?.product || {};

                title = product.title || "";
                image = product.image || "";

                rating = product.averageStar || rating;

                // 🔥 FIX REVIEWS
                reviews = product.evaluationCount || product.totalReview || "0";

                // 🔥 SOLD
                sold = product.tradeCount || "0";

                price = product.minPrice || null;

            } catch (e) {}
        }

        // =========================
        // 🔥 METHOD 2: __DATA__
        // =========================
        if (!title) {
            const dataMatch = html.match(/window\.__DATA__\s*=\s*({.*?});/);
            if (dataMatch) {
                try {
                    const data = JSON.parse(dataMatch[1]);

                    const product = data?.data?.root?.fields || {};

                    title = product.title || title;
                    rating = product.averageStar || rating;
                    reviews = product.reviewCount || reviews;
                    sold = product.tradeCount || sold;

                } catch (e) {}
            }
        }

        // =========================
        // 🔥 METHOD 3: META (fallback)
        // =========================
        if (!title) {
            title = html.match(/<meta property="og:title" content="(.*?)"/)?.[1] || "Produit AliExpress";
        }

        if (!image) {
            image = html.match(/<meta property="og:image" content="(.*?)"/)?.[1] || "";
        }

        description = html.match(/<meta property="og:description" content="(.*?)"/)?.[1] || "";

        // =========================
        // 🧼 CLEAN DATA
        // =========================
        const cleanNumber = (val) => {
            return val.toString().replace(/[^\d]/g, '') || "0";
        };

        reviews = cleanNumber(reviews);
        sold = cleanNumber(sold);

        // 🔥 FORMAT
        const format = (n) => {
            n = parseInt(n);
            if (n >= 1000) return (n / 1000).toFixed(1) + "k";
            return n;
        };

        reviews = format(reviews);
        sold = format(sold);

        if (image && image.startsWith("//")) {
            image = "https:" + image;
        }

        if (description.length > 180) {
            description = description.substring(0, 180) + "...";
        }

        // =========================
        // 📦 RESPONSE
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
            success: false
        });
    }
});

app.get('/', (req, res) => {
    res.send("API PRO MAX WORKING 🚀");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("🔥 Server running PRO MAX");
});
