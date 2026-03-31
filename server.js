const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api', async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {
        // =========================
        // 🔧 FIX URL (IMPORTANT)
        // =========================
        let cleanUrl = url;

        const match = url.match(/item\/(\d+)/);

        if (match) {
            cleanUrl = `https://www.aliexpress.com/item/${match[1]}.html`;
        }

        // =========================
        // 🌐 REQUEST (ANTI-BOT)
        // =========================
        const { data: html } = await axios.get(cleanUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://www.google.com/",
                "Accept": "text/html"
            }
        });

        // =========================
        // 🧠 DEFAULT VALUES
        // =========================
        let title = "No title";
        let image = "";
        let price = null;
        let rating = "4.5";
        let description = "";

        // =========================
        // 🔥 EXTRACT NEXT_DATA
        // =========================
        const matchNext = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);

        if (matchNext && matchNext[1]) {
            try {
                const json = JSON.parse(matchNext[1]);

                const product = json?.props?.pageProps?.initialData?.data;

                if (product) {
                    title = product?.titleModule?.subject || title;
                    image = product?.imageModule?.imagePathList?.[0] || image;
                    price = product?.priceModule?.minPrice || price;
                    rating = product?.titleModule?.feedbackRating?.averageStar || rating;
                }

            } catch (e) {
                console.log("JSON parse error");
            }
        }

        // =========================
        // 🔁 FALLBACK (OG TAGS)
        // =========================
        if (title === "No title") {
            const t = html.match(/<meta property="og:title" content="(.*?)"/);
            if (t) title = t[1];
        }

        if (!image) {
            const i = html.match(/<meta property="og:image" content="(.*?)"/);
            if (i) image = i[1];
        }

        const d = html.match(/<meta property="og:description" content="(.*?)"/);
        if (d) description = d[1];

        // =========================
        // 📦 RESULT
        // =========================
        res.json({
            success: true,
            title,
            image,
            price,
            rating,
            description
        });

    } catch (err) {
        console.log(err.message);
        res.json({ success: false, error: "Fetch failed" });
    }
});

// =========================
// 🟢 TEST ROUTE
// =========================
app.get('/', (req, res) => {
    res.send("API WORKING ✅");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
