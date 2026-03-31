const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {
        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html"
            }
        });

        let title = "No title";
        let image = "";
        let price = null;
        let rating = "4.5";
        let description = "";

        // 🔥 استخراج NEXT_DATA
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);

        if (match && match[1]) {
            const json = JSON.parse(match[1]);

            const product = json?.props?.pageProps?.initialData?.data;

            if (product) {
                title = product?.titleModule?.subject || title;
                image = product?.imageModule?.imagePathList?.[0] || image;
                price = product?.priceModule?.minPrice || price;
                rating = product?.titleModule?.feedbackRating?.averageStar || rating;
            }
        }

        // fallback description
        const descMatch = html.match(/<meta property="og:description" content="(.*?)"/);
        if (descMatch) description = descMatch[1];

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

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
