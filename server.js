const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

const COMPETITOR_PAGES = {
  'dettol': { id: '316661708412733', name: 'Dettol Bangladesh' },
  'lux': { id: '198681730247947', name: 'Lux Bangladesh' },
  'meril': { id: '1453276111597128', name: 'Meril' },
  'lifebuoy': { id: '407422362695986', name: 'Lifebuoy' },
  'sepnil': { id: '1713574818891891', name: 'Sepnil' },
  'rin': { id: '191136358135737', name: 'Rin' },
  'lizol': { id: '1392439847477431', name: 'Lizol Bangladesh' },
  'himalaya': { id: '844472932311946', name: 'Himalaya Bangladesh' },
  'vim': { id: '544329592579649', name: 'Vim Bangladesh' }
};

app.get('/api/ads/:brandKey', async (req, res) => {
  const brandKey = req.params.brandKey.toLowerCase();
  const brandConfig = COMPETITOR_PAGES[brandKey];

  if (!brandConfig) {
    return res.status(400).json({ error: 'Brand not recognized' });
  }

  try {
    const url = `https://graph.facebook.com/v20.0/ads_archive`;
    const response = await axios.get(url, {
      params: {
        access_token: ACCESS_TOKEN,
        ad_type: 'ALL',
        ad_reached_countries: "['BD']",
        search_page_ids: brandConfig.id,
        fields: 'id,ad_creation_time,ad_creative_bodies,ad_snapshot_url,page_id,page_name,publisher_platforms',
        limit: 50
      }
    });

    const formattedAds = (response.data.data || []).map(ad => ({
      id: ad.id,
      pageName: ad.page_name || brandConfig.name,
      pageId: ad.page_id,
      creationTime: ad.ad_creation_time,
      bodyText: ad.ad_creative_bodies ? ad.ad_creative_bodies[0] : 'No caption text available.',
      snapshotUrl: ad.ad_snapshot_url,
      // Direct Web Library URL fallback for reliable snapshot loading
      directLibraryUrl: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BD&view_all_page_id=${ad.page_id}`,
      platforms: ad.publisher_platforms || ['facebook', 'instagram'],
      brandPageUrl: `https://www.facebook.com/${ad.page_id}`
    }));

    res.json({ success: true, count: formattedAds.length, ads: formattedAds });
  } catch (error) {
    console.error(`Error fetching Meta ads for ${brandKey}:`, error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch live Meta ad data' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
