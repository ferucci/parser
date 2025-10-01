import fs from 'fs/promises';
import { config } from '../../config/config.js';

/**
 * Сервис для работы с файлами
 * Отвечает за сохранение и чтение данных
 */
export class FileService {
  /**
   * Сохраняет данные в JSON файл
   * @param {string} filename - Имя файла
   * @param {any} data - Данные для сохранения
   * @param {boolean} pretty - Форматировать JSON
   */
  async saveJSON(filename, data, pretty = true) {
    try {
      const content = pretty ?
        JSON.stringify(data, null, 2) :
        JSON.stringify(data);

      await fs.writeFile(filename, content);
      return true;
    } catch (error) {
      throw new Error(`Ошибка сохранения файла ${filename}: ${error.message}`);
    }
  }

  /**
   * Читает данные из JSON файла
   */
  async readJSON(filename) {
    try {
      const content = await fs.readFile(filename, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Ошибка чтения файла ${filename}: ${error.message}`);
    }
  }

  /**
   * Сохраняет полные результаты парсинга
   */
  async saveFullResults(results) {
    return this.saveJSON(config.files.results, results);
  }

  /**
   * Сохраняет сводную статистику
   */
  async saveSummary(summary) {
    return this.saveJSON(config.files.summary, summary);
  }
}

export default FileService;