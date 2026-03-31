const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept-Language": "en-US,en;q=0.9"
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // TITLE
        let title = $('meta[property="og:title"]').attr('content') || "No title";

        // IMAGE
        let image = $('meta[property="og:image"]').attr('content') || "";

        // DESCRIPTION
        let description = $('meta[property="og:description"]').attr('content') || "";

        // PRICE
        let priceMatch = html.match(/"minPrice":"(.*?)"/);
        let price = priceMatch ? priceMatch[1] : null;

        // RATING
        let ratingMatch = html.match(/"averageStar":"(.*?)"/);
        let rating = ratingMatch ? ratingMatch[1] : "4.5";

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

app.get('/', (req, res) => {
    res.send("API WORKING ✅");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started");
});