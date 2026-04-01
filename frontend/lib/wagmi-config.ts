'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWalletClient } from 'wagmi';

export const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet.hsk.xyz'] } },
  blockExplorers: { default: { name: 'HashKey Explorer', url: 'https://testnet-explorer.hsk.xyz' } },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: 'Dynamic Checkout',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || 'd7c12dc8-d33d-4a7f-ba83-6576c26bfd27',
  chains: [hashkeyTestnet],
});

export function useEthersSigner(): ethers.Signer | null {
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    if (!walletClient) { setSigner(null); return; }
    const provider = new ethers.BrowserProvider(walletClient.transport);
    provider.getSigner().then(setSigner).catch(() => setSigner(null));
  }, [walletClient]);

  return signer;
}
