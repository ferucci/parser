import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DownloadService from './DownloadService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Модель для сборки проекта на основе спарсенных данных
 * Отвечает за создание структуры папок и управление файлами
 */
export class ProjectBuilder {
  constructor(projectName = 'project', options = {}) {
    this.projectName = projectName;
    this.projectPath = path.join(process.cwd(), projectName);

    // Настройки безопасности загрузки
    this.downloadService = new DownloadService({
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      allowedExtensions: options.allowedExtensions,
      blockedPatterns: options.blockedPatterns
    });

    this.stats = {
      scriptsDownloaded: 0,
      stylesDownloaded: 0,
      imagesDownloaded: 0,
      otherFilesDownloaded: 0,
      errors: 0,
      securityBlocks: 0
    };
  }

  /**
   * Создает структуру папок проекта
   */
  createProjectStructure() {
    const directories = [
      this.projectPath,
      path.join(this.projectPath, 'js'),
      path.join(this.projectPath, 'css'),
      path.join(this.projectPath, 'images'),
      path.join(this.projectPath, 'fonts'),
      path.join(this.projectPath, 'media'),
      path.join(this.projectPath, 'data')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    return directories;
  }

  /**
   * Сохраняет HTML файл
   */
  saveHTML(htmlContent, filename = 'index.html') {
    const htmlFilePath = path.join(this.projectPath, filename);
    fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
    return htmlFilePath;
  }

  /**
   * Универсальный метод для скачивания файлов с проверкой безопасности
   */
  async downloadResource(resource, targetFolder, fileType = 'file') {
    if (!resource.fullUrl || !this.isDownloadableUrl(resource.fullUrl)) {
      return {
        success: false,
        error: 'Некорректный URL',
        security: true
      };
    }

    try {
      const fileName = this.generateSafeFilename(resource, targetFolder);
      const filePath = path.join(this.projectPath, targetFolder, fileName);

      const result = await this.downloadService.downloadFile(resource.fullUrl, filePath);

      return {
        success: true,
        originalUrl: resource.fullUrl,
        localPath: path.join(targetFolder, fileName),
        size: result.size,
        type: result.type,
        security: true
      };

    } catch (error) {
      const isSecurityError = error.message.includes('не разрешено') ||
        error.message.includes('заблокированные') ||
        error.message.includes('превышает');

      if (isSecurityError) {
        this.stats.securityBlocks++;
      }

      return {
        success: false,
        originalUrl: resource.fullUrl,
        error: error.message,
        security: isSecurityError
      };
    }
  }

  /**
   * Скачивает и сохраняет скрипты
   */
  async downloadScripts(scripts) {
    const results = [];

    for (const script of scripts) {
      const result = await this.downloadResource(script, 'js', 'script');

      if (result.success) {
        this.stats.scriptsDownloaded++;
      } else if (!result.security) {
        this.stats.errors++;
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Скачивает и сохраняет стили
   */
  async downloadStyles(styles) {
    const results = [];

    for (const style of styles) {
      const result = await this.downloadResource(style, 'css', 'style');

      if (result.success) {
        this.stats.stylesDownloaded++;
      } else if (!result.security) {
        this.stats.errors++;
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Скачивает и сохраняет изображения
   */
  async downloadImages(images) {
    const results = [];

    for (const image of images) {
      const result = await this.downloadResource(image, 'images', 'image');

      if (result.success) {
        this.stats.imagesDownloaded++;
      } else if (!result.security) {
        this.stats.errors++;
      }

      results.push(result);
    }

    return results;
  }

  /**
   * 🆕 Скачивает другие ресурсы (шрифты, медиа и т.д.)
   */
  async downloadOtherResources(resources, resourceType = 'other') {
    const results = [];

    for (const resource of resources) {
      let targetFolder = 'data';

      // Определяем папку назначения по типу ресурса
      if (resourceType === 'font') targetFolder = 'fonts';
      if (resourceType === 'media') targetFolder = 'media';

      const result = await this.downloadResource(resource, targetFolder, resourceType);

      if (result.success) {
        this.stats.otherFilesDownloaded++;
      } else if (!result.security) {
        this.stats.errors++;
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Генерирует безопасное имя файла
   */
  generateSafeFilename(resource, targetFolder) {
    let originalName = '';

    if (resource.src) {
      const urlParts = resource.src.split('/');
      originalName = urlParts[urlParts.length - 1];
    } else if (resource.href) {
      const urlParts = resource.href.split('/');
      originalName = urlParts[urlParts.length - 1];
    }

    // Очищаем имя файла от потенциально опасных символов
    if (originalName) {
      originalName = originalName
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
    }

    // Если имя файла небезопасно или отсутствует, генерируем новое
    if (!originalName || originalName.length > 255) {
      const extension = this.getFileExtension(resource, targetFolder);
      originalName = `${targetFolder}_${resource.index}${extension}`;
    }

    return originalName;
  }

  /**
   * Определяет расширение файла на основе типа ресурса и URL
   */
  getFileExtension(resource, targetFolder) {
    // Пытаемся определить расширение из URL
    if (resource.src || resource.href) {
      const url = resource.src || resource.href;
      const extension = path.extname(new URL(url, 'http://localhost').pathname);

      if (extension && extension.length < 10) { // Защита от длинных расширений
        return extension.toLowerCase();
      }
    }

    // Расширения по умолчанию для разных типов ресурсов
    const defaultExtensions = {
      'js': '.js',
      'css': '.css',
      'images': '.jpg',
      'fonts': '.woff2',
      'media': '.mp4',
      'data': '.bin'
    };

    return defaultExtensions[targetFolder] || '.bin';
  }

  /**
   * Проверяет, можно ли скачать файл по URL
   */
  isDownloadableUrl(url) {
    return url &&
      !url.startsWith('data:') &&
      !url.startsWith('blob:') &&
      (url.startsWith('http://') || url.startsWith('https://'));
  }

  /**
   * Создает отчет о сборке проекта
   */
  generateReport() {
    return {
      projectPath: this.projectPath,
      stats: { ...this.stats },
      security: {
        maxFileSize: this.downloadService.maxFileSize,
        allowedExtensions: this.downloadService.allowedExtensions.length,
        blockedPatterns: this.downloadService.blockedPatterns.length
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Очищает статистику для нового запуска
   */
  clearStats() {
    this.stats = {
      scriptsDownloaded: 0,
      stylesDownloaded: 0,
      imagesDownloaded: 0,
      otherFilesDownloaded: 0,
      errors: 0,
      securityBlocks: 0
    };
  }
}

export default ProjectBuilder;