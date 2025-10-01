import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from '../../config/config.js';

/**
 * Модель парсера - отвечает за бизнес-логику парсинга
 * Обрабатывает HTTP-запросы и HTML-парсинг
 */
export class ParserModel {
  /**
   * Загружает страницу по URL
   * @param {string} url - URL для загрузки
   * @returns {Promise<string>} HTML содержимое страницы
   */
  async fetchPage(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': config.parser.userAgent
        },
        timeout: config.parser.timeout
      });
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка загрузки страницы ${url}: ${error.message}`);
    }
  }

  /**
   * Парсит HTML и извлекает структурированные данные
   * @param {string} html - HTML содержимое
   * @param {string} baseUrl - Базовый URL для разрешения относительных путей
   * @returns {Object} Структурированные данные страницы
   */
  parseHTML(html, baseUrl) {
    const $ = cheerio.load(html);

    return {
      title: this.extractTitle($),
      scripts: this.extractScripts($, baseUrl),
      styles: this.extractStyles($, baseUrl),
      htmlLength: html.length,
      fullHTML: html // Опционально - для отладки
    };
  }

  /**
   * Извлекает заголовок страницы
   */
  extractTitle($) {
    return $('title').text().trim() || 'No title';
  }

  /**
   * Извлекает информацию о скриптах
   */
  extractScripts($, baseUrl) {
    const scripts = [];

    $('script').each((index, element) => {
      const script = $(element);
      const src = script.attr('src');
      const content = script.html();

      const scriptData = {
        index: index + 1,
        src: src,
        type: script.attr('type') || 'text/javascript',
        hasContent: !!content && content.trim().length > 0,
        contentLength: content ? content.length : 0,
        isExternal: !!src
      };

      if (src) {
        scriptData.fullUrl = this.resolveUrl(src, baseUrl);
      }

      scripts.push(scriptData);
    });

    return scripts;
  }

  /**
   * Извлекает информацию о стилях
   */
  extractStyles($, baseUrl) {
    const styles = [];

    $('link[rel="stylesheet"], style').each((index, element) => {
      const style = $(element);
      const href = style.attr('href');
      const content = style.html();

      const styleData = {
        index: index + 1,
        tagName: style.get(0).tagName.toLowerCase(),
        href: href,
        type: style.attr('type') || 'text/css',
        rel: style.attr('rel'),
        media: style.attr('media'),
        hasContent: !!content && content.trim().length > 0,
        contentLength: content ? content.length : 0,
        isExternal: !!href
      };

      if (href) {
        styleData.fullUrl = this.resolveUrl(href, baseUrl);
      }

      styles.push(styleData);
    });

    return styles;
  }

  /**
   * Преобразует относительный URL в абсолютный
   */
  resolveUrl(url, baseUrl) {
    try {
      return new URL(url, baseUrl).href;
    } catch (error) {
      return url; // Возвращаем оригинальный URL если преобразование невозможно
    }
  }

  /**
   * Создает сводную статистику из полных данных
   */
  createSummary(data) {
    return {
      url: data.url,
      title: data.title,
      scripts: data.scriptsCount,
      externalScripts: data.externalScriptsCount,
      styles: data.stylesCount,
      externalStyles: data.externalStylesCount,
      htmlLength: data.htmlLength,
      timestamp: data.timestamp
    };
  }
}

export default ParserModel;