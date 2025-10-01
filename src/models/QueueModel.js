/**
 * Модель очереди - управляет состоянием и логикой очереди
 */
export class QueueModel {
  constructor() {
    this.queue = [];
    this.processing = 0;
    this.results = [];
  }

  /**
   * Добавляет URL в очередь
   */
  addToQueue(url) {
    this.queue.push(url);
  }

  /**
   * Удаляет URL из начала очереди
   */
  getNextUrl() {
    return this.queue.shift();
  }

  /**
   * Проверяет, пуста ли очередь
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Возвращает количество элементов в очереди
   */
  getQueueLength() {
    return this.queue.length;
  }

  /**
   * Увеличивает счетчик обрабатываемых задач
   */
  startProcessing() {
    this.processing++;
  }

  /**
   * Уменьшает счетчик обрабатываемых задач
   */
  finishProcessing() {
    this.processing--;
  }

  /**
   * Проверяет, можно ли начать обработку новой задачи
   */
  canProcessMore(concurrentLimit) {
    return this.processing < concurrentLimit && !this.isEmpty();
  }

  /**
   * Проверяет, завершена ли вся обработка
   */
  isAllFinished() {
    return this.isEmpty() && this.processing === 0;
  }

  /**
   * Добавляет результат парсинга
   */
  addResult(result) {
    this.results.push({
      ...result,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Возвращает все результаты
   */
  getResults() {
    return this.results;
  }

  /**
   * Очищает результаты (для нового запуска)
   */
  clearResults() {
    this.results = [];
  }
}

export default QueueModel;