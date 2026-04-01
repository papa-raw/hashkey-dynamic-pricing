export const CHAIN_ID = 133;
export const RPC_URL = 'https://testnet.hsk.xyz';
export const EXPLORER_URL = 'https://testnet-explorer.hsk.xyz';

export const USDC_ADDRESS = '0x8FE3cB719Ee4410E236Cd6b72ab1fCDC06eF53c6';
export const USDT_ADDRESS = '0x372325443233fEbaC1F6998aC750276468c83CC6';

export const PROOFPAY_ATTESTATION_ADDRESS = process.env.NEXT_PUBLIC_ATTESTATION_CONTRACT || '0x057Ac4C0FaaB720eBE9B60BDaBb3f55284429C34';
export const HSP_ADAPTER_ADDRESS = process.env.NEXT_PUBLIC_HSP_ADAPTER_CONTRACT || '0x688eb62266644EF575126a08e14E74De77590780';
export const RULE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_RULE_REGISTRY_CONTRACT || '0xb42D12B5AF3A2d0F59637CF6BF6CC43f9C2B4f9f';

export const PROOFPAY_ATTESTATION_ABI = [
  'function createProof(address payer, uint256 basePrice, uint256 finalPrice, string conditionsJson, string locationJson, bytes32 astralProofUid, bytes32 hspRequestId) returns (bytes32 proofId)',
  'function getProof(bytes32 proofId) view returns (tuple(bytes32 proofId, address merchant, address payer, uint256 basePrice, uint256 finalPrice, string conditionsJson, string locationJson, bytes32 astralProofUid, bytes32 hspRequestId, uint256 timestamp))',
  'function proofCount() view returns (uint256)',
  'event PriceProofCreated(bytes32 indexed proofId, address indexed merchant, address indexed payer, uint256 basePrice, uint256 finalPrice, bytes32 hspRequestId)',
] as const;

export const HSP_ADAPTER_ABI = [
  'function createPaymentRequest(address payer, address recipient, address token, uint256 amount) returns (bytes32 requestId)',
  'function confirmPayment(bytes32 requestId)',
  'function markSettled(bytes32 requestId)',
  'event PaymentRequestCreated(bytes32 indexed requestId, address indexed payer, address indexed recipient, address token, uint256 amount)',
  'event PaymentSettled(bytes32 indexed requestId, uint256 timestamp)',
] as const;

export const RULE_REGISTRY_ABI = [
  'function createRule(uint8 conditionType, uint8 operator, uint256 threshold, uint256 thresholdHigh, int256 adjustmentBps, string label) returns (uint256)',
  'function toggleRule(uint256 index, bool active)',
  'function getRules(address merchant) view returns (tuple(uint256 id, address merchant, uint8 conditionType, uint8 operator, uint256 threshold, uint256 thresholdHigh, int256 adjustmentBps, bool active, string label)[])',
] as const;

export function truncateAddress(addr: string, start = 6, end = 4): string {
  if (!addr || addr.length < start + end + 2) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}
