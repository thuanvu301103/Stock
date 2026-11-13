/**
 * Regime Classify rules: './samples/market_regime_rules_sample.json'
 * 
 */
class RegimeClassifyEngine {

    constructor(ruleDefinitions, allocationMatrixDefinitions, overrideRuleDefinitions) {
        this.regimeRules = ruleDefinitions.sort((a, b) => a.priority - b.priority);
        this.regimeCodeMap = new Map(this.regimeRules.map(rule => [rule.regime_code, rule]));
        this.allocationMatrix = allocationMatrixDefinitions;
        this.allocationMatrixMap = new Map(this.allocationMatrix.map(rule => [rule.regime_code, rule]));
        this.overrideRules = overrideRuleDefinitions.sort((a,b) => a.priority - b.priority);
        this.overrideRuleMap =  new Map(this.overrideRules.map(rule => [rule.override_id, rule]));
        this.overrideActionMap = new Map();
    }

    registerOverrideAction(code, fn) {
        if (typeof code !== "string" || typeof fn !== "function") {
            throw new TypeError("register expects a string code and a function reference.");
        }
        this.overrideActionMap.set(code, fn);
    }

    applyOverrideRule(result, context) {
      result.override_applied = null;

      for (const override of this.overrideRules) {
        if (!this.evaluateNode(override.condition, context)) continue;
        result.override_applied = { ...override };

        for (const action of override.actions || []) {
          const actionFn = this.overrideActionMap.get(action.method);
          if (!actionFn) {
            throw new Error(`No handler registered for override action '${action.method}'.`);
          }

          const args = Array.isArray(action.args) ? action.args : [];
          // Pass this instance as the action's self argument.
          const updatedResult = actionFn(result, context, this, ...args);
          if (updatedResult !== undefined) {
            result = updatedResult;
          }
        }

        // Rules are sorted by priority, so stop after the first matching rule.
        break;
      }

      return result;
    }

    /**
     * Resolves a single operand node (can be a field reference, a static value, or a nested operation).
     * @param {Object} operandNode 
     * @param {Object} context 
     * @returns {any}
     */
    resolveOperand(operandNode, context) {
        if ('field' in operandNode) {
            return context[operandNode.field];
        }
        if ('value' in operandNode) {
            return operandNode.value;
        }
        if ('operator' in operandNode) {
            // It's a nested mathematical or logical expression node
            return this.evaluateNode(operandNode, context);
        }
        return undefined;
    }

    /**
     * Recursively evaluates any AST node (logical operators, comparison operators, or arithmetic operations).
     * @param {Object} node 
     * @param {Object} context 
     * @returns {any}
     */
    evaluateNode(node, context) {
        if (!node || !node.operator) return false;

        const op = node.operator.toUpperCase();
        const operands = node.operands || [];

        // Handle logical operators
        if (op === "AND") {
            return operands.every(subNode => this.evaluateNode(subNode, context));
        }
        if (op === "OR") {
            return operands.some(subNode => this.evaluateNode(subNode, context));
        }
        if (op === "NOT") {
            return !this.evaluateNode(operands[0], context);
        }

        // Handle arithmetic operators (when evaluation is used inside an expression)
        if (op === "+") {
            return this.resolveOperand(operands[0], context) + this.resolveOperand(operands[1], context);
        }
        if (op === "-") {
            return this.resolveOperand(operands[0], context) - this.resolveOperand(operands[1], context);
        }
        if (op === "*") {
            return this.resolveOperand(operands[0], context) * this.resolveOperand(operands[1], context);
        }
        if (op === "/") {
            const denominator = this.resolveOperand(operands[1], context);
            return denominator === 0 ? 0 : this.resolveOperand(operands[0], context) / denominator;
        }

        // Handle comparison and special operators (Leaf comparisons)
        const leftVal = this.resolveOperand(operands[0], context);
        const rightVal = operands[1] ? this.resolveOperand(operands[1], context) : undefined;

        switch (op) {
            case ">":
                return leftVal > rightVal;
            case ">=":
                return leftVal >= rightVal;
            case "<":
                return leftVal < rightVal;
            case "<=":
                return leftVal <= rightVal;
            case "==":
                return leftVal === rightVal;
            case "!=":
                return leftVal !== rightVal;
            case "ABS_APPROX": {
                // operands[0] = field, operands[1] = target, operands[2] = tolerance
                const target = this.resolveOperand(operands[1], context);
                const tolerance = this.resolveOperand(operands[2], context);
                return Math.abs(leftVal - target) <= tolerance;
            }
            default:
                return false;
        }
    }

