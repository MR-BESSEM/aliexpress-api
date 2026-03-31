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
        return res.json({ success: false });
    }

    try {
        const params = {
            app_key: APP_KEY,
            method: "aliexpress.affiliate.productdetail.get",
            timestamp: Date.now(),
            format: "json",
            product_ids: id
        };

        params.sign = sign(params);

        const { data } = await axios.get("https://api-sg.aliexpress.com/sync", {
            params
        });

        const product =
            data?.aliexpress_affiliate_productdetail_get_response?.resp_result?.result?.products?.[0];

        res.json({
            success: true,
            product
        });

    } catch (err) {
        res.json({ success: false });
    }
});

app.listen(3000, () => {
    console.log("🔥 FULL SYSTEM READY");
});
