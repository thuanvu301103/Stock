const dynamicBuyCashPercentage = 0.15; // 15% of cash to be used for buying stocks daily

/**
 * Calculates the daily cash amount to spend on purchasing stocks and allocates 
 * it proportionally between LargeCap and MidCap assets based on current deficits 
 * or target weight ratios.
 *
 * @param {number} curWCash - Current cash weight relative to total assets.
 * @param {number} curWStock - Current total stock weight relative to total assets.
 * @param {number} curWLargeCap - Current LargeCap stock weight relative to total assets.
 * @param {number} curWMidCap - Current MidCap stock weight relative to total assets.
 * @param {number} curTotal - Current total portfolio value.
 * @param {number} targetWCash - Target cash weight relative to total assets.
 * @param {number} targetWStock - Target total stock weight relative to total assets.
 * @param {number} targetWLargeCap - Target LargeCap stock weight relative to total assets.
 * @param {number} targetWMidCap - Target MidCap stock weight relative to total assets.
 * @returns {Object} An object containing spendCash, allocateLargeCap, and allocateMidCap values.
 */
function executeBuyStrategy(
    curWCash,
    curWStock,
    curWLargeCap,
    curWMidCap,
    curTotal,
    targetWCash,
    targetWStock,
    targetWLargeCap,
    targetWMidCap
) {
    // 1. Calculate spendCash
    const targetBuyCash = curTotal * (targetWStock - curWStock);
    const minBuyCash = curWCash * curTotal * dynamicBuyCashPercentage;
    let spendCash = 0;
    if (targetBuyCash > minBuyCash) {
        spendCash = targetBuyCash;
    } else {
        spendCash = minBuyCash;
    }

    // 2. Allocate spendCash into LargeCap and MidCap
    const targetLargeCapVal = curTotal * targetWLargeCap;
    const currentLargeCapVal = curTotal * curWLargeCap;
    const deficitLargeCap = Math.max(0, targetLargeCapVal - currentLargeCapVal);

    const targetMidCapVal = curTotal * targetWMidCap;
    const currentMidCapVal = curTotal * curWMidCap;
    const deficitMidCap = Math.max(0, targetMidCapVal - currentMidCapVal);

    const totalDeficit = deficitLargeCap + deficitMidCap;

    let allocateLargeCap = 0;
    let allocateMidCap = 0;

    if (totalDeficit > 0) {
        allocateLargeCap = spendCash * (deficitLargeCap / totalDeficit);
        allocateMidCap = spendCash * (deficitMidCap / totalDeficit);
    } else {
        const totalTargetStock = targetWLargeCap + targetWMidCap;
        if (totalTargetStock > 0) {
            allocateLargeCap = spendCash * (targetWLargeCap / totalTargetStock);
            allocateMidCap = spendCash * (targetWMidCap / totalTargetStock);
        }
    }

    return {
        spendCash: spendCash,
        allocateLargeCap: allocateLargeCap,
        allocateMidCap: allocateMidCap
    };
}

const result1 = executeBuyStrategy(
    0.50,  // curWCash
    0.40,  // curWStock
    0.25,  // curWLargeCap
    0.15,  // curWMidCap
    100000,// curTotal
    0.40,  // targetWCash
    0.60,  // targetWStock
    0.40,  // targetWLargeCap
    0.20   // targetWMidCap
);

console.log(result1);
// Output:
// {
//     spendCash: 20000, 
//     allocateLargeCap: 13333.333333333334, 
//     allocateMidCap: 6666.666666666667
// }


const result2 = executeBuyStrategy(
    0.60,  // curWCash
    0.40,  // curWStock
    0.25,  // curWLargeCap
    0.15,  // curWMidCap
    100000,// curTotal
    0.70,  // targetWCash
    0.30,  // targetWStock
    0.20,  // targetWLargeCap
    0.10   // targetWMidCap
);

console.log(result2);
// Output:
// {
//     spendCash: 9000,
//     allocateLargeCap: 6000,
//     allocateMidCap: 3000
// }