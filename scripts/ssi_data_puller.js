/* --- 
    Des: Get Exchange Indices Data
    Return type: JSON
    Sample: ./samples/exchange_indices_data_sample.json
--- */
let indexIds = ["VNINDEX","VN30","HNX30","VNXALL","HNXIndex","HNXUpcomIndex"]
async function getExchangeIndicesData() {
    const url = 'https://iboard-query.ssi.com.vn/exchange-index/multiple';
    
    try {
        console.log('=== Starting Exchange Indices data fetch from APIs...');

        // Fixed IIFE syntax: added the trailing parenthesis `()` to immediately invoke the async function
        const result = await (async () => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ indexIds })
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
            }
            const json = await response.json();
                
            // Log the number of records retrieved for each URL
            const count = (json && Array.isArray(json.data)) ? json.data.length : 0;
            console.log(`[URL]: ${url} -> Retrieved records: ${count}`);
                
            return json;
        })();

        const dataArray = (result && Array.isArray(result.data)) ? result.data : [];

        const finalResult = {
            code: 'SUCCESS',
            totalRecords: dataArray.length,
            data: dataArray
        };

        return finalResult;
    } catch (error) {
        console.error('Execution failed - getExchangeIndicesData():', error);
    }
}

/* --- 
    Des: Get Exchange Indices Data
    Return type: JSON
    Sample: ./samples/market_data_sample.json
--- */
async function getMarketData() {
    const urls = [
        'https://iboard-query.ssi.com.vn/stock/group/VN30',
        'https://iboard-query.ssi.com.vn/stock/exchange/hose?boardId=MAIN',
        'https://iboard-query.ssi.com.vn/stock/exchange/hnx?boardId=MAIN',
        'https://iboard-query.ssi.com.vn/stock/exchange/upcom?boardId=MAIN'
    ];
    
    try {
        console.log('=== Starting Market data fetch from APIs...');

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

        console.log(`\nTotal unique records after aggregation: ${aggregatedData.length}`);
        return finalResult
    } catch (error) {
        console.error('Execution failed: - getMarketData()', error);
    }
}

/* --- 
    Des: Dowload data as JSON
    Sample: ./samples/stock_master_data_sample.json
--- */
async function downloadData() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    //const baseFileName = 'exchange_indices_data';
    //const baseFileName = 'market_data';
    const baseFileName = 'stock_master_data';

    const fileName = `${baseFileName}_${year}${month}${day}.json`

    const exchangeIndicesData = await getExchangeIndicesData();
    const marketData = await getMarketData();
    
    //const finalResult = exchangeIndicesData;
    //const finalResult = marketData;
    const finalResult = {
        exchangeIndicesData: exchangeIndicesData,
        marketData: marketData
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
    console.log(`=== Successfully downloaded aggregated stock data to ${fileName}.`);
}

// Execute
downloadData()