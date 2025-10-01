import { EventEmitter } from 'events';
import { config } from '../../config/config.js';
import FileService from '../models/FileService.js';
import ParserModel from '../models/ParserModel.js';
import QueueModel from '../models/QueueModel.js';
import ConsoleView from '../views/ConsoleView.js';

/**
 * Главный контроллер парсера
 * Координирует взаимодействие между моделями и представлениями
 * Обрабатывает бизнес-логику приложения
 */
export class ParserController extends EventEmitter {
  constructor(options = {}) {
    super();

    // Инициализация компонентов MVC
    this.parserModel = new ParserModel();
    this.queueModel = new QueueModel();
    this.fileService = new FileService();
    this.consoleView = new ConsoleView();

    // Настройки
    this.delay = options.delay || config.parser.delay;
    this.concurrent = options.concurrent || config.parser.concurrent;

    // Настройка обработчиков событий
    this.setupEventHandlers();
  }

  /**
   * Настраивает обработчики событий между компонентами
   */
  setupEventHandlers() {
    // Пробрасываем события в представление
    this.on(config.events.DATA_PARSED, (data) => {
      this.consoleView.displayParsedData(data);
    });

    this.on(config.events.PROCESSING_ERROR, (error) => {
      this.consoleView.displayError(error);
    });
  }

  /**
   * Добавляет URL в очередь на обработку
   */
  addToQueue(url) {
    this.queueModel.addToQueue(url);
    this.consoleView.displayMessage(`Добавлен в очередь: ${url}`);
  }

  /**
   * Основной метод обработки очереди
   */
  async processQueue() {
    this.consoleView.displayMessage(`🚀 Запуск обработки очереди...`);

    while (!this.queueModel.isAllFinished()) {
      if (this.queueModel.canProcessMore(this.concurrent)) {
        const url = this.queueModel.getNextUrl();
        this.queueModel.startProcessing();

        this.processUrl(url).finally(() => {
          this.queueModel.finishProcessing();
        });
      }

      await this.sleep(100);
    }

    this.emit(config.events.QUEUE_FINISHED);
  }

  /**
   * Обрабатывает отдельный URL
   */
  async processUrl(url) {
    try {
      this.emit(config.events.PROCESSING_STARTED, url);

      // Искусственная задержка для соблюдения лимитов
      await this.sleep(this.delay);

      // Загрузка и парсинг страницы
      const html = await this.parserModel.fetchPage(url);
      const parsedData = this.parserModel.parseHTML(html, url);

      // Формируем полный результат
      const result = {
        url,
        ...parsedData,
        scriptsCount: parsedData.scripts.length,
        externalScriptsCount: parsedData.scripts.filter(s => s.isExternal).length,
        inlineScriptsCount: parsedData.scripts.filter(s => !s.isExternal && s.hasContent).length,
        stylesCount: parsedData.styles.length,
        externalStylesCount: parsedData.styles.filter(s => s.isExternal).length,
        inlineStylesCount: parsedData.styles.filter(s => !s.isExternal && s.hasContent).length
      };

      // Сохраняем результат
      this.queueModel.addResult(result);

      // Отправляем событие о завершении парсинга
      this.emit(config.events.DATA_PARSED, { url, data: result });
      this.emit(config.events.PROCESSING_FINISHED, url);

    } catch (error) {
      this.emit(config.events.PROCESSING_ERROR, { url, error: error.message });
    }
  }

  /**
   * Сохраняет результаты в файлы
   */
  async saveResults() {
    try {
      const allResults = this.queueModel.getResults();

      // Сохраняем полные данные
      await this.fileService.saveFullResults(allResults);

      // Создаем и сохраняем сводку
      const summary = allResults.map(result =>
        this.parserModel.createSummary(result)
      );
      await this.fileService.saveSummary(summary);

      this.consoleView.displaySuccess('✅ Результаты сохранены в файлы');
      return true;
    } catch (error) {
      this.consoleView.displayError(`❌ Ошибка сохранения: ${error.message}`);
      return false;
    }
  }

  /**
   * Вспомогательная функция задержки
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Возвращает статистику обработки
   */
  getStats() {
    const results = this.queueModel.getResults();
    return {
      totalProcessed: results.length,
      totalUrlsInQueue: this.queueModel.getQueueLength(),
      currentlyProcessing: this.queueModel.processing
    };
  }
}

export default ParserController;