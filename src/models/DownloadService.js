import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Сервис для безопасной загрузки файлов по HTTP/HTTPS
 * Инкапсулирует логику скачивания, проверки безопасности и обработки ошибок
 */
export class DownloadService {
  constructor(options = {}) {
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB по умолчанию
    this.allowedExtensions = options.allowedExtensions || [
      // Изображения
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp',
      // Стили
      '.css', '.scss', '.less',
      // Скрипты
      '.js', '.mjs', '.cjs',
      // Шрифты
      '.woff', '.woff2', '.ttf', '.eot', '.otf',
      // Медиа
      '.mp4', '.webm', '.mp3', '.wav',
      // Данные
      '.json', '.xml', '.txt'
    ];
    this.blockedPatterns = options.blockedPatterns || [
      /\.php$/i,
      /\.exe$/i,
      /\.dll$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.sh$/i,
      /malware/i,
      /virus/i,
      /exploit/i
    ];
  }

  /**
   * Безопасно скачивает файл по URL с проверками безопасности
   * @param {string} url - URL файла для скачивания
   * @param {string} filePath - Путь для сохранения файла
   * @returns {Promise<{success: boolean, size: number, type: string}>}
   */
  async downloadFile(url, filePath) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 секунд

    try {
      // Проверяем URL перед загрузкой
      this.validateUrl(url);

      // Получаем информацию о файле перед загрузкой
      const fileInfo = await this.getFileInfo(url, controller.signal);

      // Проверяем размер файла
      this.validateFileSize(fileInfo.size);

      // Проверяем расширение файла
      this.validateFileExtension(url, fileInfo.type);

      const protocol = url.startsWith('https') ? https : http;

      // Создаем директорию если не существует
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Скачиваем файл с контролем размера
      const result = await this.downloadWithSizeControl(
        url,
        filePath,
        fileInfo.size,
        controller
      );

      clearTimeout(timeout);
      return result;

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
   * Скачивает файл с контролем размера в реальном времени
   */
  async downloadWithSizeControl(url, filePath, expectedSize, controller) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      let downloadedSize = 0;

      const req = protocol.get(url, { signal: controller.signal }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Не удалось скачать файл. Код статуса: ${response.statusCode}`));
          return;
        }

        const file = fs.createWriteStream(filePath);

        // Контролируем размер во время загрузки
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;

          if (downloadedSize > this.maxFileSize) {
            req.destroy();
            file.close();
            this.cleanupFile(filePath);
            reject(new Error(`Превышен максимальный размер файла: ${this.formatBytes(this.maxFileSize)}`));
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();

          // Проверяем конечный размер
          const finalSize = fs.statSync(filePath).size;
          if (finalSize > this.maxFileSize) {
            this.cleanupFile(filePath);
            reject(new Error(`Файл превысил максимальный размер после загрузки`));
            return;
          }

          resolve({
            success: true,
            size: finalSize,
            type: this.getFileTypeFromUrl(url)
          });
        });

        file.on('error', (err) => {
          this.cleanupFile(filePath);
          reject(new Error(`Ошибка записи файла: ${err.message}`));
        });
      });

      req.on('error', (err) => {
        this.cleanupFile(filePath);
        reject(new Error(`Ошибка сети: ${err.message}`));
      });
    });
  }

  /**
   * Получает информацию о файле перед загрузкой
   */
  async getFileInfo(url, signal) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.get(url, { signal }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Не удалось получить информацию о файле. Код статуса: ${response.statusCode}`));
          return;
        }

        const contentLength = response.headers['content-length'];
        const contentType = response.headers['content-type'];

        // Закрываем соединение, так как нам нужна только информация
        req.destroy();

        resolve({
          size: contentLength ? parseInt(contentLength) : 0,
          type: contentType || this.getFileTypeFromUrl(url)
        });
      });

      req.on('error', reject);
    });
  }

  /**
   * Проверяет валидность и безопасность URL
   */
  validateUrl(url) {
    if (!url) {
      throw new Error('URL не может быть пустым');
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('Неподдерживаемый протокол');
    }

    // Проверяем на заблокированные паттерны
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(url)) {
        throw new Error('URL содержит заблокированные паттерны');
      }
    }

    try {
      const urlObj = new URL(url);

      // Дополнительные проверки URL
      if (urlObj.username || urlObj.password) {
        throw new Error('URL не должен содержать учетные данные');
      }
    } catch (error) {
      throw new Error('Некорректный URL');
    }
  }

  /**
   * Проверяет размер файла
   */
  validateFileSize(size) {
    if (size > this.maxFileSize) {
      throw new Error(`Размер файла (${this.formatBytes(size)}) превышает максимально допустимый (${this.formatBytes(this.maxFileSize)})`);
    }
  }

  /**
   * Проверяет расширение файла
   */
  validateFileExtension(url, contentType) {
    const extension = path.extname(new URL(url).pathname).toLowerCase();

    if (!extension) {
      throw new Error('Файл не имеет расширения');
    }

    if (!this.allowedExtensions.includes(extension)) {
      throw new Error(`Расширение файла ${extension} не разрешено`);
    }

    // Дополнительная проверка по MIME-типу
    if (contentType) {
      this.validateContentType(contentType, extension);
    }
  }

  /**
   * Проверяет соответствие MIME-типа и расширения
   */
  validateContentType(contentType, extension) {
    const typeMappings = {
      '.js': ['application/javascript', 'application/x-javascript', 'text/javascript'],
      '.css': ['text/css'],
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.gif': ['image/gif'],
      '.svg': ['image/svg+xml'],
      '.woff': ['font/woff', 'application/font-woff'],
      '.woff2': ['font/woff2', 'application/font-woff2'],
      '.ttf': ['font/ttf', 'application/font-ttf'],
    };

    if (typeMappings[extension] && !typeMappings[extension].includes(contentType.split(';')[0])) {
      throw new Error(`MIME-тип ${contentType} не соответствует расширению ${extension}`);
    }
  }

  /**
   * Определяет тип файла по URL
   */
  getFileTypeFromUrl(url) {
    const extension = path.extname(new URL(url).pathname).toLowerCase();
    const typeMap = {
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2'
    };

    return typeMap[extension] || 'application/octet-stream';
  }

  /**
   * Форматирует байты в читаемый вид
   */
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
   * Проверяет доступность URL с учетом ограничений безопасности
   */
  async isUrlAccessible(url) {
    try {
      this.validateUrl(url);
      const fileInfo = await this.getFileInfo(url);
      this.validateFileSize(fileInfo.size);
      this.validateFileExtension(url, fileInfo.type);
      return true;
    } catch {
      return false;
    }
  }
}

export default DownloadService;