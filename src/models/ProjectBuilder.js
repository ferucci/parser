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
  constructor(projectName = 'project') {
    this.projectName = projectName;
    this.projectPath = path.join(process.cwd(), projectName);
    this.downloadService = new DownloadService();
    this.stats = {
      scriptsDownloaded: 0,
      stylesDownloaded: 0,
      imagesDownloaded: 0,
      errors: 0
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
      path.join(this.projectPath, 'fonts')
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
   * Скачивает и сохраняет скрипты
   */
  async downloadScripts(scripts) {
    const results = [];

    for (const script of scripts) {
      if (script.fullUrl && this.isDownloadableUrl(script.fullUrl)) {
        try {
          const fileName = this.generateScriptFilename(script);
          const filePath = path.join(this.projectPath, 'js', fileName);

          await this.downloadService.downloadFile(script.fullUrl, filePath);

          results.push({
            originalUrl: script.fullUrl,
            localPath: path.join('js', fileName),
            success: true
          });

          this.stats.scriptsDownloaded++;

        } catch (error) {
          results.push({
            originalUrl: script.fullUrl,
            error: error.message,
            success: false
          });
          this.stats.errors++;
        }
      }
    }

    return results;
  }

  /**
   * Скачивает и сохраняет стили
   */
  async downloadStyles(styles) {
    const results = [];

    for (const style of styles) {
      if (style.fullUrl && this.isDownloadableUrl(style.fullUrl)) {
        try {
          const fileName = this.generateStyleFilename(style);
          const filePath = path.join(this.projectPath, 'css', fileName);

          await this.downloadService.downloadFile(style.fullUrl, filePath);

          results.push({
            originalUrl: style.fullUrl,
            localPath: path.join('css', fileName),
            success: true
          });

          this.stats.stylesDownloaded++;

        } catch (error) {
          results.push({
            originalUrl: style.fullUrl,
            error: error.message,
            success: false
          });
          this.stats.errors++;
        }
      }
    }

    return results;
  }

  /**
 * Скачивает и сохраняет изображения
 */
  async downloadImages(images) {
    const results = [];

    for (const image of images) {
      if (image.fullUrl && this.isDownloadableUrl(image.fullUrl)) {
        try {
          const fileName = this.generateImageFilename(image);
          const filePath = path.join(this.projectPath, 'images', fileName);

          await this.downloadService.downloadFile(image.fullUrl, filePath);

          results.push({
            originalUrl: image.fullUrl,
            localPath: path.join('images', fileName),
            alt: image.alt,
            success: true
          });

          this.stats.imagesDownloaded++;

        } catch (error) {
          results.push({
            originalUrl: image.fullUrl,
            error: error.message,
            success: false
          });
          this.stats.errors++;
        }
      }
    }

    return results;
  }

  /**
 * Генерирует имя файла для изображения
 */
  generateImageFilename(image) {
    if (image.src) {
      const urlParts = image.src.split('/');
      let originalName = urlParts[urlParts.length - 1];

      // Если в имени файла нет расширения, добавляем .jpg по умолчанию
      if (originalName && !originalName.includes('.')) {
        originalName += '.jpg';
      }

      return originalName || `image_${image.index}.jpg`;
    }
    return `image_${image.index}.jpg`;
  }

  /**
   * Генерирует имя файла для скрипта
   */
  generateScriptFilename(script) {
    if (script.src) {
      const urlParts = script.src.split('/');
      const originalName = urlParts[urlParts.length - 1];
      return originalName || `script_${script.index}.js`;
    }
    return `script_${script.index}.js`;
  }

  /**
   * Генерирует имя файла для стиля
   */
  generateStyleFilename(style) {
    if (style.href) {
      const urlParts = style.href.split('/');
      const originalName = urlParts[urlParts.length - 1];
      return originalName || `style_${style.index}.css`;
    }
    return `style_${style.index}.css`;
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
      errors: 0
    };
  }
}

export default ProjectBuilder;