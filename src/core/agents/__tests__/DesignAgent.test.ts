import { DesignAgent } from '../DesignAgent';
import { AIPrompt, AIParameters } from '../../models/types';
import { constants } from '../../../config/config';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          id: 'mock-response-id',
          model: 'gpt-4',
          choices: [
            {
              message: {
                content: '<div>Mock generated design</div>',
              },
            },
          ],
          usage: {
            total_tokens: 100,
          },
        }),
      },
    },
  }));
});

describe('DesignAgent', () => {
  let agent: DesignAgent;

  beforeEach(() => {
    agent = new DesignAgent();
  });

  describe('generateDesign', () => {
    it('should generate design from text prompt', async () => {
      const prompt: AIPrompt = {
        type: 'text',
        content: 'Create a modern login form',
        parameters: {
          model: constants.DEFAULT_MODEL,
          temperature: 0.7,
          maxTokens: 1000,
        },
      };

      const response = await agent.generateDesign(prompt);

      expect(response).toEqual({
        id: 'mock-response-id',
        result: '<div>Mock generated design</div>',
        metadata: {
          model: 'gpt-4',
          processingTime: expect.any(Number),
          tokensUsed: 100,
          cost: expect.any(Number),
        },
      });
    });

    it('should handle errors gracefully', async () => {
      // Mock OpenAI error
      const mockError = new Error('API Error');
      jest.spyOn(agent['openai'].chat.completions, 'create')
        .mockRejectedValueOnce(mockError);

      const prompt: AIPrompt = {
        type: 'text',
        content: 'Create a modern login form',
        parameters: {
          model: constants.DEFAULT_MODEL,
          temperature: 0.7,
          maxTokens: 1000,
        },
      };

      await expect(agent.generateDesign(prompt)).rejects.toThrow('Failed to generate design');
    });
  });

  describe('modifyDesign', () => {
    it('should modify existing design based on feedback', async () => {
      const currentDesign = '<div>Original design</div>';
      const feedback = 'Make it more minimalistic';
      const parameters: AIParameters = {
        model: constants.DEFAULT_MODEL,
        temperature: 0.7,
        maxTokens: 1000,
      };

      const response = await agent.modifyDesign(currentDesign, feedback, parameters);

      expect(response).toEqual({
        id: 'mock-response-id',
        result: '<div>Mock generated design</div>',
        metadata: {
          model: 'gpt-4',
          processingTime: expect.any(Number),
          tokensUsed: 100,
          cost: expect.any(Number),
        },
      });
    });
  });

  describe('analyzeDesign', () => {
    it('should analyze design for accessibility and best practices', async () => {
      const design = '<div>Test design</div>';

      const response = await agent.analyzeDesign(design);

      expect(response).toEqual({
        id: 'mock-response-id',
        result: '<div>Mock generated design</div>',
        metadata: {
          model: 'gpt-4',
          processingTime: expect.any(Number),
          tokensUsed: 100,
          cost: expect.any(Number),
        },
      });
    });
  });
}); 