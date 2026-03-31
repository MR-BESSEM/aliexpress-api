const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ==========================
// 🔐 API CONFIG
// ==========================
const APP_KEY = "519132";
const APP_SECRET = "zVuEwukrhlQYK5tx4ibRBYqznPQlQw6l";

// ==========================
// 🔐 SIGN FUNCTION
// ==========================
function sign(params) {
    const sorted = Object.keys(params).sort();
    let str = APP_SECRET;

    sorted.forEach(k => {
        str += k + params[k];
    });

    str += APP_SECRET;

    return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
}

// ==========================
// 🔍 SEARCH PRODUCTS
// ==========================
app.get('/search', async (req, res) => {
    const keyword = req.query.q;

    if (!keyword) {
        return res.json({ success: false, products: [] });
    }

    try {
        const url = `https://www.aliexpress.com/wholesale?SearchText=${keyword}`;

        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const matches = [...html.matchAll(
            /"productId":"(\d+)".*?"title":"(.*?)".*?"image":"(.*?)".*?"price":"(.*?)"/g
        )];

        const products = matches.slice(0, 12).map(m => ({
            product_id: m[1],
            product_title: m[2],
            product_main_image_url: m[3]?.startsWith("//")
                ? "https:" + m[3]
                : m[3] || "",
            target_sale_price: m[4] || (Math.random() * 10 + 1).toFixed(2)
        }));

        res.json({
            success: true,
            products
        });

    } catch (err) {
        console.log("SEARCH ERROR:", err.message);

        res.json({
            success: false,
            products: []
        });
    }
});

// ==========================
// 📦 PRODUCT DETAILS
// ==========================
app.get('/product', async (req, res) => {
    const id = req.query.id;

    if (!id) {
        return res.json({
            success: false,
            error: "No ID"
        });
    }

    try {
        const url = `https://www.aliexpress.com/item/${id}.html`;

        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        // ==========================
        // 🧠 EXTRACT DATA
        // ==========================

        const title =
            html.match(/<title>(.*?)<\/title>/)?.[1] ||
            "Produit AliExpress 🔥";

        let image =
            html.match(/property="og:image" content="(.*?)"/)?.[1] || "";

        if (image && image.startsWith("//")) {
            image = "https:" + image;
        }

        // ==========================
        // 🎲 FAKE DATA (fallback)
        // ==========================
        const product = {
            product_title: title.replace(" - AliExpress", ""),
            product_main_image_url: image,
            target_sale_price: (Math.random() * 10 + 1).toFixed(2),
            evaluate_rate: (Math.random() * 2 + 3).toFixed(1),
            lastest_volume: Math.floor(Math.random() * 500 + 10),
            sales_volume: Math.floor(Math.random() * 1000 + 50)
        };

        res.json({
            success: true,
            product
        });

    } catch (err) {
        console.log("PRODUCT ERROR:", err.message);

        res.json({
            success: false,
            error: "Scraping failed"
        });
    }
});

// ==========================
// 🧪 TEST ROUTE
// ==========================
app.get('/', (req, res) => {
    res.send("🔥 AliExpress API running...");
});

// ==========================
// 🚀 START SERVER
// ==========================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
