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
    // AbortController для управления прерыванием операции
    // современный API для отмены асинхронных операций
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      // Выбираем протокол (HTTP или HTTPS) в зависимости от URL
      const protocol = url.startsWith('https') ? https : http;

      // Создаем директорию если не существует
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Ожидаем получение ответа от сервера
      const response = await new Promise((resolve, reject) => {
        // Отправляем GET запрос с возможностью отмены через signal
        const req = protocol.get(url, { signal: controller.signal }, resolve);
        // Если произошла ошибка запроса - отклоняем промис
        req.on('error', reject);
      });

      if (response.statusCode !== 200) {
        throw new Error(`Не удалось скачать файл. Код статуса: ${response.statusCode}`);
      }

      // Создаем поток для записи файла на диск
      const file = fs.createWriteStream(filePath);

      return new Promise((resolve, reject) => {
        // Направляем данные из ответа сервера в файл
        // Это эффективно для больших файлов - данные не загружаются в память целиком
        response.pipe(file);

        // Событие 'finish' вызывается когда все данные записаны на диск
        file.on('finish', () => {
          file.close();  // Закрываем файловый поток
          clearTimeout(timeout);
          resolve();  // Успешное завершение загрузки
        });


        // Обработка ошибок записи файла
        file.on('error', (err) => {
          this.cleanupFile(filePath);  // Удаляем частично скачанный файл
          clearTimeout(timeout);
          reject(new Error(`Ошибка записи файла: ${err.message}`));
        });

        // Обработка ошибок при чтении данных из ответа
        response.on('error', (err) => {
          this.cleanupFile(filePath);
          clearTimeout(timeout);
          reject(new Error(`Ошибка сети: ${err.message}`));
        });
      });

    } catch (err) {
      this.cleanupFile(filePath);
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Таймаут загрузки');
      }
      throw err;
    }
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