    /**
     * Determines base regime by executing the ordered priority rule list.
     * @param {Object} context 
     * @returns {string}
     */
    determineBaseRegime(context) {
        for (const rule of this.regimeRules) {
            if (this.evaluateNode(rule.condition, context)) {
                return {
                  "market_classification": {
                    "regime_code": rule.regime_code,
                    "state": rule.state,
                    "description": rule.description,
                    "conditions": rule.condition,
                  },
                  "allocation": this.allocationMatrixMap.get(rule.regime_code).allocation
                };
            }
        }

        let rule = undefined;
        if (context.ad_slope_5 > 0) {
          rule = JSON.parse(JSON.stringify(this.regimeCodeMap.get("REGIME_1")));
          rule.condition = {
            "operator": ">",
            "operands": [
              { "field": "ad_slope_5" },
              { "value": 0 }
            ]
          }
        } else if (context.ad_slope_5 == 0) {
          rule = JSON.parse(JSON.stringify(this.regimeCodeMap.get("REGIME_3")));
          rule.condition = {
            "operator": "==",
            "operands": [
              { "field": "ad_slope_5" },
              { "value": 0 }
            ]
          }
        } else if (context.ad_slope_5 < 0) {
          rule = JSON.parse(JSON.stringify(this.regimeCodeMap.get("REGIME_4")));
          rule.condition = {
            "operator": "<",
            "operands": [
              { "field": "ad_slope_5" },
              { "value": 0 }
            ]
          }
        }
        return {
          "market_classification": {
            "regime_code": rule.regime_code,
            "state": rule.state,
            "description": `No rule matched - ${rule.description}`,
            "conditions": rule.condition,
          },
          "allocation": this.allocationMatrixMap.get(rule.regime_code).allocation
        }
    }

   
}

/* TESTING */

