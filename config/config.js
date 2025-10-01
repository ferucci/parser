/**
 * Конфигурация приложения
 * Централизованное хранение всех настроек для легкого управления
 */
export const config = {
  parser: {
    delay: 1000,           // Задержка между запросами (мс)
    concurrent: 1,         // Количество одновременных запросов
    timeout: 10000,        // Таймаут запросов (мс)
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },

  files: {
    results: 'parsing-results.json',    // Файл для полных результатов
    summary: 'parsing-summary.json'     // Файл для сводки
  },

  events: {
    DATA_PARSED: 'dataParsed',
    QUEUE_FINISHED: 'queueFinished',
    PROCESSING_STARTED: 'processingStarted',
    PROCESSING_FINISHED: 'processingFinished',
    PROCESSING_ERROR: 'processingError'
  }
};

export default config;