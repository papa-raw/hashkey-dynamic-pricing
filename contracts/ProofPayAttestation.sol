// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProofPayAttestation {
    struct PriceProof {
        bytes32 proofId;
        address merchant;
        address payer;
        uint256 basePrice;
        uint256 finalPrice;
        string  conditionsJson;
        string  locationJson;
        bytes32 astralProofUid;
        bytes32 hspRequestId;
        uint256 timestamp;
    }

    mapping(bytes32 => PriceProof) public proofs;
    uint256 public proofCount;

    event PriceProofCreated(
        bytes32 indexed proofId,
        address indexed merchant,
        address indexed payer,
        uint256 basePrice,
        uint256 finalPrice,
        bytes32 hspRequestId
    );

    function createProof(
        address payer, uint256 basePrice, uint256 finalPrice,
        string calldata conditionsJson, string calldata locationJson,
        bytes32 astralProofUid, bytes32 hspRequestId
    ) external returns (bytes32 proofId) {
        proofCount++;
        proofId = keccak256(abi.encodePacked(msg.sender, payer, basePrice, finalPrice, block.timestamp, proofCount));
        proofs[proofId] = PriceProof({
            proofId: proofId, merchant: msg.sender, payer: payer,
            basePrice: basePrice, finalPrice: finalPrice,
            conditionsJson: conditionsJson, locationJson: locationJson,
            astralProofUid: astralProofUid, hspRequestId: hspRequestId,
            timestamp: block.timestamp
        });
        emit PriceProofCreated(proofId, msg.sender, payer, basePrice, finalPrice, hspRequestId);
    }

    function getProof(bytes32 proofId) external view returns (PriceProof memory) {
        require(proofs[proofId].timestamp != 0, "Proof not found");
        return proofs[proofId];
    }
}
