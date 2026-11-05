(async function downloadAndLogStockData() {
    const urls = [
        'https://iboard-query.ssi.com.vn/stock/group/VN30',
        'https://iboard-query.ssi.com.vn/stock/exchange/hose?boardId=MAIN',
        'https://iboard-query.ssi.com.vn/stock/exchange/hnx?boardId=MAIN',
        'https://iboard-query.ssi.com.vn/stock/exchange/upcom?boardId=MAIN'
    ];
    const fileName = 'stock_master_data.json';

    try {
        console.log('Starting data fetch from APIs...');

        // Fetch all URLs in parallel and track individual counts
        const results = await Promise.all(
            urls.map(async (url) => {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
                }
                const json = await response.json();
                const count = (json && Array.isArray(json.data)) ? json.data.length : 0;
                
                // Log the number of records retrieved for each URL
                console.log(`[URL]: ${url} -> Retrieved records: ${count}`);
                
                return json;
            })
        );

        // Map to store unique stock items by stockSymbol
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

        const finalResult = {
            code: 'SUCCESS',
            totalRecords: aggregatedData.length,
            data: aggregatedData
        };

        // Create a Blob and trigger an automatic browser download
        const jsonString = JSON.stringify(finalResult, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(link.href);
        console.log(`\nTotal unique records after aggregation: ${aggregatedData.length}`);
        console.log(`Successfully downloaded aggregated stock data to ${fileName}.`);
    } catch (error) {
        console.error('Execution failed:', error);
    }
})();