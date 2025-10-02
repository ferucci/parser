import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Сервис для загрузки файлов по HTTP/HTTPS
 * Инкапсулирует логику скачивания и обработки ошибок
 */
export class DownloadService {
  /**
   * Скачивает файл по URL и сохраняет по указанному пути
   * @param {string} url - URL файла для скачивания
   * @param {string} filePath - Путь для сохранения файла
   * @returns {Promise<void>}
   */
  async downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      // Создаем директорию если не существует
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const file = fs.createWriteStream(filePath);

      protocol.get(url, (response) => {
        // Проверяем статус код
        if (response.statusCode !== 200) {
          reject(new Error(`Не удалось скачать файл. Код статуса: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

      }).on('error', (err) => {
        this.cleanupFile(filePath);
        reject(new Error(`Ошибка сети: ${err.message}`));
      });

      file.on('error', (err) => {
        this.cleanupFile(filePath);
        reject(new Error(`Ошибка записи файла: ${err.message}`));
      });

      // Таймаут 30 секунд
      response.setTimeout(30000, () => {
        this.cleanupFile(filePath);
        reject(new Error('Таймаут загрузки'));
      });
    });
  }

  /**
   * Удаляет файл в случае ошибки
   */
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Игнорируем ошибки при удалении
    }
  }

  /**
   * Проверяет доступность URL
   */
  async isUrlAccessible(url) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, (response) => {
        resolve(response.statusCode === 200);
      }).on('error', () => {
        resolve(false);
      }).setTimeout(5000, () => {
        resolve(false);
      });
    });
  }
}

export default DownloadService;