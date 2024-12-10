import { Logger, LogLevel } from '../Logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create spies for console methods
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Create logger instance
    logger = new Logger('TestContext');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('debug', () => {
    it('should log debug messages in development environment', () => {
      // Force development environment
      process.env.NODE_ENV = 'development';
      
      logger.debug('Test debug message', { data: 'test' });

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] [TestContext] Test debug message'),
        { data: 'test' }
      );
    });

    it('should not log debug messages in production environment', () => {
      // Force production environment
      process.env.NODE_ENV = 'production';
      
      logger.debug('Test debug message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message', { data: 'test' });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [TestContext] Test info message'),
        { data: 'test' }
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message', { data: 'test' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] [TestContext] Test warning message'),
        { data: 'test' }
      );
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Test error message', new Error('Test error'));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [TestContext] Test error message'),
        new Error('Test error')
      );
    });

    it('should log additional error tracking information in production', () => {
      // Force production environment
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Test error');
      logger.error('Test error message', error);

      // Verify error tracking logs
      expect(consoleErrorSpy).toHaveBeenCalledWith('=== ERROR TRACKING ===');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Context:', 'TestContext');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Message:', 'Test error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Arguments:', [error]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Stack:', expect.any(String));
      expect(consoleErrorSpy).toHaveBeenCalledWith('===================');
    });
  });

  describe('log format', () => {
    it('should include timestamp, level, and context in log messages', () => {
      const timestamp = new Date().toISOString().split('T')[0]; // Get just the date part
      logger.info('Test message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`\\[${timestamp}.*\\] \\[INFO\\] \\[TestContext\\] Test message`)
        )
      );
    });
  });
}); 