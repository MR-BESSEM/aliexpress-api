const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const API_KEY = "ee9267c6e7819058946fe56b9c0bec52";

app.get('/api', async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.json({ success: false, error: "No URL" });
    }

    try {
        // FIX URL
        const match = url.match(/item\/(\d+)/);
        if (match) {
            url = `https://www.aliexpress.com/item/${match[1]}.html`;
        }

        // 🔥 request via ScraperAPI
        const apiUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(url)}`;

        const { data: html } = await axios.get(apiUrl);

        let title = html.match(/<title>(.*?)<\/title>/)?.[1] || "No title";
        let image = html.match(/<meta property="og:image" content="(.*?)"/)?.[1] || "";
        let description = html.match(/<meta property="og:description" content="(.*?)"/)?.[1] || "";

        res.json({
            success: true,
            title,
            image,
            price: null,
            rating: "4.5",
            description
        });

    } catch (err) {
        console.log(err.message);
        res.json({ success: false, error: "ScraperAPI failed" });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
