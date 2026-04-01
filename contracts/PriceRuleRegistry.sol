// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PriceRuleRegistry {
    enum ConditionType { GasPrice, WalletReputation, TimeOfDay, Location }
    enum Operator { LessThan, GreaterThan, Equals, Between }

    struct Rule {
        uint256 id;
        address merchant;
        ConditionType conditionType;
        Operator operator;
        uint256 threshold;
        uint256 thresholdHigh;
        int256 adjustmentBps;
        bool active;
        string label;
    }

    mapping(address => Rule[]) public merchantRules;
    uint256 public ruleCount;

    event RuleCreated(address indexed merchant, uint256 ruleId, string label);
    event RuleToggled(address indexed merchant, uint256 ruleId, bool active);

    function createRule(
        ConditionType conditionType,
        Operator operator,
        uint256 threshold,
        uint256 thresholdHigh,
        int256 adjustmentBps,
        string calldata label
    ) external returns (uint256) {
        ruleCount++;
        merchantRules[msg.sender].push(Rule({
            id: ruleCount,
            merchant: msg.sender,
            conditionType: conditionType,
            operator: operator,
            threshold: threshold,
            thresholdHigh: thresholdHigh,
            adjustmentBps: adjustmentBps,
            active: true,
            label: label
        }));
        emit RuleCreated(msg.sender, ruleCount, label);
        return ruleCount;
    }

    function toggleRule(uint256 index, bool active) external {
        require(index < merchantRules[msg.sender].length, "Invalid index");
        merchantRules[msg.sender][index].active = active;
        emit RuleToggled(msg.sender, merchantRules[msg.sender][index].id, active);
    }

    function getRules(address merchant) external view returns (Rule[] memory) {
        return merchantRules[merchant];
    }
}
