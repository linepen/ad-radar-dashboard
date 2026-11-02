const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Read token securely from server environment settings
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

const COMPETITOR_PAGES = {
  'lux': '198681730247947',
  'meril': '1453276111597128',
  'dettol': '316661708412733',
  'lifebuoy': '407422362695986',
  'sepnil': '1713574818891891',
  'rin': '191136358135737',
  'lizol': '1392439847477431',
  'himalaya': '844472932311946',
  'vim': '544329592579649'
};

app.get('/api/ads/:brandKey', async (req, res) => {
  const brandKey = req.params.brandKey.toLowerCase();
  const pageId = COMPETITOR_PAGES[brandKey];

  if (!pageId) {
    return res.status(400).json({ error: 'Brand not recognized' });
  }

  try {
    const url = `https://graph.facebook.com/v20.0/ads_archive`;
    const response = await axios.get(url, {
      params: {
        access_token: ACCESS_TOKEN,
        ad_type: 'ALL',
        ad_reached_countries: "['BD']",
        search_page_ids: pageId,
        search_terms: brandKey,
        fields: 'id,ad_creation_time,ad_creative_bodies,ad_snapshot_url,page_id,page_name,publisher_platforms',
        limit: 50
      }
    });

    const formattedAds = (response.data.data || []).map(ad => ({
      id: ad.id,
      pageName: ad.page_name,
      pageId: ad.page_id,
      creationTime: ad.ad_creation_time,
      bodyText: ad.ad_creative_bodies ? ad.ad_creative_bodies[0] : 'No copy text provided.',
      snapshotUrl: ad.ad_snapshot_url,
      platforms: ad.publisher_platforms || ['facebook', 'instagram'],
      brandPageUrl: `https://www.facebook.com/${ad.page_id}`
    }));

    res.json({ success: true, count: formattedAds.length, ads: formattedAds });
  } catch (error) {
    console.error('Error fetching Meta ads:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch live Meta ad data' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
