import OpenAI from 'openai';
import { env, constants } from '../../config/config';
import { AIPrompt, AIResponse, AIParameters, AIError, AIErrorType, DesignStatus, DesignMetrics, PromptContent } from '../models/types';
import { Logger } from '../services/Logger';
import { z } from 'zod';

/**
 * Input validation schemas
 */
const promptSchema = z.object({
  type: z.enum(['text', 'image', 'mixed']),
  content: z.union([
    z.string(),
    z.object({
      image: z.string(),
      text: z.string().optional()
    })
  ]),
  parameters: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional()
  })
});

/**
 * DesignAgent class handles all AI-powered design generation and modifications
 * with comprehensive error handling, monitoring, and retry mechanisms
 */
export class DesignAgent {
  private openai: OpenAI;
  private logger: Logger;
  private metrics: DesignMetrics;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.logger = Logger.getInstance('DesignAgent');
    this.metrics = {
      duration: 0,
      retries: 0,
      memoryUsage: 0,
      cpuUsage: 0
    };
  }

  /**
   * Validates input prompt
   */
  private validatePrompt(prompt: AIPrompt): void {
    try {
      promptSchema.parse(prompt);
    } catch (error) {
      throw new AIError(
        AIErrorType.VALIDATION,
        'Invalid prompt format',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Monitors system resources
   */
  private updateMetrics(): void {
    const usage = process.memoryUsage();
    this.metrics = {
      ...this.metrics,
      memoryUsage: Math.round(usage.heapUsed / 1024 / 1024),
      cpuUsage: process.cpuUsage().user / 1000000
    };
    
    // Log metrics
    this.logger.metric('design_agent.memory_usage', this.metrics.memoryUsage, {
      unit: 'MB',
      context: 'heap'
    });
    this.logger.metric('design_agent.cpu_usage', this.metrics.cpuUsage, {
      unit: 'seconds',
      context: 'user'
    });
  }

  /**
   * Implements retry mechanism with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        retryCount < constants.MAX_RETRIES &&
        error instanceof Error &&
        (error.message.includes('timeout') || error.message.includes('rate_limit'))
      ) {
        const delay = Math.min(
          constants.RETRY_DELAY_MS * Math.pow(2, retryCount),
          constants.REQUEST_TIMEOUT_MS
        );
        
        this.logger.warn('Retrying operation', {
          attempt: retryCount + 1,
          delay,
          error: error.message
        });
        
        this.metrics.retries++;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(operation, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Generates UI design based on text or image prompt
   */
  public async generateDesign(prompt: AIPrompt): Promise<AIResponse> {
    const startTime = performance.now();
    let status = DesignStatus.PENDING;

    try {
      // Validate input
      this.validatePrompt(prompt);
      status = DesignStatus.PROCESSING;

      // Monitor system resources
      this.updateMetrics();

      // Generate design with retry mechanism
      const response = await this.withRetry(async () => {
        return this.openai.chat.completions.create({
          model: prompt.parameters.model || constants.DEFAULT_MODEL,
          messages: this.formatPrompt(prompt),
          temperature: prompt.parameters.temperature || constants.TEMPERATURE,
          max_tokens: prompt.parameters.maxTokens || constants.MAX_TOKENS,
        });
      });

      status = DesignStatus.COMPLETED;
      const processingTime = performance.now() - startTime;
      
      // Update metrics
      this.metrics.duration = processingTime;
      this.logger.metric('design_generation.duration', processingTime);
      this.logger.metric('design_generation.tokens', response.usage?.total_tokens || 0);

      return {
        id: response.id,
        result: response.choices[0].message.content || '',
        metadata: {
          model: response.model,
          processingTime,
          tokensUsed: response.usage?.total_tokens || 0,
          cost: this.calculateCost(response.usage?.total_tokens || 0, response.model),
        },
      };
    } catch (error) {
      status = DesignStatus.FAILED;
      
      // Log error with context
      this.logger.error(
        'Error generating design',
        error instanceof Error ? error : new Error('Unknown error'),
        { prompt, status, metrics: this.metrics }
      );

      // Throw appropriate error type
      if (error instanceof AIError) {
        throw error;
      }
      
      throw new AIError(
        AIErrorType.API,
        'Failed to generate design',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Modifies existing design based on feedback
   */
  public async modifyDesign(
    currentDesign: string,
    feedback: string,
    parameters: AIParameters
  ): Promise<AIResponse> {
    try {
      const prompt: AIPrompt = {
        type: 'mixed',
        content: {
          image: currentDesign,
          text: feedback
        },
        parameters,
      };

      return this.generateDesign(prompt);
    } catch (error) {
      this.logger.error(
        'Error modifying design',
        error instanceof Error ? error : new Error('Unknown error'),
        { currentDesign, feedback, parameters }
      );
      throw error;
    }
  }

  /**
   * Analyzes design for accessibility and best practices
   */
  public async analyzeDesign(design: string): Promise<AIResponse> {
    try {
      const prompt: AIPrompt = {
        type: 'text',
        content: `Please analyze this design for accessibility and best practices:\n${design}`,
        parameters: {
          model: constants.DEFAULT_MODEL,
          temperature: 0.3,
          maxTokens: 1000,
        },
      };

      return this.generateDesign(prompt);
    } catch (error) {
      this.logger.error(
        'Error analyzing design',
        error instanceof Error ? error : new Error('Unknown error'),
        { design }
      );
      throw error;
    }
  }

  /**
   * Formats the prompt for OpenAI API
   */
  private formatPrompt(prompt: AIPrompt): Array<OpenAI.Chat.ChatCompletionMessageParam> {
    const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [
      {
        role: 'system',
        content: `You are LiminalAI, an expert UI/UX designer. Your task is to generate beautiful, 
        accessible, and functional user interfaces based on the provided prompts. Always follow best 
        practices and consider accessibility guidelines.`,
      },
    ];

    if (prompt.type === 'image') {
      const content: OpenAI.Chat.ChatCompletionContentPart[] = [];
      
      if (typeof prompt.content === 'string') {
        content.push({
          type: 'image_url',
          image_url: { url: prompt.content, detail: 'high' }
        } as const);
      } else {
        content.push({
          type: 'image_url',
          image_url: { url: prompt.content.image, detail: 'high' }
        } as const);
        if (prompt.content.text) {
          content.push({ type: 'text', text: prompt.content.text } as const);
        }
      }

      messages.push({
        role: 'user',
        content
      });
    } else {
      messages.push({
        role: 'user',
        content: typeof prompt.content === 'string' 
          ? prompt.content 
          : prompt.content.text || ''
      });
    }

    return messages;
  }

  /**
   * Calculates the cost of API usage
   */
  private calculateCost(tokens: number, model: string): number {
    const costPerToken = model.includes('gpt-4') ? 0.00003 : 0.00002;
    return Number((tokens * costPerToken).toFixed(5));
  }
}

// Export singleton instance
export const designAgent = new DesignAgent(); 