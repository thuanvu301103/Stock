// n8n Code Node collector for an SSI current market snapshot.
// Fetches exchange indices and stock lists, then returns an n8n JSON summary
// plus the combined JSON file as binary property `data` for downstream nodes.
// Output sample: ./samples/stock_master_data_sample.json
async function execute() {
    const baseHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Referer': 'https://iboard.ssi.com.vn/',
        'Origin': 'https://iboard.ssi.com.vn/'
    };

    try {
        // Step 1: Initialize session and safely extract cookies
        const portalResponse = await this.helpers.httpRequest({
            method: 'GET',
            url: 'https://iboard.ssi.com.vn/',
            headers: baseHeaders,
            resolveWithFullResponse: true,
            returnFullResponse: true
        });

        const headers = portalResponse.headers || {};
        const cookieKey = Object.keys(headers).find(k => k.toLowerCase() === 'set-cookie');
        const setCookieHeader = cookieKey ? headers[cookieKey] : null;

        const requestHeaders = { ...baseHeaders };
        if (setCookieHeader) {
            const cookieString = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;
            requestHeaders['Cookie'] = cookieString;
        }

        // Step 2: Fetch Exchange Indices Data
        const indexIds = ["VNINDEX", "VN30", "HNX30", "VNXALL", "HNXIndex", "HNXUpcomIndex"];
        const exchangeUrl = 'https://iboard-query.ssi.com.vn/exchange-index/multiple';
        
        let exchangeIndicesData = { code: 'ERROR', totalRecords: 0, data: [] };
        try {
            const exchangeResponse = await this.helpers.httpRequest({
                method: 'POST',
                url: exchangeUrl,
                headers: { ...requestHeaders, 'Content-Type': 'application/json' },
                body: { indexIds },
                json: true
            });

            if (exchangeResponse) {
                exchangeIndicesData = {
                    code: 'SUCCESS',
                    totalRecords: Array.isArray(exchangeResponse.data) ? exchangeResponse.data.length : 0,
                    data: exchangeResponse.data || []
                };
            }
        } catch (e) {
            console.error('Exchange Indices fetch error:', e.message);
        }

        // Step 3: Fetch Market Data endpoints in parallel
        const marketUrls = [
            'https://iboard-query.ssi.com.vn/stock/group/VN30',
            'https://iboard-query.ssi.com.vn/stock/exchange/hose?boardId=MAIN',
            'https://iboard-query.ssi.com.vn/stock/exchange/hnx?boardId=MAIN',
            'https://iboard-query.ssi.com.vn/stock/exchange/upcom?boardId=MAIN'
        ];

        let marketData = { code: 'ERROR', totalRecords: 0, data: [] };
        const results = await Promise.all(
            marketUrls.map(async (url) => {
                try {
                    return await this.helpers.httpRequest({
                        method: 'GET',
                        url: url,
                        headers: requestHeaders,
                        json: true
                    });
                } catch (err) {
                    return null;
                }
            })
        );

        const uniqueStocksMap = new Map();
        results.forEach(response => {
            if (response && Array.isArray(response.data)) {
                response.data.forEach(item => {
                    if (item && item.stockSymbol) {
                        uniqueStocksMap.set(item.stockSymbol, item);
                    }
                });
            }
        });

        const aggregatedData = Array.from(uniqueStocksMap.values());
        if (aggregatedData.length > 0) {
            marketData = {
                code: 'SUCCESS',
                totalRecords: aggregatedData.length,
                data: aggregatedData
            };
        }

        const finalResult = {
            exchangeIndicesData,
            marketData
        };

        // Step 4: Convert JSON object to Binary File format (ready for Form-Data / Webhook body)
        const jsonString = JSON.stringify(finalResult, null, 2);
        const binaryBuffer = Buffer.from(jsonString, 'utf-8');

        // Generate dynamic file name with current date (YYYYMMDD)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const fileName = `stock_master_data_${year}${month}${day}.json`;

        // Return output containing both JSON summary and Binary file data property
        return [{
            json: {
                status: "SUCCESS",
                totalExchangeRecords: exchangeIndicesData.totalRecords,
                totalMarketRecords: marketData.totalRecords,
                fileName: fileName
            },
            binary: {
                data: await this.helpers.prepareBinaryData(binaryBuffer, fileName, 'application/json')
            }
        }];

    } catch (error) {
        return [{
            json: {
                code: 'FATAL_ERROR',
                message: error.message
            }
        }];
    }
}

return await execute();