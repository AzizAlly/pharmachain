import { NextRequest, NextResponse } from 'next/server';
import { getBlockchain } from '@/lib/blockchain/core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;
    const blockchain = getBlockchain();

    // Validate transaction type
    const validTypes = ['CREATE_MEDICINE', 'VERIFY_MEDICINE', 'TRANSFER_MEDICINE', 'REGISTER_USER'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid transaction type'
      }, { status: 400 });
    }

    // Create transaction
    const transaction = blockchain.createTransaction({
      type,
      data
    });

    return NextResponse.json({
      success: true,
      transaction,
      pendingCount: blockchain.getPendingCount()
    });
  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txId = searchParams.get('id');
    const blockchain = getBlockchain();

    if (txId) {
      const transaction = blockchain.getTransaction(txId);
      if (!transaction) {
        return NextResponse.json({
          success: false,
          error: 'Transaction not found'
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        transaction
      });
    }

    // Get all transactions from last 10 blocks
    const chain = blockchain.getChain(10);
    const transactions = chain.flatMap(block => block.transactions);
    
    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}