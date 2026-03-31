const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());

const APP_KEY = "519132";
const APP_SECRET = "zVuEwukrhlQYK5tx4ibRBYqznPQlQw6l";

function sign(params) {
    const sorted = Object.keys(params).sort();
    let str = APP_SECRET;

    sorted.forEach(k => {
        str += k + params[k];
    });

    str += APP_SECRET;

    return crypto.createHash('md5').update(str).digest('hex').toUpperCase();
}

app.get('/api', async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {
        // 🔥 STEP 1: CONVERT TO AFFILIATE LINK
        const params = {
            app_key: APP_KEY,
            method: "aliexpress.affiliate.link.generate",
            timestamp: Date.now(),
            format: "json",
            promotion_link_type: 0,
            source_values: url,
        };

        params.sign = sign(params);

        const linkRes = await axios.get("https://api-sg.aliexpress.com/sync", {
            params
        });

        const affiliateLink =
            linkRes.data?.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.[0]?.promotion_link;

        if (!affiliateLink) {
            return res.json({
                success: false,
                error: "Product not in affiliate system"
            });
        }

        // 🔥 STEP 2: GET PRODUCT DETAILS
        const params2 = {
            app_key: APP_KEY,
            method: "aliexpress.affiliate.productdetail.get",
            timestamp: Date.now(),
            format: "json",
            product_ids: affiliateLink.match(/item\/(\d+)/)[1]
        };

        params2.sign = sign(params2);

        const detailRes = await axios.get("https://api-sg.aliexpress.com/sync", {
            params: params2
        });

        const product =
            detailRes.data?.aliexpress_affiliate_productdetail_get_response?.resp_result?.result?.products?.[0];

        if (!product) {
            return res.json({ success: false, error: "No data" });
        }

        // 🎯 FINAL DATA
        res.json({
            success: true,
            title: product.product_title,
            image: product.product_main_image_url,
            price: product.target_sale_price,
            rating: product.evaluate_rate,
            reviews: product.lastest_volume,
            sold: product.sales_volume,
            description: product.product_detail_url,
            affiliate_link: affiliateLink
        });

    } catch (err) {
        console.log(err.message);

        res.json({
            success: false,
            error: "API failed"
        });
    }
});

app.get('/', (req, res) => {
    res.send("🔥 OFFICIAL API WORKING");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