// Define the market regime rules
const marketRegimeRules = [
    {
      "regime_code": "REGIME_5",
      "priority": 1,
      "state": "Panic",
      "description": "The market experienced extreme oversold conditions, and signs of panic emerged",
      "condition": {
        "operator": "AND",
        "operands": [
          {
            "operator": "<",
            "operands": [
              { "field": "ratio_ad" },
              { "value": 0.2 }
            ]
          },
          {
            "operator": "==",
            "operands": [
              { "field": "ceiling" },
              { "value": 0 }
            ]
          },
          {
            "operator": ">=",
            "operands": [
              { "field": "floor" },
              { "value": 30 }
            ]
          }
        ]
      }
    },
    {
      "regime_code": "REGIME_1",
      "priority": 2,
      "state": "Broad Uptrend",
      "description": "The flow of money is spreading across the entire market in line with market consensus",
      "condition": {
        "operator": "AND",
        "operands": [
          {
            "operator": ">",
            "operands": [
              { "field": "ad_slope_5" },
              { "value": 0 }
            ]
          },
          {
            "operator": ">=",
            "operands": [
              { "field": "ratio_ad" },
              { "value": 1.5 }
            ]
          },
          {
            "operator": "ABS_APPROX",
            "operands": [
              { "field": "index_return_differential_vn30_vnindex" },
              { "value": 0 },
              { "value": 0.1 }
            ]
          }
        ]
      }
    },
    {
      "regime_code": "REGIME_2",
      "priority": 3,
      "state": "Narrow Uptrend",
      "description": "Cash flow boosts VN30 stocks, while Midcap/Smallcap stocks experience capital outflow",
      "condition": {
        "operator": "AND",
        "operands": [
          {
            "operator": "<=",
            "operands": [
              { "field": "ad_slope_5" },
              { "value": 0 }
            ]
          },
          {
            "operator": "<",
            "operands": [
              { "field": "ratio_ad" },
              { "value": 1.0 }
            ]
          },
          {
            "operator": ">",
            "operands": [
              { "field": "index_return_differential_vn30_vnindex" },
              { "value": 0.5 }
            ]
          }
        ]
      }
    },
    {
      "regime_code": "REGIME_3",
      "priority": 4,
      "state": "Sideway",
      "description": "Money flows between industry sectors, and there is no indication of a sustained trend",
      "condition": {
        "operator": "AND",
        "operands": [
          {
            "operator": "ABS_APPROX",
            "operands": [
              { "field": "ad_slope_5" },
              { "value": 0 },
              { "value": 0.05 }
            ]
          },
          {
            "operator": "AND",
            "operands": [
              {
                "operator": ">=",
                "operands": [
                  { "field": "ratio_ad" },
                  { "value": 0.8 }
                ]
              },
              {
                "operator": "<=",
                "operands": [
                  { "field": "ratio_ad" },
                  { "value": 1.2 }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      "regime_code": "REGIME_4",
      "priority": 5,
      "state": "Broad Downtrend",
      "description": "Widespread selling pressure led to a simultaneous decline in stock prices",
      "condition": {
        "operator": "AND",
        "operands": [
          {
            "operator": "<",
            "operands": [
              { "field": "ad_slope_5" },
              { "value": 0 }
            ]
          },
          {
            "operator": "<=",
            "operands": [
              { "field": "ratio_ad" },
              { "value": 0.66 }
            ]
          }
        ]
      }
    }
  ];

// Define the allocation matrix for each regime
const allocationMatrix = [
    {
      "regime_code": "REGIME_1",
      "allocation": {
        "w_stock": 80,
        "w_cash": 20,
        "w_vn30/w_stock": 40,
        "w_midcap/w_stock": 60
      }
    },
    {
      "regime_code": "REGIME_2",
      "allocation": {
        "w_stock": 50,
        "w_cash": 50,
        "w_vn30/w_stock": 80,
        "w_midcap/w_stock": 20
      }
    },
    {
      "regime_code": "REGIME_3",
      "allocation": {
        "w_stock": 50,
        "w_cash": 50,
        "w_vn30/w_stock": 50,
        "w_midcap/w_stock": 50
      }
    },
    {
      "regime_code": "REGIME_4",
      "allocation": {
        "w_stock": 20,
        "w_cash": 80,
        "w_vn30/w_stock": 80,
        "w_midcap/w_stock": 20
      }
    },
    {
      "regime_code": "REGIME_5",
      "description": "Allocate a minor position (w_stock* = 30%) for bottom-fishing strictly when momentum indicators (RSI/Stochastic) enter the oversold zone (< 20)",
      "allocation": {
        "w_stock": 20,
        "w_cash": 80,
        "w_stock*": 30,
        "w_cash*": 70,
        "w_vn30/w_stock": 70,
        "w_midcap/w_stock": 30
      }
    }
  ];

// Define the risk override rules
const riskOverrideRules = [
    {
      "override_id": "EDGE_CASE_1",
      "priority": 1,
      "state": "Bull on Weight",
      "description": "Index value surges while the A/D Line falls, signaling a large-cap-driven Bull on Weight trap; force REGIME_2, reduce mid/small-cap exposure, and halt new buys outside large-cap.",
      "condition": {
        "operator": "AND",
        "operands": [
          {
            "operator": ">",
            "operands": [
              { "field": "return" },
              { "value": 1.5 }
            ]
          },
          {
            "operator": "<",
            "operands": [
              { "field": "ratio_ad" },
              { "value": 0.5 }
            ]
          }
        ]
      },
      "actions": [
        {
          "method": "force_regime",
          "args": ["REGIME_2"]
        }
      ]
    },
    {
      "override_id": "EDGE_CASE_2",
      "priority": 2,
      "state": "Liquidity Crunch",
      "description": "Trading value falls below 60% of its 20-session average, signaling a liquidity crunch; cap stock allocation at 50% despite positive A/D breadth.",
      "condition": {
        "operator": "AND",
        "operands": [
          {
            "operator": ">",
            "operands": [
              { "field": "ma20_value" },
              { "value": 0 }
            ]
          },
          {
            "operator": "<",
            "operands": [
              { "field": "all_value" },
              {
                "operator": "*",
                "operands": [
                  { "value": 0.6 },
                  { "field": "ma20_value" }
                ]
              }
            ]
          }
        ]
      },
      "actions": [
        {
          "method": "cap_w_stock_max",
          "args": [50.0]
        }
      ]
    }
  ];
// Override action implementations
function forceRegime(result, context, src, regimeCode) {
  const newRegimeRule = src.regimeCodeMap.get(regimeCode);
  result.market_classification = {
    "regime_code": newRegimeRule.regime_code,
    "state": newRegimeRule.state,
    "description": `Override rule - ${newRegimeRule.description}`,
    "conditions": newRegimeRule.condition,
  };
  result.allocation = src.allocationMatrixMap.get(regimeCode).allocation;
}

function capStockAllocation(result, context, src, maxPercent) {
  result.allocation.w_stock = Math.min(result.allocation.w_stock, maxPercent);
  result.allocation.w_cash = 100 - result.allocation.w_stock;
}

// Create an instance of the RegimeClassifyEngine with the defined rules and allocation matrix
const engine = new RegimeClassifyEngine(marketRegimeRules, allocationMatrix, riskOverrideRules);
engine.registerOverrideAction("force_regime", forceRegime);
engine.registerOverrideAction("cap_w_stock_max", capStockAllocation);

function classifyWithOverrides(context) {
  const result = engine.determineBaseRegime(context);
  return engine.applyOverrideRule(result, context);
}

// Regime 5
console.log(classifyWithOverrides({
    "ratio_ad": 0.1,
    "ceiling": 0,
    "floor": 31
}));
// Regime 1
console.log(classifyWithOverrides({
    "ad_slope_5": 1,
    "ratio_ad": 1.5,
    "index_return_differential_vn30_vnindex": 0.01
}));
// Regime 1 - default
console.log(classifyWithOverrides({
    "ad_slope_5": 10
}));
// Regime 2
console.log(classifyWithOverrides({
    "ad_slope_5": -1,
    "ratio_ad": 0.5,
    "index_return_differential_vn30_vnindex": 0.6
}));
// Regime 3
console.log(classifyWithOverrides({
    "ad_slope_5": 0.01,
    "ratio_ad": 1
}));
// Regime 4
console.log(classifyWithOverrides({
    "ad_slope_5": -1,
    "ratio_ad": 0.2
}));
// Regime 4 - default
console.log(classifyWithOverrides({
    "ad_slope_5": -1
}));

// Override EDGE_CASE_1: force the classification to REGIME_2.
console.log("EDGE_CASE_1 - force_regime:");
console.log(classifyWithOverrides({
  "ad_slope_5": -1,
  "ratio_ad": 0.4,
  "return": 2.0
}));

// Override EDGE_CASE_2: cap stock allocation at 50% when value is below 60% of MA20.
console.log("EDGE_CASE_2 - cap_w_stock_max:");
console.log(classifyWithOverrides({
  "ad_slope_5": 1,
  "ratio_ad": 1.5,
  "index_return_differential_vn30_vnindex": 0.05,
  "ma20_value": 100,
  "all_value": 50
}));