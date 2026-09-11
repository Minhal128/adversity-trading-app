#!/usr/bin/env node

// Simple CLI to fetch RevenueCat offerings or print fallback packages.
// Usage:
//  REVENUECAT_API_KEY=key node scripts/fetchOfferings.js
//  node scripts/fetchOfferings.js --fallback

const https = require('https');

const fallbackPackages = [
    {
        productId: 'com.booali.Atc.basic',
        price: '₨250',
        localizedPrice: '₨250',
        title: 'Builder Package',
        description: '100 credits for ATC',
        priceAmountMicros: 250000000,
        priceCurrencyCode: 'PKR'
    },
    {
        productId: 'com.booali.Atc.standard',
        price: '₨850',
        localizedPrice: '₨850',
        title: 'Legacy Package',
        description: '350 credits for ATC',
        priceAmountMicros: 850000000,
        priceCurrencyCode: 'PKR'
    },
    {
        productId: 'com.booali.Atc.premium',
        price: '₨1400',
        localizedPrice: '₨1400',
        title: 'Supporter Package',
        description: '500 credits for ATC',
        priceAmountMicros: 1400000000,
        priceCurrencyCode: 'PKR'
    }
];

function printJSON(obj) {
    console.log(JSON.stringify(obj, null, 2));
}

function fetchOfferings(apiKey) {
    const options = {
        hostname: 'api.revenuecat.com',
        path: '/v1/offerings',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const json = JSON.parse(data);
                    printJSON(json);
                } catch (e) {
                    console.error('Failed to parse JSON:', e.message);
                    console.log(data);
                }
            } else {
                console.error(`Request failed: ${res.statusCode} ${res.statusMessage}`);
                console.log(data);
            }
        });
    });

    req.on('error', (err) => {
        console.error('Request error:', err.message);
    });

    req.end();
}

(async function main() {
    const args = process.argv.slice(2);
    const useFallback = args.includes('--fallback');
    const apiKey = process.env.REVENUECAT_API_KEY || args.find(a => a.startsWith('--key='))?.split('=')[1];

    if (useFallback) {
        console.log('Using fallback packages:');
        printJSON(fallbackPackages);
        process.exit(0);
    }

    if (!apiKey) {
        console.log('No RevenueCat API key provided. Run with --fallback to see fallback packages.');
        console.log('Example: REVENUECAT_API_KEY=your_key node scripts/fetchOfferings.js');
        process.exit(2);
    }

    console.log('Fetching offerings from RevenueCat...');
    fetchOfferings(apiKey);
})();
