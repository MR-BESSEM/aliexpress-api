const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

const APP_KEY = "519132";
const APP_SECRET = "zVuEwukrhlQYK5tx4ibRBYqznPQlQw6l";

// 🔐 SIGN FUNCTION
function sign(params) {
    const sorted = Object.keys(params).sort();
    let base = APP_SECRET;

    sorted.forEach(k => {
        base += k + params[k];
    });

    base += APP_SECRET;

    return crypto.createHash("md5").update(base).digest("hex").toUpperCase();
}

app.get("/api", async (req, res) => {
    let url = req.query.url;

    if (!url) return res.json({ success: false });

    const match = url.match(/item\/(\d+)/);
    if (!match) return res.json({ success: false });

    const id = match[1];

    try {
        // =====================
        // 🟢 1. TRY API FIRST
        // =====================
        const params = {
            method: "aliexpress.affiliate.productdetail.get",
            app_key: APP_KEY,
            sign_method: "md5",
            timestamp: new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14),
            format: "json",
            v: "2.0",
            product_ids: id,
            fields: "product_title,product_main_image_url,sale_price,product_evaluate_rate,product_sales_volume"
        };

        params.sign = sign(params);

        const apiRes = await axios.get("https://api-sg.aliexpress.com/sync", { params });

        const product =
            apiRes.data?.aliexpress_affiliate_productdetail_get_response?.result?.products?.product?.[0];

        // ✅ SUCCESS API
        if (product) {
            return res.json({
                success: true,
                source: "api",
                title: product.product_title,
                image: product.product_main_image_url,
                price: product.sale_price,
                rating: product.product_evaluate_rate,
                sold: product.product_sales_volume
            });
        }

        console.log("⚠️ API failed → switching to scraping...");

        // =====================
        // 🔴 2. SCRAPING FALLBACK
        // =====================
        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const $ = cheerio.load(html);

        let title = $('meta[property="og:title"]').attr("content") || "";
        let image = $('meta[property="og:image"]').attr("content") || "";
        let description = $('meta[property="og:description"]').attr("content") || "";

        // 🔥 smart extraction
        let rating = html.match(/"averageStar":"([\d.]+)"/)?.[1] || "4.5";
        let sold = html.match(/"tradeCount":"(\d+)"/)?.[1] || "0";
        let price = html.match(/"minPrice":"([\d.]+)"/)?.[1] || "";

        return res.json({
            success: true,
            source: "scraping",
            title,
            image,
            price,
            rating,
            sold,
            description
        });

    } catch (err) {
        console.log(err.message);

        res.json({
            success: false,
            error: "Both API & scraping failed"
        });
    }
});

app.listen(3000, () => console.log("HYBRID API WORKING 💀"));
