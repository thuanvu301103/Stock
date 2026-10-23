// Configuration constants for execution parameters
const PRICE_MULTIPLIER = 1000;
const ACCOUNT_ID = "GXXXXX1";
const ENDPOINT_URL = "https://iboard-tapi.ssi.com.vn/trading/order";
const REQUEST_DELAY_MS = 10000; // Delay in milliseconds between consecutive orders to prevent rate limiting

// Utility function to introduce a controlled delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to properly extract the device ID from document cookies
function getDeviceId() {
    const match = document.cookie.match(/(?:^|;)\s*deviceId=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : "1F559EEA-9058-4CB6-A9A6-417D891DB7C0";
}

// Function to properly create, mount, and trigger the native file dialog
function loadCsvFile() {
    // Remove any existing input element to prevent duplication
    const existingInput = document.getElementById('csv-file-loader');
    if (existingInput) {
        existingInput.remove();
    }

    const fileInput = document.createElement('input');
    fileInput.id = 'csv-file-loader';
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';

    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.error("[ERROR] No file selected.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const csvText = e.target.result;
            const orders = parseCsvToOrders(csvText);
            
            if (orders.length > 0) {
                console.log(`[INFO] Successfully parsed ${orders.length} orders from file. Initiating execution pipeline...`);
                await processOrderBatch(orders);
            } else {
                console.warn("[WARNING] No valid orders found in the selected CSV file.");
            }
            fileInput.remove();
        };
        reader.readAsText(file);
    };

    // Append to document body so the native dialog renders and behaves correctly
    document.body.appendChild(fileInput);
    fileInput.click();
}

// Function to parse CSV text into structured order objects
function parseCsvToOrders(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const orders = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });

        const symbol = row['stock_key'] || row['symbol'];
        const rawPrice = parseFloat(row['Average of pivot_s1_plus_1'] || row['price'] || 0);
        const rawShares = parseFloat(row['suggested_shares'] || row['quantity'] || 0);

        if (symbol && rawPrice > 0) {
            orders.push({
                instrumentId: symbol,
                price: rawPrice,
                quantity: rawShares < 1 ? 1 : Math.floor(rawShares)
            });
        }
    }

    return orders;
}

// Function to process and send stock orders sequentially with a delay between requests
async function processOrderBatch(orderList) {
    const authToken = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    const tempToken = localStorage.getItem("tempToken") || sessionStorage.getItem("tempToken") || localStorage.getItem("x-temp-token") || "";

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "vi",
        "Authorization": `Bearer ${authToken}`,
        "X-Temp-Token": `Bearer ${tempToken}`,
        "device-id": getDeviceId(),
        "Origin": "https://iboard.ssi.com.vn",
        "Referer": "https://iboard.ssi.com.vn/",
        "x-device-name": "Microsoft Edge",
        "x-os-name": "Windows"
    };

    const successfulOrders = [];
    const failedOrders = [];

    for (const item of orderList) {
        const calculatedPrice = item.price * PRICE_MULTIPLIER;

        const payload = {
            instrumentId: item.instrumentId,
            buySell: "B",
            channelId: "IW",
            orderType: "LO",
            price: calculatedPrice,
            quantity: item.quantity,
            account: ACCOUNT_ID,
            isAutoPrice: false,
            isOrderConfirm: true
        };

        try {
            const response = await fetch(ENDPOINT_URL, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.code === "SUCCESS") {
                successfulOrders.push({
                    symbol: item.instrumentId,
                    inputPrice: item.price,
                    calculatedPrice: calculatedPrice,
                    quantity: item.quantity,
                    response: result
                });
                console.log(`[SUCCESS] Order executed for ${item.instrumentId} | Price: ${calculatedPrice} | Qty: ${item.quantity}`);
            } else {
                failedOrders.push({
                    symbol: item.instrumentId,
                    inputPrice: item.price,
                    calculatedPrice: calculatedPrice,
                    quantity: item.quantity,
                    reason: result
                });
                console.error(`[FAILED] Order rejected for ${item.instrumentId}:`, result);
            }
        } catch (error) {
            failedOrders.push({
                symbol: item.instrumentId,
                inputPrice: item.price,
                calculatedPrice: calculatedPrice,
                quantity: item.quantity,
                reason: error.message
            });
            console.error(`[ERROR] Execution exception for ${item.instrumentId}:`, error);
        }

        // Wait designated milliseconds before executing the next request
        await sleep(REQUEST_DELAY_MS);
    }

    printExecutionSummary(successfulOrders, failedOrders);
}

// Function to render comprehensive tables for successful and failed executions
function printExecutionSummary(successfulOrders, failedOrders) {
    console.log("\n=================== EXECUTION SUMMARY REPORT ===================");
    console.log(`Total Successful: ${successfulOrders.length} | Total Failed: ${failedOrders.length}`);
    
    if (successfulOrders.length > 0) {
        console.log("\n--- SUCCESSFUL ORDERS ---");
        console.table(successfulOrders.map(o => ({
            Symbol: o.symbol,
            InputPrice: o.inputPrice,
            ExecutedPrice: o.calculatedPrice,
            Quantity: o.quantity
        })));
    }

    if (failedOrders.length > 0) {
        console.log("\n--- FAILED ORDERS ---");
        console.table(failedOrders.map(f => ({
            Symbol: f.symbol,
            InputPrice: f.inputPrice,
            ExecutedPrice: f.calculatedPrice,
            Quantity: f.quantity,
            Reason: typeof f.reason === 'object' ? JSON.stringify(f.reason) : f.reason
        })));
        
        const failedSymbols = failedOrders.map(f => f.symbol);
        console.log("List of failed stock symbols:", failedSymbols);
    }
    console.log("=================================================================\n");
}

// Execute workflow
loadCsvFile();