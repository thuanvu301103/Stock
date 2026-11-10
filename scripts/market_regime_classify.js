/**
 * Regime Classify rules: './samples/market_regime_rules_sample.json'
 * 
 */
class RegimeClassifyEngine {

    constructor(ruleDefinitions, allocationMatrixDefinitions) {
        this.regimeRules = ruleDefinitions.sort((a, b) => a.priority - b.priority);
        this.regimeCodeMap = new Map(this.regimeRules.map(rule => [rule.regime_code, rule]));
        this.allocationMatrix = allocationMatrixDefinitions;
        this.allocationMatrixMap = new Map(this.allocationMatrix.map(rule => [rule.regime_code, rule]));
        this.overrideRules = ruleDefinitions.risk_override_rules;
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
                  "regime_code": rule.regime_code,
                  "state": rule.state,
                  "description": rule.description,
                  "allocation": this.allocationMatrixMap.get(rule.regime_code).allocation
                };
            }
        }

        let rule = undefined;
        if (context.ad_slope_5 > 0) {
          rule = this.regimeCodeMap.get("REGIME_1");
        } else if (context.ad_slope_5 == 0) {
          rule = this.regimeCodeMap.get("REGIME_3");
        } else if (context.ad_slope_5 < 0) {
          rule = this.regimeCodeMap.get("REGIME_4");
        }
        return {
          "regime_code": rule.regime_code,
          "state": rule.state,
          "description": rule.description,
          "allocation": this.allocationMatrixMap.get(rule.regime_code).allocation
        }
    }

    /**
     * Executes the complete evaluation pipeline.
     * @param {Object} rawMetrics 
     * @returns {Object}
     */
    evaluate(rawMetrics) {
        let rAD = rawMetrics.declines === 0 ? rawMetrics.advances : rawMetrics.advances / rawMetrics.declines;
        let dVN30 = rawMetrics.returnVN30 - rawMetrics.returnVNIndex;
        let netMatchingValue = rawMetrics.allValue - rawMetrics.totalValuePT;

        const context = {
            ...rawMetrics,
            r_ad: rAD,
            d_vn30: dVN30,
            net_matching_value: netMatchingValue
        };

        let regime = this.determineBaseRegime(context);
        let activeOverrides = [];

        for (const override of this.overrideRules) {
            if (this.evaluateNode(override.condition, context)) {
                activeOverrides.push(override.override_id);
                if (override.actions.force_regime) {
                    regime = override.actions.force_regime;
                }
            }
        }

        return {
            classified_regime: regime,
            triggered_overrides: activeOverrides,
            evaluated_metrics: {
                r_ad: rAD,
                d_vn30: dVN30,
                net_matching_value: netMatchingValue
            }
        };
    }
}

/* TESTING */

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
        "w_vn30/w_stock": 100,
        "w_midcap/w_stock": 0
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

const engine = new RegimeClassifyEngine(marketRegimeRules, allocationMatrix);
// Regime 5
console.log(engine.determineBaseRegime({
    "ratio_ad": 0.1,
    "ceiling": 0,
    "floor": 31
}));
// Regime 1
console.log(engine.determineBaseRegime({
    "ad_slope_5": 1,
    "ratio_ad": 1.5,
    "index_return_differential_vn30_vnindex": 0.01
}));
// Regime 1 - default
console.log(engine.determineBaseRegime({
    "ad_slope_5": 10
}));
// Regime 2
console.log(engine.determineBaseRegime({
    "ad_slope_5": -1,
    "ratio_ad": 0.5,
    "index_return_differential_vn30_vnindex": 0.6
}));
// Regime 3
console.log(engine.determineBaseRegime({
    "ad_slope_5": 0.01,
    "ratio_ad": 1
}));
// Regime 4
console.log(engine.determineBaseRegime({
    "ad_slope_5": -1,
    "ratio_ad": 0.2
}));
// Regime 4 - default
console.log(engine.determineBaseRegime({
    "ad_slope_5": -1
}));