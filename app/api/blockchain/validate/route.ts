import { NextResponse } from 'next/server';
import { getBlockchain } from '@/lib/blockchain/core';

export async function GET() {
  try {
    const blockchain = getBlockchain();
    const isValid = blockchain.validateChain();
    
    return NextResponse.json({
      success: true,
      isValid,
      info: blockchain.getBlockchainInfo()
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}