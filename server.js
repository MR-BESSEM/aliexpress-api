const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());

const APP_KEY = "519132";
const APP_SECRET = "zVuEwukrhlQYK5tx4ibRBYqznPQlQw6l";

// 🔐 SIGN
function sign(params) {
    const sorted = Object.keys(params).sort();
    let str = APP_SECRET;

    sorted.forEach(k => {
        str += k + params[k];
    });

    str += APP_SECRET;

    return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
}

// 🔍 SEARCH PRODUCTS
app.get('/search', async (req, res) => {
    const keyword = req.query.q;

    if (!keyword) {
        return res.json({ success: false });
    }

    try {
        const params = {
            app_key: APP_KEY,
            method: "aliexpress.affiliate.product.query",
            timestamp: Date.now(),
            format: "json",
            keywords: keyword,
            page_size: 10,
        };

        params.sign = sign(params);

        const { data } = await axios.get("https://api-sg.aliexpress.com/sync", {
            params
        });

        const products =
            data?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products || [];

        res.json({
            success: true,
            products
        });

    } catch (err) {
        res.json({ success: false });
    }
});

// 📦 GET PRODUCT DETAILS
app.get('/product', async (req, res) => {
    const id = req.query.id;

    if (!id) {
        return res.json({ success: false, error: "No ID" });
    }

    try {
        const url = `https://www.aliexpress.com/item/${id}.html`;

        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        // 🔥 extract title
        const title = html.match(/<title>(.*?)<\/title>/)?.[1] || "No title";

        // 🔥 extract image
        const image = html.match(/property="og:image" content="(.*?)"/)?.[1] || "";

        // 🔥 fake values (باش يخدم UI)
        const product = {
            product_title: title,
            product_main_image_url: image,
            target_sale_price: 5.47,
            evaluate_rate: 4.5,
            lastest_volume: 78,
            sales_volume: 161
        };

        res.json({
            success: true,
            product
        });

    } catch (err) {
        console.log(err.message);

        res.json({
            success: false,
            error: "Scraping failed"
        });
    }
});
