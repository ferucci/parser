import FileService from '../models/FileService.js';
import ProjectBuilder from '../models/ProjectBuilder.js';
import ProjectView from '../views/ProjectView.js';

/**
 * Контроллер для управления сборкой проектов
 * Координирует процесс создания проекта из спарсенных данных
 */
export class ProjectController {
  constructor() {
    this.projectBuilder = null;
    this.fileService = new FileService();
    this.projectView = new ProjectView();
  }

  /**
   * Создает проект на основе данных парсинга
   * @param {string} resultsFile - Путь к файлу с результатами парсинга
   * @param {string} projectName - Имя проекта
   * @returns {Promise<Object>} Результат сборки
   */
  async buildProjectFromResults(resultsFile, projectName = 'project') {
    try {
      this.projectView.displayStartMessage(projectName);

      // Загружаем результаты парсинга
      const parsingResults = await this.fileService.readJSON(resultsFile);

      if (!parsingResults || parsingResults.length === 0) {
        throw new Error('Файл результатов парсинга пуст или не найден');
      }

      // Берем первую запись (можно расширить для множества URL)
      const data = parsingResults[0];

      // Инициализируем сборщик проекта
      this.projectBuilder = new ProjectBuilder(projectName);

      // Создаем структуру папок
      this.projectBuilder.createProjectStructure();
      this.projectView.displayStructureCreated();

      // Сохраняем HTML
      const htmlPath = this.projectBuilder.saveHTML(data.fullHTML);
      this.projectView.displayHTMLSaved(htmlPath);

      // Скачиваем скрипты
      this.projectView.displayDownloadStart('скриптов');
      const scriptResults = await this.projectBuilder.downloadScripts(data.scripts);
      this.projectView.displayDownloadResults('скриптов', scriptResults);

      // Скачиваем стили
      this.projectView.displayDownloadStart('стилей');
      const styleResults = await this.projectBuilder.downloadStyles(data.styles);
      this.projectView.displayDownloadResults('стилей', styleResults);

      // Генерируем отчет
      const report = this.projectBuilder.generateReport();
      this.projectView.displayFinalReport(report);

      return {
        success: true,
        report: report,
        projectPath: this.projectBuilder.projectPath
      };

    } catch (error) {
      this.projectView.displayError(error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Создает проект из конкретного объекта данных
   * @param {Object} parsedData - Данные из парсера
   * @param {string} projectName - Имя проекта
   */
  async buildProjectFromData(parsedData, projectName = 'project') {
    try {
      this.projectView.displayStartMessage(projectName);

      this.projectBuilder = new ProjectBuilder(projectName);
      this.projectBuilder.createProjectStructure();
      this.projectView.displayStructureCreated();

      // Сохраняем HTML
      const htmlPath = this.projectBuilder.saveHTML(parsedData.fullHTML);
      this.projectView.displayHTMLSaved(htmlPath);

      // Скачиваем ресурсы
      const scriptResults = await this.projectBuilder.downloadScripts(parsedData.scripts);
      const styleResults = await this.projectBuilder.downloadStyles(parsedData.styles);

      const report = this.projectBuilder.generateReport();
      this.projectView.displayFinalReport(report);

      return {
        success: true,
        report: report
      };

    } catch (error) {
      this.projectView.displayError(error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Возвращает статистику текущего проекта
   */
  getProjectStats() {
    return this.projectBuilder ? this.projectBuilder.generateReport() : null;
  }
}

export default ProjectController;