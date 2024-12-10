import { DesignService } from '../DesignService';
import { Design, DesignContent, DesignStatus } from '../../models/types';
import { CloudflareR2Service } from '../../../services/CloudflareR2Service';

// Mock CloudflareR2Service
jest.mock('../../../services/CloudflareR2Service', () => {
  return jest.fn().mockImplementation(() => ({
    uploadDesign: jest.fn().mockResolvedValue(undefined),
    getDesign: jest.fn().mockResolvedValue(JSON.stringify({
      svg: '<svg>Mock SVG</svg>',
      html: '<div>Mock HTML</div>',
      css: '.mock { color: blue; }',
      assets: [],
    })),
    deleteDesign: jest.fn().mockResolvedValue(undefined),
  }));
});

describe('DesignService', () => {
  let service: DesignService;
  let mockStorage: jest.Mocked<CloudflareR2Service>;

  beforeEach(() => {
    service = new DesignService();
    mockStorage = service['storage'] as jest.Mocked<CloudflareR2Service>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDesign', () => {
    it('should create a new design', async () => {
      const userId = 'test-user';
      const title = 'Test Design';
      const content: DesignContent = {
        svg: '<svg>Test</svg>',
        html: '<div>Test</div>',
        css: '.test { color: red; }',
        assets: [],
      };

      const design = await service.createDesign(userId, title, content);

      expect(design).toEqual({
        id: expect.any(String),
        userId,
        title,
        description: '',
        content,
        version: 1,
        status: DesignStatus.DRAFT,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockStorage.uploadDesign).toHaveBeenCalledWith(
        design.id,
        JSON.stringify(content)
      );
    });

    it('should handle storage errors', async () => {
      mockStorage.uploadDesign.mockRejectedValueOnce(new Error('Storage error'));

      await expect(service.createDesign(
        'test-user',
        'Test Design',
        { svg: '', html: '', css: '', assets: [] }
      )).rejects.toThrow('Failed to create design');
    });
  });

  describe('getDesign', () => {
    it('should retrieve a design by ID', async () => {
      const designId = 'test-design-id';
      const design = await service.getDesign(designId);

      expect(design).toEqual({
        id: designId,
        userId: 'mock-user',
        title: 'Mock Design',
        description: '',
        content: {
          svg: '<svg>Mock SVG</svg>',
          html: '<div>Mock HTML</div>',
          css: '.mock { color: blue; }',
          assets: [],
        },
        version: 1,
        status: DesignStatus.DRAFT,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockStorage.getDesign).toHaveBeenCalledWith(designId);
    });

    it('should handle storage errors', async () => {
      mockStorage.getDesign.mockRejectedValueOnce(new Error('Storage error'));

      await expect(service.getDesign('test-id')).rejects.toThrow('Failed to retrieve design');
    });
  });

  describe('updateDesign', () => {
    it('should update an existing design', async () => {
      const designId = 'test-design-id';
      const updates: Partial<Design> = {
        title: 'Updated Title',
        content: {
          svg: '<svg>Updated</svg>',
          html: '<div>Updated</div>',
          css: '.updated { color: green; }',
          assets: [],
        },
      };

      const updatedDesign = await service.updateDesign(designId, updates);

      expect(updatedDesign).toEqual({
        id: designId,
        userId: 'mock-user',
        title: 'Updated Title',
        description: '',
        content: updates.content,
        version: 2,
        status: DesignStatus.DRAFT,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockStorage.uploadDesign).toHaveBeenCalledWith(
        designId,
        JSON.stringify(updates.content)
      );
    });
  });

  describe('deleteDesign', () => {
    it('should delete a design', async () => {
      const designId = 'test-design-id';
      await service.deleteDesign(designId);

      expect(mockStorage.deleteDesign).toHaveBeenCalledWith(designId);
    });

    it('should handle deletion errors', async () => {
      mockStorage.deleteDesign.mockRejectedValueOnce(new Error('Deletion error'));

      await expect(service.deleteDesign('test-id')).rejects.toThrow('Failed to delete design');
    });
  });

  describe('listDesigns', () => {
    it('should return an empty array (mock implementation)', async () => {
      const designs = await service.listDesigns('test-user');
      expect(designs).toEqual([]);
    });
  });
}); 