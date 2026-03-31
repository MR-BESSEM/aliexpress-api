const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(cors());

const APP_KEY = "519132";
const APP_SECRET = "zVuEwukrhlQYK5tx4ibRBYqznPQlQw6l";

function sign(params) {
    const sorted = Object.keys(params).sort();
    let base = APP_SECRET;

    sorted.forEach(key => {
        base += key + params[key];
    });

    base += APP_SECRET;

    return crypto.createHash("md5").update(base).digest("hex").toUpperCase();
}

app.get("/api", async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {
        // ✅ extract product ID
        const match = url.match(/item\/(\d+)/);
        if (!match) {
            return res.json({ success: false, error: "Invalid URL" });
        }

        const productId = match[1];

        const params = {
            method: "aliexpress.affiliate.productdetail.get",
            app_key: APP_KEY,
            sign_method: "md5",
            timestamp: new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14),
            format: "json",
            v: "2.0",
            product_ids: productId,
            fields: "product_title,product_main_image_url,sale_price,original_price,discount,product_detail_url,shop_name,product_evaluate_rate,product_sales_volume"
        };

        params.sign = sign(params);

        const { data } = await axios.get(
            "https://api-sg.aliexpress.com/sync",
            { params }
        );

        const product =
            data?.aliexpress_affiliate_productdetail_get_response?.result?.products?.product?.[0];

if (!product) {
    console.log("❌ FULL API RESPONSE:", data);

    return res.json({
        success: false,
        error: "Product not in affiliate system"
    });
}

        res.json({
            success: true,
            title: product.product_title,
            image: product.product_main_image_url,
            price: product.sale_price,
            rating: product.product_evaluate_rate,
            sold: product.product_sales_volume,
            store: product.shop_name,
            url: product.product_detail_url
        });

    } catch (err) {
        console.log(err.response?.data || err.message);

        res.json({
            success: false,
            error: "API failed"
        });
    }
});

app.listen(3000, () => console.log("API WORKING 🔥"));
