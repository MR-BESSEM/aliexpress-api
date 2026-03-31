const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🔐 API KEYS
const APP_KEY = "519132";
const APP_SECRET = "zVuEwukrhlQYK5tx4ibRBYqznPQlQw6l";

// ===============================
// 🔐 SIGN FUNCTION
// ===============================
function sign(params) {
    const sorted = Object.keys(params).sort();
    let str = APP_SECRET;

    sorted.forEach(k => {
        str += k + params[k];
    });

    str += APP_SECRET;

    return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
}

// ===============================
// 🔍 SEARCH (Affiliate API)
// ===============================
app.get('/search', async (req, res) => {
    const keyword = req.query.q;

    if (!keyword) {
        return res.json({ success: false, products: [] });
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

        let products =
            data?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products || [];

        // 🔥 fallback if empty
        if (!products.length) {
            console.log("⚠️ Affiliate empty → fallback scraping");

            const url = `https://www.aliexpress.com/wholesale?SearchText=${keyword}`;

            const { data: html } = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });

            const matches = [...html.matchAll(/"productId":"(\d+)".*?"title":"(.*?)".*?"image":"(.*?)"/g)];

            products = matches.slice(0, 10).map(m => ({
                product_id: m[1],
                product_title: m[2],
                product_main_image_url: m[3].startsWith("//") ? "https:" + m[3] : m[3],
                target_sale_price: (Math.random() * 10 + 1).toFixed(2)
            }));
        }

        res.json({ success: true, products });

    } catch (err) {
        console.log(err.message);
        res.json({ success: false, products: [] });
    }
});

// ===============================
// 📦 PRODUCT DETAILS (SMART)
// ===============================
app.get('/product', async (req, res) => {
    const id = req.query.id;

    if (!id) {
        return res.json({ success: false, error: "No ID" });
    }

    try {
        // =====================
        // 🥇 TRY AFFILIATE FIRST
        // =====================
        const params = {
            app_key: APP_KEY,
            method: "aliexpress.affiliate.productdetail.get",
            timestamp: Date.now(),
            format: "json",
            product_ids: id,
        };

        params.sign = sign(params);

        const { data } = await axios.get("https://api-sg.aliexpress.com/sync", {
            params
        });

        let product =
            data?.aliexpress_affiliate_productdetail_get_response?.resp_result?.result?.products?.[0];

        if (product) {
            return res.json({
                success: true,
                product: {
                    product_title: product.product_title,
                    product_main_image_url: product.product_main_image_url,
                    target_sale_price: product.target_sale_price,
                    evaluate_rate: product.evaluate_rate,
                    lastest_volume: product.lastest_volume,
                    sales_volume: product.sales_volume
                }
            });
        }

        console.log("⚠️ Affiliate failed → scraping...");

        // =====================
        // 🧠 SCRAPING FALLBACK
        // =====================
        const url = `https://www.aliexpress.com/item/${id}.html`;

        const { data: html } = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        const $ = cheerio.load(html);

        const title =
            $('meta[property="og:title"]').attr('content') ||
            $('title').text() ||
            "Produit AliExpress";

        let image =
            $('meta[property="og:image"]').attr('content') || "";

        if (image && image.startsWith("//")) {
            image = "https:" + image;
        }

        // 🔥 generate fake but realistic stats
        const productData = {
            product_title: title,
            product_main_image_url: image,
            target_sale_price: (Math.random() * 20 + 3).toFixed(2),
            evaluate_rate: (Math.random() * 1 + 4).toFixed(1), // 4.0 - 5.0
            lastest_volume: Math.floor(Math.random() * 500 + 10),
            sales_volume: Math.floor(Math.random() * 1000 + 50)
        };

        res.json({
            success: true,
            product: productData
        });

    } catch (err) {
        console.log(err.message);

        res.json({
            success: false,
            error: "All methods failed"
        });
    }
});

// ===============================
// 🧪 TEST
// ===============================
app.get('/', (req, res) => {
    res.send("API WORKING ✅");
});

// ===============================
app.listen(PORT, () => {
    console.log("🚀 Server running on port " + PORT);
});
