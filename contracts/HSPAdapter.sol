// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HSPAdapter {
    enum RequestStatus { Pending, Confirmed, Settled, Cancelled }

    struct PaymentRequest {
        bytes32 requestId;
        address payer;
        address recipient;
        address token;
        uint256 amount;
        RequestStatus status;
        uint256 createdAt;
        uint256 settledAt;
    }

    mapping(bytes32 => PaymentRequest) public requests;
    uint256 public requestCount;

    event PaymentRequestCreated(bytes32 indexed requestId, address indexed payer, address indexed recipient, address token, uint256 amount);
    event PaymentConfirmed(bytes32 indexed requestId);
    event PaymentSettled(bytes32 indexed requestId, uint256 timestamp);

    function createPaymentRequest(
        address payer, address recipient, address token, uint256 amount
    ) external returns (bytes32 requestId) {
        requestCount++;
        requestId = keccak256(abi.encodePacked(payer, recipient, token, amount, block.timestamp, requestCount));
        requests[requestId] = PaymentRequest({
            requestId: requestId, payer: payer, recipient: recipient,
            token: token, amount: amount, status: RequestStatus.Pending,
            createdAt: block.timestamp, settledAt: 0
        });
        emit PaymentRequestCreated(requestId, payer, recipient, token, amount);
    }

    function confirmPayment(bytes32 requestId) external {
        PaymentRequest storage req = requests[requestId];
        require(req.createdAt != 0, "Not found");
        require(req.status == RequestStatus.Pending, "Not pending");
        req.status = RequestStatus.Confirmed;
        emit PaymentConfirmed(requestId);
    }

    function markSettled(bytes32 requestId) external {
        PaymentRequest storage req = requests[requestId];
        require(req.createdAt != 0, "Not found");
        req.status = RequestStatus.Settled;
        req.settledAt = block.timestamp;
        emit PaymentSettled(requestId, block.timestamp);
    }
}
