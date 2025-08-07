const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// =============================================================================
// PAYMENT QUEUE SYSTEM FOR HIGH-VOLUME PAYMENT PROCESSING
// =============================================================================

class PaymentQueue {
  constructor() {
    this.queue = [];
    this.processing = new Set();
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_PAYMENTS) || 10;
    this.retryAttempts = parseInt(process.env.PAYMENT_RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.PAYMENT_RETRY_DELAY) || 5000;
    this.batchSize = parseInt(process.env.PAYMENT_BATCH_SIZE) || 50;
    this.isProcessing = false;
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Payment processing statistics
    this.stats = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      retried: 0,
      averageProcessingTime: 0
    };
  }

  // Add payment to queue
  async addToQueue(paymentData) {
    const paymentId = crypto.randomUUID();
    const queueItem = {
      id: paymentId,
      data: paymentData,
      status: 'queued',
      attempts: 0,
      createdAt: new Date(),
      priority: this.calculatePriority(paymentData)
    };

    this.queue.push(queueItem);
    console.log(`Payment ${paymentId} added to queue. Queue length: ${this.queue.length}`);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return paymentId;
  }

  // Calculate payment priority (higher amount = higher priority)
  calculatePriority(paymentData) {
    const amount = paymentData.amount || 0;
    if (amount > 10000) return 3; // High priority for large amounts
    if (amount > 5000) return 2;  // Medium priority
    return 1; // Normal priority
  }

  // Process the payment queue
  async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('Starting payment queue processing...');

    while (this.queue.length > 0 && this.processing.size < this.maxConcurrent) {
      // Sort queue by priority (highest first)
      this.queue.sort((a, b) => b.priority - a.priority);
      
      const payment = this.queue.shift();
      if (payment) {
        this.processing.add(payment.id);
        this.processPayment(payment).catch(error => {
          console.error(`Error processing payment ${payment.id}:`, error);
          this.processing.delete(payment.id);
        });
      }
    }

    this.isProcessing = false;
    
    // If there are still items in queue, schedule next processing
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  // Process individual payment
  async processPayment(payment) {
    const startTime = Date.now();
    console.log(`Processing payment ${payment.id} (attempt ${payment.attempts + 1})`);

    try {
      // Update payment status to processing
      await this.updatePaymentStatus(payment.id, 'processing');

      // Process the payment
      const result = await this.executePayment(payment.data);

      // Update payment status based on result
      if (result.success) {
        await this.updatePaymentStatus(payment.id, 'completed', result);
        this.stats.successful++;
        console.log(`Payment ${payment.id} completed successfully`);
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }

      // Update statistics
      this.stats.totalProcessed++;
      this.stats.averageProcessingTime = 
        (this.stats.averageProcessingTime * (this.stats.totalProcessed - 1) + (Date.now() - startTime)) / this.stats.totalProcessed;

    } catch (error) {
      console.error(`Payment ${payment.id} failed:`, error.message);
      
      payment.attempts++;
      
      if (payment.attempts < this.retryAttempts) {
        // Retry payment
        this.stats.retried++;
        await this.updatePaymentStatus(payment.id, 'retrying', { error: error.message, attempts: payment.attempts });
        
        // Add back to queue with exponential backoff
        const delay = this.retryDelay * Math.pow(2, payment.attempts - 1);
        setTimeout(() => {
          this.queue.push(payment);
          if (!this.isProcessing) {
            this.processQueue();
          }
        }, delay);
        
        console.log(`Payment ${payment.id} scheduled for retry in ${delay}ms (attempt ${payment.attempts + 1})`);
      } else {
        // Max retries reached, mark as failed
        this.stats.failed++;
        await this.updatePaymentStatus(payment.id, 'failed', { error: error.message, attempts: payment.attempts });
        console.log(`Payment ${payment.id} failed after ${payment.attempts} attempts`);
      }
    } finally {
      this.processing.delete(payment.id);
    }
  }

  // Execute the actual payment
  async executePayment(paymentData) {
    // Simulate payment processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

    // Here you would integrate with your payment gateway
    // For now, we'll simulate success/failure based on amount
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      return {
        success: true,
        transactionId: crypto.randomUUID(),
        processedAt: new Date().toISOString()
      };
    } else {
      throw new Error('Payment gateway error');
    }
  }

  // Update payment status in database
  async updatePaymentStatus(paymentId, status, additionalData = {}) {
    try {
      const { error } = await this.supabase
        .from('payment_queue')
        .upsert({
          payment_id: paymentId,
          status: status,
          updated_at: new Date().toISOString(),
          ...additionalData
        });

      if (error) {
        console.error('Error updating payment status:', error);
      }
    } catch (error) {
      console.error('Database error updating payment status:', error);
    }
  }

  // Batch processing for high-volume scenarios
  async processBatch(batchSize = this.batchSize) {
    const batch = this.queue.splice(0, batchSize);
    console.log(`Processing batch of ${batch.length} payments`);

    const promises = batch.map(payment => this.processPayment(payment));
    const results = await Promise.allSettled(promises);

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Batch completed: ${successful} successful, ${failed} failed`);
    return { successful, failed, total: batch.length };
  }

  // Get queue statistics
  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent
    };
  }

  // Clear completed payments from queue
  async clearCompleted() {
    const completedPayments = this.queue.filter(p => p.status === 'completed');
    this.queue = this.queue.filter(p => p.status !== 'completed');
    console.log(`Cleared ${completedPayments.length} completed payments from queue`);
  }

  // Emergency stop processing
  stopProcessing() {
    this.isProcessing = false;
    console.log('Payment processing stopped');
  }

  // Resume processing
  resumeProcessing() {
    if (!this.isProcessing && this.queue.length > 0) {
      this.processQueue();
    }
  }
}

// =============================================================================
// PAYMENT WEBHOOK HANDLER WITH QUEUE INTEGRATION
// =============================================================================

class PaymentWebhookHandler {
  constructor() {
    this.paymentQueue = new PaymentQueue();
    this.webhookQueue = [];
    this.isProcessingWebhooks = false;
  }

  // Handle incoming webhook
  async handleWebhook(webhookData) {
    const webhookId = crypto.randomUUID();
    
    // Add to webhook queue for processing
    this.webhookQueue.push({
      id: webhookId,
      data: webhookData,
      receivedAt: new Date()
    });

    // Start processing webhooks if not already running
    if (!this.isProcessingWebhooks) {
      this.processWebhookQueue();
    }

    // Return immediate acknowledgment
    return {
      success: true,
      webhookId: webhookId,
      message: 'Webhook received and queued for processing'
    };
  }

  // Process webhook queue
  async processWebhookQueue() {
    if (this.isProcessingWebhooks) return;
    
    this.isProcessingWebhooks = true;
    console.log('Starting webhook queue processing...');

    while (this.webhookQueue.length > 0) {
      const webhook = this.webhookQueue.shift();
      if (webhook) {
        try {
          await this.processWebhook(webhook);
        } catch (error) {
          console.error(`Error processing webhook ${webhook.id}:`, error);
        }
      }
    }

    this.isProcessingWebhooks = false;
  }

  // Process individual webhook
  async processWebhook(webhook) {
    console.log(`Processing webhook ${webhook.id}`);
    
    const { data } = webhook;
    
    // Validate webhook data
    if (!this.validateWebhookData(data)) {
      throw new Error('Invalid webhook data');
    }

    // Add payment to processing queue
    await this.paymentQueue.addToQueue({
      reference: data.reference,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      customer: data.customer,
      webhookId: webhook.id
    });
  }

  // Validate webhook data
  validateWebhookData(data) {
    const requiredFields = ['reference', 'status', 'amount', 'currency'];
    return requiredFields.every(field => data[field] !== undefined);
  }

  // Get system status
  getStatus() {
    return {
      paymentQueue: this.paymentQueue.getStats(),
      webhookQueue: this.webhookQueue.length,
      isProcessingWebhooks: this.isProcessingWebhooks
    };
  }
}

// =============================================================================
// CONCURRENT PAYMENT PROCESSING UTILITIES
// =============================================================================

class ConcurrentPaymentProcessor {
  constructor(maxConcurrent = 10) {
    this.maxConcurrent = maxConcurrent;
    this.activeProcesses = new Map();
    this.semaphore = maxConcurrent;
  }

  // Process payments with concurrency control
  async processPayments(payments) {
    const results = [];
    const chunks = this.chunkArray(payments, this.maxConcurrent);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(payment => this.processWithSemaphore(payment));
      const chunkResults = await Promise.allSettled(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  // Process single payment with semaphore
  async processWithSemaphore(payment) {
    if (this.semaphore <= 0) {
      // Wait for available slot
      await this.waitForSlot();
    }

    this.semaphore--;
    const processId = crypto.randomUUID();
    this.activeProcesses.set(processId, payment);

    try {
      const result = await this.processPayment(payment);
      return result;
    } finally {
      this.semaphore++;
      this.activeProcesses.delete(processId);
    }
  }

  // Wait for available processing slot
  async waitForSlot() {
    return new Promise(resolve => {
      const checkSlot = () => {
        if (this.semaphore > 0) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }

  // Process individual payment
  async processPayment(payment) {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));
    
    return {
      success: Math.random() > 0.1,
      paymentId: payment.id,
      processedAt: new Date().toISOString()
    };
  }

  // Split array into chunks
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Get current status
  getStatus() {
    return {
      maxConcurrent: this.maxConcurrent,
      activeProcesses: this.activeProcesses.size,
      availableSlots: this.semaphore
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  PaymentQueue,
  PaymentWebhookHandler,
  ConcurrentPaymentProcessor
}; 